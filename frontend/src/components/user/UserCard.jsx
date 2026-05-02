import { Link } from 'react-router-dom';

const BADGE_COLORS = {
  creator:       { bg: '#1d4ed8', label: 'Creator' },
  brand:         { bg: '#7c3aed', label: 'Brand' },
  public_figure: { bg: '#b45309', label: 'Public Figure' },
};

export default function UserCard({ user, action }) {
  if (!user) return null;
  const badge = user.badge;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
    }}>
      <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, color: '#fff', flexShrink: 0,
        }}>
          {user.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{user.username}</span>
            {user.isVerified && <span style={{ color: 'var(--accent)', fontSize: 13 }}>✓</span>}
            {badge && BADGE_COLORS[badge] && (
              <span style={{
                background: BADGE_COLORS[badge].bg,
                color: '#fff', fontSize: 11,
                padding: '1px 7px', borderRadius: 9999,
              }}>
                {BADGE_COLORS[badge].label}
              </span>
            )}
          </div>
          {user.biography && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {user.biography.slice(0, 80)}{user.biography.length > 80 ? '…' : ''}
            </p>
          )}
        </div>
      </Link>
      {action}
    </div>
  );
}
