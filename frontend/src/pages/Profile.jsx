import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser, deleteUser, verifyUser } from '../api/userService';
import { getPosts, getLikedPosts, getSavedPosts, getDraftPosts, updatePost, deletePost } from '../api/postService';
import { followUser, unfollowUser, getFollowers, getFollowing, addInterest, removeInterest } from '../api/relationshipService';
import { getTopics } from '../api/topicService';
import { useAuth } from '../context/AuthContext';
import TweetList from '../components/post/TweetList';
import Modal from '../components/shared/Modal';
import Spinner from '../components/shared/Spinner';
import Button from '../components/shared/Button';
import UserCard from '../components/user/UserCard';
import verifiedIcon from '../assets/verified.png';
import editIcon from '../assets/edit.png';
import deleteIcon from '../assets/delete.png';

const BADGE_META = {
  creator:       { color: '#1d4ed8', label: 'Creador' },
  brand:         { color: '#7c3aed', label: 'Marca' },
  public_figure: { color: '#b45309', label: 'Figura Pública' },
};

const BANNER_COLORS = [
  'linear-gradient(135deg, #1d4ed8, #7c3aed)',
  'linear-gradient(135deg, #00ba7c, #1d9bf0)',
  'linear-gradient(135deg, #f4212e, #ff6b6b)',
  'linear-gradient(135deg, #b45309, #f59e0b)',
];

const TABS = ['Posts', 'Guardados', 'Me gusta', 'Borradores'];
const TAB_KEYS = { 'Posts': 'Posts', 'Guardados': 'Saved', 'Me gusta': 'Liked', 'Borradores': 'Drafts' };

const BTN_STYLE = { padding: '8px 18px', fontSize: 14, minWidth: 130 };

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAuth();

  const [user, setUser]                       = useState(null);
  const [posts, setPosts]                     = useState([]);
  const [activeTab, setActiveTab]             = useState('Posts');
  const [loading, setLoading]                 = useState(true);
  const [isFollowing, setIsFollowing]         = useState(false);
  const [followers, setFollowers]             = useState([]);
  const [following, setFollowing]             = useState([]);
  const [showFollowers, setShowFollowers]     = useState(false);
  const [showFollowing, setShowFollowing]     = useState(false);
  const [showEdit, setShowEdit]               = useState(false);
  const [showVerify, setShowVerify]           = useState(false);
  const [editForm, setEditForm]               = useState({});
  const [tabLoading, setTabLoading]           = useState(false);
  const [allTopics, setAllTopics]             = useState([]);
  const [selectedTopics, setSelectedTopics]   = useState([]);
  const [verifyBadge, setVerifyBadge]         = useState('creator');
  const [verifyLoading, setVerifyLoading]     = useState(false);
  const [verifyError, setVerifyError]         = useState('');
  const [dismissVerifyBanner, setDismissVerifyBanner] = useState(false);
  const [editingDraft, setEditingDraft]       = useState(null); // { id, title, description, visibility }

  const isOwn = currentUser?.id === id;
  const bannerGradient = BANNER_COLORS[(id?.charCodeAt(0) ?? 0) % BANNER_COLORS.length];

  // Load user + topics + follow state
  useEffect(() => {
    setLoading(true);
    setActiveTab('Posts');
    setDismissVerifyBanner(false);

    getUserById(id)
      .then(u => {
        setUser(u);
        setEditForm({ username: u.username ?? '', biography: u.biography ?? '', location: u.location ?? '' });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getTopics({ isActive: true, limit: 50 })
      .then(res => setAllTopics(res.data ?? []))
      .catch(() => {});

    if (currentUser && currentUser.id !== id) {
      getFollowing(currentUser.id, { limit: 500 })
        .then(res => {
          const list = res.data ?? [];
          setIsFollowing(list.some(u => u.id === id));
        })
        .catch(() => {});
    }
  }, [id, currentUser?.id]);

  // Load posts tab on user change
  useEffect(() => {
    loadTabData('Posts');
  }, [id]);

  const loadTabData = async (tab) => {
    setTabLoading(true);
    try {
      const key = TAB_KEYS[tab] ?? tab;
      let res;
      if (key === 'Posts')  res = await getPosts({ authorId: id, isDraft: false, limit: 20 });
      if (key === 'Saved')  res = await getSavedPosts(id, { limit: 20 });
      if (key === 'Liked')  res = await getLikedPosts(id, { limit: 20 });
      if (key === 'Drafts') res = await getDraftPosts(id, { limit: 20 });
      setPosts(res?.data ?? []);
    } catch {
      setPosts([]);
    }
    setTabLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    loadTabData(tab);
  };

  const handleFollow = async () => {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.id, id);
        setUser(u => u ? { ...u, followersCount: Math.max(0, (u.followersCount ?? 1) - 1) } : u);
      } else {
        await followUser(currentUser.id, id);
        setUser(u => u ? { ...u, followersCount: (u.followersCount ?? 0) + 1 } : u);
      }
      setIsFollowing(f => !f);
    } catch {}
  };

  const handleEditSave = async () => {
    try {
      const updated = await updateUser(id, editForm);
      setUser(updated);
      if (isOwn) setCurrentUser(u => ({ ...u, ...editForm }));

      const oldTopics = user.topics || [];
      for (const topic of oldTopics) {
        if (!selectedTopics.includes(topic.id)) await removeInterest(id, topic.id).catch(() => {});
      }
      for (const topicId of selectedTopics) {
        if (!oldTopics.some(t => t.id === topicId)) await addInterest(id, topicId).catch(() => {});
      }
      setShowEdit(false);
    } catch {}
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('¿Eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    try {
      await deleteUser(id);
      navigate('/login');
    } catch {}
  };

  const handleVerify = async () => {
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const updated = await verifyUser(id, verifyBadge);
      setUser({ ...updated, badge: verifyBadge, verifiedAt: new Date().toISOString().split('T')[0] });
      if (isOwn) setCurrentUser(u => ({ ...u, badge: verifyBadge }));
      setShowVerify(false);
    } catch (err) {
      setVerifyError(err?.message ?? 'Error al verificar. Intenta de nuevo.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const loadFollowers = async () => {
    const res = await getFollowers(id, { limit: 50 });
    setFollowers(res.data ?? []);
    setShowFollowers(true);
  };

  const loadFollowing = async () => {
    const res = await getFollowing(id, { limit: 50 });
    setFollowing(res.data ?? []);
    setShowFollowing(true);
  };

  const handlePublishDraft = async (post) => {
    if (!window.confirm('¿Publicar este borrador?')) return;
    try {
      await updatePost(post.id, { isDraft: false, visibility: 'public' });
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch {}
  };

  const handleDeleteDraft = async (postId) => {
    if (!window.confirm('¿Eliminar este borrador?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {}
  };

  const handleSaveDraftEdit = async () => {
    if (!editingDraft) return;
    try {
      await updatePost(editingDraft.id, {
        title: editingDraft.title,
        description: editingDraft.description,
        visibility: editingDraft.visibility,
      });
      setPosts(prev => prev.map(p =>
        p.id === editingDraft.id
          ? { ...p, title: editingDraft.title, description: editingDraft.description, visibility: editingDraft.visibility }
          : p
      ));
      setEditingDraft(null);
    } catch {}
  };

  if (loading) return <Spinner />;
  if (!user) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Usuario no encontrado.</p>;

  const badge = user.badge ? BADGE_META[user.badge] : null;

  return (
    <div>
      {/* ── Banner ── */}
      <div style={{ height: 160, background: bannerGradient }} />

      {/* ── Avatar + action buttons ── */}
      <div style={{
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: -48,
        marginBottom: 12,
        position: 'relative',
        zIndex: 2,
      }}>
        {/* Avatar overlapping banner */}
        <div style={{
          width: 116, height: 116, borderRadius: '50%',
          background: 'var(--accent)',
          border: '4px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 38, color: '#fff',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>
          {user.username?.[0]?.toUpperCase()}
        </div>

        {/* Buttons pushed below the banner line */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 24 }}>
          {isOwn ? (
            <>
              <Button
                variant="outline"
                style={BTN_STYLE}
                onClick={() => {
                  setShowEdit(true);
                  setSelectedTopics(user.topics?.map(t => t.id) || []);
                }}
              >
                Editar perfil
              </Button>
              <Button
                variant="danger"
                style={BTN_STYLE}
                onClick={handleDeleteAccount}
              >
                Eliminar cuenta
              </Button>
            </>
          ) : (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              style={BTN_STYLE}
              onClick={handleFollow}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </Button>
          )}
        </div>
      </div>

      {/* ── User info ── */}
      <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800 }}>{user.username}</h1>
          {(user.badge || user.verifiedAt) && (
            <img src={verifiedIcon} alt="Verified" title={ `Verificado: ${badge ? badge.label : 'Sin información'}`} style={{ width: 24, height: 24 }} />
          )}
          {badge && (
            <span style={{
              background: badge.color, color: '#fff',
              fontSize: 11, padding: '2px 9px', borderRadius: 9999, fontWeight: 600,
            }}>
              {badge.label}
            </span>
          )}
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 10 }}>@{user.username}</p>

        {user.biography && (
          <p style={{ fontSize: 15, marginBottom: 10, lineHeight: 1.5 }}>{user.biography}</p>
        )}

        {user.location && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 8 }}>
            {user.location}
          </p>
        )}

        {user.joinedAt && (
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 10 }}>
            Se unió en{' '}
            {new Date(user.joinedAt).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
          </p>
        )}

        {/* Follower / Following counters */}
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={loadFollowing}
            style={{ background: 'transparent', color: 'inherit', fontSize: 15, cursor: 'pointer', padding: 0 }}
          >
            <strong>{user.followingCount ?? 0}</strong>
            <span style={{ color: 'var(--text-muted)' }}> Siguiendo</span>
          </button>
          <button
            onClick={loadFollowers}
            style={{ background: 'transparent', color: 'inherit', fontSize: 15, cursor: 'pointer', padding: 0 }}
          >
            <strong>{user.followersCount ?? 0}</strong>
            <span style={{ color: 'var(--text-muted)' }}> Seguidores</span>
          </button>
        </div>
      </div>

      {/* ── Verification banner (own profile, not yet verified) ── */}
      {isOwn && !user.badge && !user.verifiedAt && !dismissVerifyBanner && (
        <div style={{
          margin: '12px 16px',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #0d2d1a, #0a3d2e)',
          border: '1px solid #00ba7c44',
          borderRadius: 12,
          position: 'relative',
        }}>
          <button
            onClick={() => setDismissVerifyBanner(true)}
            style={{
              position: 'absolute', top: 10, right: 12,
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 16, cursor: 'pointer', lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <strong style={{ fontSize: 15 }}>Aún no estás verificado</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Obtén la insignia de verificación y muestra el tipo de tu cuenta.
          </p>
          <button
            onClick={() => setShowVerify(true)}
            style={{
              padding: '7px 18px',
              background: '#fff', color: '#000',
              border: 'none', borderRadius: 9999,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Obtener verificación
          </button>
        </div>
      )}

      {/* ── Interests pills ── */}
      {user.interests?.length > 0 && (
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {user.interests.map((i, idx) => (
            <span key={idx} style={{
              background: 'var(--bg-input)', fontSize: 13,
              padding: '3px 12px', borderRadius: 9999, color: 'var(--text-muted)',
            }}>
              {i}
            </span>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TABS.filter(tab => tab !== 'Borradores' || isOwn).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              flex: 1, padding: '16px 8px',
              background: 'transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 14,
              borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {tabLoading ? <Spinner /> : (
        activeTab === 'Borradores' ? (
          posts.length === 0
            ? <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>No tienes borradores.</p>
            : posts.map(post => (
              <div key={post.id} style={{
                padding: '16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minHeight: 90,
              }}>
                {/* Top-right: Edit + Delete */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setEditingDraft({
                      id: post.id,
                      title: post.title ?? '',
                      description: post.description ?? '',
                      visibility: post.visibility ?? 'private',
                    })}
                    title="Editar"
                    style={{
                      background: 'var(--bg-input)', color: 'var(--text)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '5px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <img src={editIcon} alt="Editar" style={{ width: 15, height: 15 }} />
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(post.id)}
                    title="Eliminar"
                    style={{
                      background: 'transparent', color: 'var(--danger)',
                      border: '1px solid var(--danger)', borderRadius: 8,
                      padding: '5px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <img src={deleteIcon} alt="Eliminar" style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {/* Visibility + group — above title */}
                <p style={{ fontSize: 12, color: 'var(--text-muted)', paddingRight: 72 }}>
                  {post.visibility ?? 'private'} · {post.group?.name ?? post.groupName ?? '—'}
                </p>

                {post.title && (
                  <p style={{ fontWeight: 700, fontSize: 15, paddingRight: 72 }}>{post.title}</p>
                )}
                {post.description && (
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, paddingRight: 72 }}>
                    {post.description}
                  </p>
                )}

                {/* Bottom-right: Publish */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    onClick={() => handlePublishDraft(post)}
                    style={{
                      background: 'var(--accent)', color: '#fff',
                      border: 'none', borderRadius: 9999,
                      padding: '6px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
                    }}
                  >
                    Publicar
                  </button>
                </div>
              </div>
            ))
        ) : (
          <TweetList posts={posts} loading={false} />
        )
      )}

      {/* ── Edit draft modal ── */}
      {editingDraft && (
        <Modal title="Editar borrador" onClose={() => setEditingDraft(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Título (opcional)</label>
            <input
              value={editingDraft.title}
              onChange={e => setEditingDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="Título"
            />
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Contenido</label>
            <textarea
              value={editingDraft.description}
              onChange={e => setEditingDraft(d => ({ ...d, description: e.target.value }))}
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Visibilidad</label>
            <select
              value={editingDraft.visibility}
              onChange={e => setEditingDraft(d => ({ ...d, visibility: e.target.value }))}
            >
              <option value="private">Privado</option>
              <option value="friends">Amigos</option>
              <option value="public">Público</option>
            </select>
            <Button onClick={handleSaveDraftEdit} style={{ marginTop: 8 }}>Guardar cambios</Button>
          </div>
        </Modal>
      )}

      {/* ── Edit profile modal ── */}
      {showEdit && (
        <Modal title="Editar perfil" onClose={() => setShowEdit(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Nombre de usuario</label>
            <input
              value={editForm.username}
              onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))}
              placeholder="username"
            />
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Biografía</label>
            <textarea
              value={editForm.biography}
              onChange={e => setEditForm(f => ({ ...f, biography: e.target.value }))}
              rows={3}
              style={{ resize: 'vertical' }}
            />
            <label style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ubicación</label>
            <input
              value={editForm.location}
              onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
            />
            <label style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
              Temas de interés
            </label>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              maxHeight: 180, overflowY: 'auto',
              padding: 8, background: 'var(--bg-input)', borderRadius: 8,
            }}>
              {allTopics.map(topic => (
                <label key={topic.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 9999,
                  background: selectedTopics.includes(topic.id) ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedTopics.includes(topic.id) ? '#fff' : 'var(--text)',
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic.id)}
                    onChange={e => {
                      setSelectedTopics(prev =>
                        e.target.checked
                          ? [...prev, topic.id]
                          : prev.filter(t => t !== topic.id)
                      );
                    }}
                    style={{ display: 'none' }}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
            <Button onClick={handleEditSave} style={{ marginTop: 8 }}>Guardar cambios</Button>
          </div>
        </Modal>
      )}

      {/* ── Get verified modal ── */}
      {showVerify && (
        <Modal
          title="Obtener verificación"
          onClose={() => { setShowVerify(false); setVerifyError(''); }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Selecciona el tipo de cuenta que mejor te describe. Recibirás la insignia ✓ en tu perfil.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(BADGE_META).map(([key, meta]) => (
                <label key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  border: `2px solid ${verifyBadge === key ? meta.color : 'var(--border)'}`,
                  background: verifyBadge === key ? meta.color + '18' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input
                    type="radio"
                    name="badge"
                    value={key}
                    checked={verifyBadge === key}
                    onChange={() => setVerifyBadge(key)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: `2px solid ${meta.color}`,
                    background: verifyBadge === key ? meta.color : 'transparent',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{meta.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {key === 'creator'       && 'Creadores de contenido, influencers'}
                      {key === 'brand'         && 'Empresas, productos y servicios'}
                      {key === 'public_figure' && 'Políticos, atletas, artistas'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {verifyError && (
              <p style={{ color: 'var(--danger)', fontSize: 13 }}>{verifyError}</p>
            )}
            <Button onClick={handleVerify} disabled={verifyLoading} style={{ marginTop: 4 }}>
              {verifyLoading ? 'Verificando…' : 'Confirmar verificación'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Followers modal ── */}
      {showFollowers && (
        <Modal
          title={`Seguidores (${user.followersCount ?? 0})`}
          onClose={() => setShowFollowers(false)}
        >
          {followers.length === 0
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Sin seguidores aún.</p>
            : followers.map(u => <UserCard key={u.id} user={u} />)
          }
        </Modal>
      )}

      {/* ── Following modal ── */}
      {showFollowing && (
        <Modal
          title={`Siguiendo (${user.followingCount ?? 0})`}
          onClose={() => setShowFollowing(false)}
        >
          {following.length === 0
            ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No sigue a nadie aún.</p>
            : following.map(u => <UserCard key={u.id} user={u} />)
          }
        </Modal>
      )}
    </div>
  );
}
