import { useState, useEffect } from 'react';
import { getPostComments, createComment } from '../../api/commentService';
import { useAuth } from '../../context/AuthContext';
import CommentItem from './CommentItem';
import Spinner from '../shared/Spinner';
import Button from '../shared/Button';

export default function CommentThread({ postId, onCommentAdded }) {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [text, setText]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPostComments(postId, { limit: 30 })
      .then(res => setComments(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const newComment = await createComment({
        authorId: currentUser.id,
        postId,
        content: text.trim(),
      });
      setComments(prev => [newComment, ...prev]);
      setText('');
      onCommentAdded?.();
    } catch {}
    setSubmitting(false);
  };

  return (
    <div>
      {/* New comment input */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0,
        }}>
          {currentUser?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Añade un comentario..."
            rows={2}
            style={{ resize: 'vertical', fontSize: 15 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSubmit} disabled={submitting || !text.trim()}>
              {submitting ? '...' : 'Comentar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Comment list */}
      {loading ? <Spinner /> : comments.map(c => (
        <CommentItem key={c.id} comment={{ ...c, postId }} onCommentAdded={onCommentAdded} />
      ))}
    </div>
  );
}
