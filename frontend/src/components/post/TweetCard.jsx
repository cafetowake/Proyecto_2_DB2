import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { likePost, unlikePost, savePost, unsavePost } from '../../api/relationshipService';
import { deletePost } from '../../api/postService';
import commentIcon from '../../assets/comment.png';
import heartIcon from '../../assets/heart1.png';
import heartFilledIcon from '../../assets/heart2.png';
import saveIcon from '../../assets/save.png';
import deleteIcon from '../../assets/delete.png';

const BADGE_COLORS = {
  creator:       { bg: '#1d4ed8', label: 'Creator' },
  brand:         { bg: '#7c3aed', label: 'Brand' },
  public_figure: { bg: '#b45309', label: 'Public Figure' },
};

function Avatar({ username, size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, color: '#fff',
      flexShrink: 0,
    }}>
      {username?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function TweetCard({ post, onLike, onSave, onDelete, compact = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [savedByMe, setSavedByMe] = useState(post.savedByMe ?? false);

  if (!post) return null;

  const author    = post.author ?? {};
  const badge     = author.badge;
  const isOwn     = currentUser?.id === author.id;
  const createdAt = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString('es-GT', { month: 'short', day: 'numeric' })
    : '';

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      if (post.likedByMe) {
        await unlikePost(currentUser.id, post.id);
        onLike?.(post.id, false);
      } else {
        await likePost(currentUser.id, post.id);
        onLike?.(post.id, true);
      }
    } catch {}
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    const next = !savedByMe;
    setSavedByMe(next);
    try {
      if (next) {
        await savePost(currentUser.id, post.id);
      } else {
        await unsavePost(currentUser.id, post.id);
      }
      onSave?.(post.id, next);
    } catch {
      setSavedByMe(!next); // rollback
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este post?')) return;
    try {
      await deletePost(post.id);
      onDelete?.(post.id);
    } catch {}
  };

  return (
    <article
      onClick={() => navigate(`/post/${post.id}`)}
      style={{
        display: 'flex', gap: 12,
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div onClick={e => { e.stopPropagation(); navigate(`/profile/${author.id}`); }}>
        <Avatar username={author.username} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span
            style={{ fontWeight: 700, fontSize: 15 }}
            onClick={e => { e.stopPropagation(); navigate(`/profile/${author.id}`); }}
          >
            {author.username}
          </span>
          {author.isVerified && <span style={{ color: 'var(--accent)', fontSize: 14 }}>✓</span>}
          {badge && BADGE_COLORS[badge] && (
            <span style={{
              background: BADGE_COLORS[badge].bg,
              color: '#fff', fontSize: 11,
              padding: '1px 7px', borderRadius: 9999,
              fontWeight: 600,
            }}>
              {BADGE_COLORS[badge].label}
            </span>
          )}
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>· {createdAt}</span>
          {post.group?.name && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 12, color: 'var(--accent)',
              background: 'rgba(29,155,240,0.1)',
              padding: '2px 8px', borderRadius: 9999,
            }}>
              {post.group.name}
            </span>
          )}
        </div>

        {/* Title + body */}
        {post.title && (
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{post.title}</p>
        )}
        {post.description && (
          <p style={{
            fontSize: 15, lineHeight: 1.5,
            color: 'var(--text)',
            overflow: compact ? 'hidden' : 'visible',
            display: compact ? '-webkit-box' : 'block',
            WebkitLineClamp: compact ? 3 : 'unset',
            WebkitBoxOrient: 'vertical',
          }}>
            {post.description}
          </p>
        )}

        {/* Image */}
        {post.imageURL && (
          <img
            src={post.imageURL}
            alt="post"
            style={{
              marginTop: 8, borderRadius: 12,
              width: '100%', maxHeight: 300,
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
          />
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 24,
          marginTop: 12, color: 'var(--text-muted)',
        }}>
          {/* Comments */}
          <button
            onClick={e => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
            style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <img src={commentIcon} alt="Comments" style={{ width: 16, height: 16 }} /> 
            {post.commentsCount ?? 0}
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            style={{
              background: 'transparent',
              color: post.likedByMe ? 'var(--danger)' : 'var(--text-muted)',
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <img src={post.likedByMe ? heartFilledIcon : heartIcon} alt="Like" style={{ width: 16, height: 16 }} /> 
            {post.likesCount ?? 0}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              background: 'transparent',
              color: savedByMe ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 5,
            }}
            title={savedByMe ? 'Quitar de guardados' : 'Guardar'}
          >
            <img src={saveIcon} alt="Save" style={{ width: 16, height: 16, opacity: savedByMe ? 1 : 0.6 }} />
          </button>

          {/* Delete (own posts only) */}
          {isOwn && (
            <button
              onClick={handleDelete}
              style={{ background: 'transparent', color: 'var(--danger)', fontSize: 14, marginLeft: 'auto' }}
            >
              <img src={deleteIcon} alt="Delete" style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
