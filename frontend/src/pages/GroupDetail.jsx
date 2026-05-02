import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroupById, getGroupMembers } from '../api/groupService';
import { getGroupPosts } from '../api/groupService';
import { leaveGroup } from '../api/relationshipService';
import { useAuth } from '../context/AuthContext';
import TweetComposer from '../components/post/TweetComposer';
import TweetList from '../components/post/TweetList';
import Spinner from '../components/shared/Spinner';
import Button from '../components/shared/Button';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [group, setGroup]     = useState(null);
  const [posts, setPosts]     = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getGroupById(id),
      getGroupPosts(id, { limit: 20 }),
      getGroupMembers(id, { limit: 10 }),
    ])
      .then(([g, p, m]) => {
        setGroup(g);
        setPosts(p.data ?? []);
        setMembers(m.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleLeave = async () => {
    if (!currentUser) return;
    if (!window.confirm('¿Salir del grupo?')) return;
    try {
      await leaveGroup(currentUser.id, id);
      navigate('/groups');
    } catch {}
  };

  if (loading) return <Spinner />;
  if (!group) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Grupo no encontrado.</p>;

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>{group.name}</h1>
      </div>

      {/* Group info */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            {group.category && (
              <span style={{
                fontSize: 12, color: 'var(--accent)',
                background: 'rgba(29,155,240,0.1)',
                padding: '2px 8px', borderRadius: 9999, marginBottom: 8, display: 'inline-block',
              }}>
                {group.category}
              </span>
            )}
            {group.description && (
              <p style={{ fontSize: 15, marginTop: 4, marginBottom: 8 }}>{group.description}</p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {group.membersCount ?? members.length} miembros
            </p>
          </div>
          <Button variant="outline" onClick={handleLeave} style={{ padding: '6px 14px', fontSize: 13 }}>
            Salir
          </Button>
        </div>

        {/* Members preview */}
        {members.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
            {members.slice(0, 8).map((m, i) => {
              const uname = m.user?.username ?? m.username ?? '';
              const uid   = m.user?.id ?? m.id ?? i;
              return (
                <div
                  key={uid}
                  title={uname}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: '#fff',
                  }}
                >
                  {uname[0]?.toUpperCase() ?? '?'}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <TweetComposer
        groupId={id}
        onPosted={() => {
          getGroupPosts(id, { limit: 20 }).then(res => setPosts(res.data ?? [])).catch(() => {});
        }}
      />

      {/* Posts */}
      <TweetList posts={posts} loading={false} />
    </div>
  );
}
