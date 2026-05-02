import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPostById } from '../api/postService';
import TweetCard from '../components/post/TweetCard';
import CommentThread from '../components/comment/CommentThread';
import Spinner from '../components/shared/Spinner';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPostById(id)
      .then(p => setPost(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!post) return <p style={{ padding: 32, color: 'var(--text-muted)' }}>Post no encontrado.</p>;

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
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Post</h1>
      </div>

      {/* Full tweet card */}
      <TweetCard
        post={post}
        onLike={(postId, liked) => setPost(p => p ? {
          ...p,
          likedByMe: liked,
          likesCount: (p.likesCount ?? 0) + (liked ? 1 : -1),
        } : p)}
        compact={false}
      />

      {/* Comments */}
      <CommentThread
        postId={id}
        onCommentAdded={() => setPost(p => p ? { ...p, commentsCount: (p.commentsCount ?? 0) + 1 } : p)}
      />
    </div>
  );
}
