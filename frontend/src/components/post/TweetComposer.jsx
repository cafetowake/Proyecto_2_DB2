import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createPost } from '../../api/postService';
import { getUserGroups } from '../../api/groupService';
import Button from '../shared/Button';

export default function TweetComposer({ groupId: fixedGroupId, onPosted }) {
  const { currentUser } = useAuth();
  const [title, setTitle]       = useState('');
  const [content, setContent]   = useState('');
  const [groupId, setGroupId]   = useState(fixedGroupId ?? '');
  const [visibility, setVisibility] = useState('public');
  const [isDraft, setIsDraft]   = useState(false);
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!fixedGroupId && currentUser) {
      getUserGroups(currentUser.id)
        .then(res => setGroups(res.data ?? res ?? []))
        .catch(() => {});
    }
  }, [fixedGroupId, currentUser?.id]);

  const handleSubmit = async () => {
    if (!currentUser) return setError('No hay usuario activo.');
    if (!groupId) return setError('Selecciona un grupo.');
    if (!content.trim()) return setError('El contenido es requerido.');

    setLoading(true);
    setError('');
    try {
      await createPost({
        authorId:    currentUser.id,
        groupId,
        title:       title.trim() || undefined,
        description: content.trim(),
        isDraft,
        visibility,
      });
      setTitle('');
      setContent('');
      setIsDraft(false);
      setVisibility('public');
      if (!fixedGroupId) setGroupId('');
      onPosted?.();
    } catch (err) {
      setError(err?.message ?? 'Error al publicar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0,
      }}>
        {currentUser?.username?.[0]?.toUpperCase() ?? '?'}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Título (opcional)"
          style={{ fontSize: 14 }}
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="¿Qué está pasando?"
          rows={3}
          style={{ resize: 'vertical', fontSize: 15 }}
        />

        {!fixedGroupId && (
          <select value={groupId} onChange={e => setGroupId(e.target.value)}>
            <option value="">Seleccionar grupo...</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={isDraft ? 'private' : visibility}
            onChange={e => setVisibility(e.target.value)}
            disabled={isDraft}
            style={{ width: 'auto', flex: 1, opacity: isDraft ? 0.5 : 1 }}
          >
            <option value="public">Público</option>
            <option value="friends">Amigos</option>
            <option value="private">Privado</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isDraft}
              onChange={e => {
                const checked = e.target.checked;
                setIsDraft(checked);
                if (checked) setVisibility('private');
              }}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14 }}>Guardar como borrador</span>
          </label>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Publicando...' : isDraft ? 'Guardar borrador' : 'Tweet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
