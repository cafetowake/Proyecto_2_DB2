import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPosts, getFollowingFeed } from '../api/postService';
import TweetComposer from '../components/post/TweetComposer';
import TweetList from '../components/post/TweetList';

const LIMIT = 20;

function useTabFeed(tab, currentUser) {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [skip, setSkip]     = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    if (!currentUser) return;
    setLoading(true);
    const currentSkip = reset ? 0 : skip;
    try {
      let items = [];
      if (tab === 'for_you') {
        const res = await getPosts({ limit: LIMIT, skip: currentSkip });
        items = res.data ?? [];
      } else {
        const res = await getFollowingFeed(currentUser.id, { limit: LIMIT, skip: currentSkip });
        items = res.data ?? [];
      }
      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasMore(items.length === LIMIT);
      setSkip(currentSkip + items.length);
    } catch {
      if (reset) setPosts([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUser, skip]);

  const reload = useCallback(() => {
    setSkip(0);
    setHasMore(true);
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUser?.id]);

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    setPosts([]);
    if (currentUser) load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, currentUser?.id]);

  return { posts, loading, hasMore, loadMore: () => load(false), reload };
}

export default function Home() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('for_you');

  const { posts, loading, hasMore, loadMore, reload } = useTabFeed(tab, currentUser);

  const tabStyle = (active) => ({
    flex: 1,
    padding: '16px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 400,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'color 0.15s',
  });

  return (
    <div>
      {/* Header with tabs */}
      <div style={{
        position: 'sticky', top: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ padding: '12px 16px 0' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Home</h1>
        </div>
        <div style={{ display: 'flex' }}>
          <button style={tabStyle(tab === 'for_you')} onClick={() => setTab('for_you')}>
            Para ti
          </button>
          <button style={tabStyle(tab === 'following')} onClick={() => setTab('following')}>
            Siguiendo
          </button>
        </div>
      </div>

      {/* Composer */}
      <TweetComposer onPosted={reload} />

      {/* Feed */}
      <TweetList
        posts={posts}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRefresh={reload}
      />
    </div>
  );
}
