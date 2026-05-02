import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingHashtags } from '../../api/hashtagService';
import { getUsers } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';
import { followUser, followHashtag, getFollowing } from '../../api/relationshipService';

export default function RightPanel() {
  const { currentUser } = useAuth();
  const [hashtags, setHashtags] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [followedHashtags, setFollowedHashtags] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    getTrendingHashtags(5).then(res => setHashtags(res.data ?? [])).catch(() => {});
    getUsers({ limit: 20 }).then(res => setSuggested(res.data ?? [])).catch(() => {});
  }, []);

  // Load who current user follows to exclude from suggestions
  useEffect(() => {
    if (!currentUser) return;
    getFollowing(currentUser.id, { limit: 500 })
      .then(res => {
        const ids = (res.data ?? []).map(u => u.id);
        setFollowingIds(new Set(ids));
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const handleFollow = async (userId) => {
    if (!currentUser) return;
    try {
      await followUser(currentUser.id, userId);
      setFollowingIds(prev => new Set([...prev, userId]));
    } catch {}
  };

  const handleFollowHashtag = async (hashtagId) => {
    if (!currentUser) return;
    try {
      await followHashtag(currentUser.id, hashtagId);
      setFollowedHashtags(prev => new Set([...prev, hashtagId]));
    } catch {}
  };

  return (
    <aside style={{
      width: 350,
      padding: '16px 20px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Trending hashtags */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        <h2 style={{ padding: '16px 16px 12px', fontWeight: 800, fontSize: 18 }}>
          Trending
        </h2>
        {hashtags.map(tag => (
          <div
            key={tag.id}
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{ cursor: 'pointer', flex: 1 }}
              onMouseEnter={e => e.currentTarget.parentElement.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.parentElement.style.background = 'transparent'}
            >
              <p style={{ fontWeight: 700, fontSize: 15 }}>#{tag.hashtag}</p>
              {tag.usageCount && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tag.usageCount.toLocaleString()} posts</p>
              )}
            </div>
            {currentUser && (
              <button
                onClick={() => !followedHashtags.has(tag.id) && handleFollowHashtag(tag.id)}
                style={{
                  background: followedHashtags.has(tag.id) ? 'transparent' : 'var(--accent)',
                  color: followedHashtags.has(tag.id) ? 'var(--text-muted)' : '#fff',
                  border: followedHashtags.has(tag.id) ? '1px solid var(--border)' : 'none',
                  borderRadius: 9999,
                  padding: '4px 12px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: followedHashtags.has(tag.id) ? 'default' : 'pointer',
                  flexShrink: 0,
                }}
              >
                {followedHashtags.has(tag.id) ? 'Seguido' : 'Seguir'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Suggested users */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <h2 style={{ padding: '16px 16px 12px', fontWeight: 800, fontSize: 18 }}>
          Sugeridos
        </h2>
        {suggested
          .filter(u => u.id !== currentUser?.id && !followingIds.has(u.id))
          .slice(0, 5)
          .map(user => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
            }}
          >
            <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, color: '#fff',
                flexShrink: 0,
              }}>
                {user.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>
                  {user.username}
                  {user.isVerified && <span style={{ color: 'var(--accent)', marginLeft: 4 }}>✓</span>}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{user.username}</p>
              </div>
            </Link>
            <button
              onClick={() => !followingIds.has(user.id) && handleFollow(user.id)}
              style={{
                background: followingIds.has(user.id) ? 'transparent' : '#fff',
                color: followingIds.has(user.id) ? 'var(--text-muted)' : '#000',
                border: followingIds.has(user.id) ? '1px solid var(--border)' : 'none',
                borderRadius: 9999,
                padding: '6px 14px',
                fontWeight: 700,
                fontSize: 14,
                cursor: followingIds.has(user.id) ? 'default' : 'pointer',
              }}
            >
              {followingIds.has(user.id) ? 'Siguiendo' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
