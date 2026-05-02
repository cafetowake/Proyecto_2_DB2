import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, getUserGroups } from '../api/groupService';
import { joinGroup } from '../api/relationshipService';
import { getTopics } from '../api/topicService';
import { useAuth } from '../context/AuthContext';
import GroupCard from '../components/group/GroupCard';
import Modal from '../components/shared/Modal';
import Spinner from '../components/shared/Spinner';
import Button from '../components/shared/Button';

export default function Groups() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups]     = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]         = useState({ name: '', description: '', category: '', privacyLevel: 'public' });
  const [error, setError]       = useState('');
  const [allTopics, setAllTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  useEffect(() => {
    getGroups({ limit: 40 })
      .then(res => setGroups(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    getTopics({ isActive: true, limit: 50 }).then(res => {
      setAllTopics(res.data ?? []);
    }).catch(() => {});
  }, []);

  // Load groups the current user already belongs to
  useEffect(() => {
    if (!currentUser) return;
    getUserGroups(currentUser.id)
      .then(res => {
        const ids = (res.data ?? res ?? []).map(g => g.id);
        setJoinedIds(new Set(ids));
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const handleJoin = async (groupId) => {
    if (!currentUser) return;
    if (joinedIds.has(groupId)) {
      navigate(`/groups/${groupId}`);
      return;
    }
    try {
      await joinGroup(currentUser.id, groupId);
      setJoinedIds(prev => new Set([...prev, groupId]));
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, membersCount: (g.membersCount ?? 0) + 1 } : g
      ));
    } catch {}
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return setError('El nombre es requerido.');
    if (!currentUser) return setError('No hay usuario activo.');
    setError('');
    try {
      const newGroup = await createGroup({
        name:         form.name.trim(),
        description:  form.description.trim(),
        category:     form.category.trim() || 'General',
        privacyLevel: form.privacyLevel,
        createdBy:    currentUser.id,
        topicIds:     selectedTopics,
      });
      setGroups(prev => [newGroup, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', category: '', privacyLevel: 'public' });
      setSelectedTopics([]);
    } catch (err) {
      setError(err?.message ?? 'Error al crear grupo.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Groups</h1>
        <Button onClick={() => setShowCreate(true)}>+ Nuevo Grupo</Button>
      </div>

      {loading ? <Spinner /> : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          padding: 16,
        }}>
          {groups.map(group => (
            <GroupCard key={group.id} group={group} onJoin={handleJoin} joined={joinedIds.has(group.id)} />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Crear nuevo grupo" onClose={() => setShowCreate(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder="Nombre del grupo *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
            <input
              placeholder="Categoría (ej: Tech, Sports...)"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            />
            <select
              value={form.privacyLevel}
              onChange={e => setForm(f => ({ ...f, privacyLevel: e.target.value }))}
            >
              <option value="public">Público</option>
            <label style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Temas relacionados</label>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 8,
              maxHeight: 150, overflowY: 'auto',
              padding: 8, background: 'var(--bg-input)', borderRadius: 8,
            }}>
              {allTopics.map(topic => (
                <label key={topic.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 9999,
                  background: selectedTopics.includes(topic.id) ? 'var(--accent)' : 'var(--bg-card)',
                  color: selectedTopics.includes(topic.id) ? '#fff' : 'var(--text)',
                  fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(topic.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedTopics(prev => [...prev, topic.id]);
                      } else {
                        setSelectedTopics(prev => prev.filter(t => t !== topic.id));
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
              <option value="private">Privado</option>
            </select>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
            <Button onClick={handleCreate}>Crear grupo</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
