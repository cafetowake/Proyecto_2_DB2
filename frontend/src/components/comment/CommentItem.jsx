import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createComment, deleteComment, updateComment, getReplies } from '../../api/commentService';
import Button from '../shared/Button';
import commentIcon from '../../assets/comment.png';
import editIcon from '../../assets/edit.png';
import deleteIcon from '../../assets/delete.png';

export default function CommentItem({ comment, depth = 0, onCommentAdded }) {
  const { currentUser } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content ?? '');
  const [deleted, setDeleted] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  if (deleted) return null;

  const author = comment.author ?? {};
  const isOwn = currentUser?.id === author.id;

  const loadReplies = async () => {
    if (replies !== null) { setReplies(null); return; }
    try {
      const res = await getReplies(comment.id, { limit: 20 });
      setReplies(res.data ?? []);
    } catch { }
  };

  const submitReply = async () => {
    if (!replyText.trim() || !currentUser) return;
    setReplyLoading(true);
    try {
      const newComment = await createComment({
        authorId: currentUser.id,
        postId: comment.postId,
        content: replyText.trim(),
        parentCommentId: comment.id,
      });
      setReplies(prev => [...(prev ?? []), newComment]);
      setReplyText('');
      setShowReplyForm(false);
      onCommentAdded?.();
    } catch { }
    setReplyLoading(false);
  };

  const submitEdit = async () => {
    if (!editText.trim()) return;
    try {
      await updateComment(comment.id, { content: editText.trim() });
      comment.content = editText.trim();
      setEditing(false);
    } catch { }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar comentario?')) return;
    try {
      await deleteComment(comment.id);
      setDeleted(true);
    } catch { }
  };

  const createdAt = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div style={{ marginLeft: depth > 0 ? 32 : 0, paddingLeft: depth > 0 ? 16 : 0, borderLeft: depth > 0 ? '2px solid var(--border)' : 'none' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
          }}>
            {author.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{author.username}</span>
          {author.isVerified && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {createdAt}</span>
          {comment.isEdited && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>(editado)</span>}
          {/* Edit / Delete — top-right */}
          {isOwn && !editing && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button
                onClick={() => setEditing(true)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: 2 }}
                title="Editar"
              >
                <img src={editIcon} alt="Editar" style={{ width: 15, height: 15 }} />
              </button>
              <button
                onClick={handleDelete}
                style={{ background: 'transparent', color: 'var(--danger)', padding: 2 }}
                title="Eliminar"
              >
                <img src={deleteIcon} alt="Eliminar" style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={2}
              style={{ fontSize: 14, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button style={{ padding: '5px 12px', fontSize: 13 }} onClick={submitEdit}>Guardar</Button>
              <Button variant="outline" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 8 }}>{comment.content}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {depth < 2 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 13 }}
            >
              <img src={commentIcon} alt="Responder" style={{ width: 16, height: 16, marginRight: 4 }} />
            </button>
          )}
          {(comment.repliesCount > 0 || replies !== null) && (
            <button
              onClick={loadReplies}
              style={{ background: 'transparent', color: 'var(--accent)', fontSize: 13 }}
            >
              {replies !== null ? 'Ocultar' : `Ver ${comment.repliesCount} respuestas`}
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Escribe una respuesta..."
              rows={2}
              style={{ fontSize: 14, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button style={{ padding: '5px 12px', fontSize: 13 }} onClick={submitReply} disabled={replyLoading}>
                {replyLoading ? '...' : 'Responder'}
              </Button>
              <Button variant="outline" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setShowReplyForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {replies?.map(reply => (
        <CommentItem key={reply.id} comment={{ ...reply, postId: comment.postId }} depth={depth + 1} onCommentAdded={onCommentAdded} />
      ))}
    </div>
  );
}
