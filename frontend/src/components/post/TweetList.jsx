import { useState, useEffect } from 'react';
import TweetCard from './TweetCard';
import Spinner from '../shared/Spinner';
import Button from '../shared/Button';

export default function TweetList({ posts, loading, onLoadMore, hasMore, onRefresh }) {
  const [localPosts, setLocalPosts] = useState(posts ?? []);

  // Sync with parent when posts change (e.g. load more appends)
  useEffect(() => {
    setLocalPosts(posts ?? []);
  }, [posts]);

  const handleLike = (postId, liked) => {
    setLocalPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likedByMe: liked, likesCount: (p.likesCount ?? 0) + (liked ? 1 : -1) }
        : p
    ));
  };

  const handleDelete = (postId) => {
    setLocalPosts(prev => prev.filter(p => p.id !== postId));
    onRefresh?.();
  };

  if (loading && !localPosts?.length) return <Spinner />;
  if (!localPosts?.length) return (
    <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>
      No hay posts todavía.
    </p>
  );

  return (
    <div>
      {localPosts.map(post => (
        <TweetCard
          key={post.id}
          post={post}
          onLike={handleLike}
          onDelete={handleDelete}
          compact
        />
      ))}
      {hasMore && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  );
}
