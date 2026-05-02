import { useState, useEffect, useMemo } from 'react';
import { getUsers } from '../api/userService';
import { getPosts } from '../api/postService';
import { getHashtagPosts, getHashtags } from '../api/hashtagService';
import { getTopics } from '../api/topicService';
import { getGroups } from '../api/groupService';
import { followUser, followHashtag, unfollowHashtag, getFollowedHashtags } from '../api/relationshipService';
import UserCard from '../components/user/UserCard';
import TweetCard from '../components/post/TweetCard';
import GroupCard from '../components/group/GroupCard';
import Spinner from '../components/shared/Spinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TABS = ['Users', 'Posts', 'Grupos', 'Hashtags', 'Topics'];

export default function Explore() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Users');
  const [query, setQuery]         = useState('');

  // Master data (loaded once)
  const [allUsers, setAllUsers]       = useState([]);
  const [allPosts, setAllPosts]       = useState([]);
  const [allHashtags, setAllHashtags] = useState([]);
  const [allTopics, setAllTopics]     = useState([]);
  const [allGroups, setAllGroups]     = useState([]);

  // Per-hashtag expanded posts
  const [hashtagPosts, setHashtagPosts] = useState({});

  // Followed hashtags set (ids)
  const [followedHashtagIds, setFollowedHashtagIds] = useState(new Set());

  const [loading, setLoading] = useState(true);

  // Load all data once on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUsers({ limit: 50 }).catch(() => ({ data: [] })),
      getPosts({ limit: 50 }).catch(() => ({ data: [] })),
      getHashtags({ limit: 60 }).catch(() => ({ data: [] })),
      getTopics({ isActive: true, limit: 40 }).catch(() => ({ data: [] })),
      getGroups({ limit: 40 }).catch(() => ({ data: [] })),
    ]).then(([u, p, h, t, g]) => {
      setAllUsers(u.data ?? []);
      setAllPosts(p.data ?? []);
      // Sort hashtags: trending first, then by usage
      const tags = h.data ?? [];
      tags.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        return (b.usageCount ?? 0) - (a.usageCount ?? 0);
      });
      setAllHashtags(tags);
      setAllTopics(t.data ?? []);
      setAllGroups(g.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // Load followed hashtags for current user
  useEffect(() => {
    if (!currentUser) return;
    getFollowedHashtags(currentUser.id)
      .then(res => {
        const ids = (res.data ?? []).map(h => h.id);
        setFollowedHashtagIds(new Set(ids));
      })
      .catch(() => {});
  }, [currentUser?.id]);

  // Client-side filtering — runs instantly, no async
  const q = query.trim().toLowerCase();

  const filteredUsers = useMemo(() =>
    q ? allUsers.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id === query.trim()
    ) : allUsers,
  [allUsers, q, query]);

  const filteredPosts = useMemo(() =>
    q ? allPosts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.author?.username?.toLowerCase().includes(q)
    ) : allPosts,
  [allPosts, q]);

  const filteredHashtags = useMemo(() =>
    q ? allHashtags.filter(h =>
      h.hashtag?.toLowerCase().includes(q.replace(/^#/, ''))
    ) : allHashtags,
  [allHashtags, q]);

  const filteredTopics = useMemo(() =>
    q ? allTopics.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    ) : allTopics,
  [allTopics, q]);

  const filteredGroups = useMemo(() =>
    q ? allGroups.filter(g =>
      g.name?.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q)
    ) : allGroups,
  [allGroups, q]);

  // Hashtag expand/collapse posts
  const handleHashtagClick = async (tag) => {
    if (hashtagPosts[tag.id] !== undefined) {
      setHashtagPosts(prev => { const n = { ...prev }; delete n[tag.id]; return n; });
      return;
    }
    try {
      const res = await getHashtagPosts(tag.id, { limit: 10 });
      setHashtagPosts(prev => ({ ...prev, [tag.id]: res.data ?? [] }));
    } catch {}
  };

  // Follow / unfollow hashtag
  const handleToggleHashtag = async (e, tag) => {
    e.stopPropagation();
    if (!currentUser) return;
    const isFollowing = followedHashtagIds.has(tag.id);
    // Optimistic update
    setFollowedHashtagIds(prev => {
      const next = new Set(prev);
      isFollowing ? next.delete(tag.id) : next.add(tag.id);
      return next;
    });
    try {
      if (isFollowing) {
        await unfollowHashtag(currentUser.id, tag.id);
      } else {
        await followHashtag(currentUser.id, tag.id);
      }
    } catch {
      // Rollback on error
      setFollowedHashtagIds(prev => {
        const next = new Set(prev);
        isFollowing ? next.add(tag.id) : next.delete(tag.id);
        return next;
      });
    }
  };

  const handleFollow = async (userId) => {
    if (!currentUser) return;
    try { await followUser(currentUser.id, userId); } catch {}
  };

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
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Explore</h1>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, #hashtag, descripción..."
          style={{ fontSize: 15 }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '16px',
              background: 'transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 15,
              borderBottom: activeTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {/* Users tab */}
      {!loading && activeTab === 'Users' && (
        <div>
          {filteredUsers.length ? filteredUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              action={
                user.id !== currentUser?.id ? (
                  <button
                    onClick={() => handleFollow(user.id)}
                    style={{
                      background: '#fff', color: '#000',
                      border: 'none', borderRadius: 9999,
                      padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    }}
                  >Follow</button>
                ) : null
              }
            />
          )) : (
            <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</p>
          )}
        </div>
      )}

      {/* Posts tab */}
      {!loading && activeTab === 'Posts' && (
        <div>
          {filteredPosts.length ? filteredPosts.map(post => (
            <TweetCard key={post.id} post={post} compact />
          )) : (
            <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</p>
          )}
        </div>
      )}

      {/* Grupos tab */}
      {!loading && activeTab === 'Grupos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
          {filteredGroups.length ? filteredGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={() => navigate(`/groups/${group.id}`)}
              joined={false}
            />
          )) : (
            <p style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</p>
          )}
        </div>
      )}

      {/* Hashtags tab */}
      {!loading && activeTab === 'Hashtags' && (
        <div>
          {filteredHashtags.length ? filteredHashtags.map(tag => (
            <div key={tag.id}>
              <div
                onClick={() => handleHashtagClick(tag)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>#{tag.hashtag}</p>
                  {tag.usageCount > 0 && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tag.usageCount.toLocaleString()} posts</p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {tag.isTrending && (
                    <span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(29,155,240,0.1)', padding: '2px 8px', borderRadius: 9999 }}>
                      Trending
                    </span>
                  )}
                  {currentUser && (
                    <button
                      onClick={e => handleToggleHashtag(e, tag)}
                      style={{
                        padding: '5px 14px', borderRadius: 9999, fontSize: 13, fontWeight: 700,
                        border: followedHashtagIds.has(tag.id) ? '1px solid var(--border)' : 'none',
                        background: followedHashtagIds.has(tag.id) ? 'transparent' : 'var(--accent)',
                        color: followedHashtagIds.has(tag.id) ? 'var(--text)' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {followedHashtagIds.has(tag.id) ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </div>
              </div>
              {hashtagPosts[tag.id]?.map(post => (
                <TweetCard key={post.id} post={post} compact />
              ))}
            </div>
          )) : (
            <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</p>
          )}
        </div>
      )}

      {/* Topics tab */}
      {!loading && activeTab === 'Topics' && (
        <div>
          {filteredTopics.length ? filteredTopics.map(topic => (
            <div
              key={topic.id}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{topic.name}</p>
                {topic.category && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{topic.category}</span>
                )}
              </div>
              {topic.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{topic.description}</p>
              )}
            </div>
          )) : (
            <p style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center' }}>Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}

