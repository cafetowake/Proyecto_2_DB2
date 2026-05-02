import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import homeIcon from '../../assets/home.png';
import exploreIcon from '../../assets/explore.png';
import groupsIcon from '../../assets/groups.png';
import profileIcon from '../../assets/profile.png';
import adminIcon from '../../assets/admin.png';
import xIcon from '../../assets/x.png';

const navItems = [
  { icon: homeIcon,    label: 'Home',        to: '/' },
  { icon: exploreIcon, label: 'Explore',     to: '/explore' },
  { icon: groupsIcon,  label: 'Groups',      to: '/groups' },
  { icon: adminIcon,   label: 'Admin Panel', to: '/admin' },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: 280,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {/* Logo */}
        <div style={{ padding: '8px 24px 20px' }}>
          <img src={xIcon} alt="Logo" style={{ width: 28, height: 28 }} />
        </div>

        {/* Nav links */}
        <nav>
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 24px',
                borderRadius: 9999,
                margin: '2px 8px',
                fontWeight: location.pathname === item.to ? 600 : 400,
                fontSize: 18,
                background: location.pathname === item.to ? 'var(--bg-hover)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <img src={item.icon} alt={item.label} style={{ width: 22, height: 22 }} />
              <span>{item.label}</span>
            </Link>
          ))}

          {currentUser && (
            <Link
              to={`/profile/${currentUser.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '12px 24px',
                borderRadius: 9999,
                margin: '2px 8px',
                fontWeight: location.pathname.startsWith('/profile') ? 600 : 400,
                fontSize: 18,
                background: location.pathname.startsWith('/profile') ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              <img src={profileIcon} alt="My Profile" style={{ width: 22, height: 22 }} />
              <span>Mi Perfil</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Current user + logout — always pinned to bottom */}
      {currentUser && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 15, color: '#fff', flexShrink: 0,
            }}>
              {currentUser.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{currentUser.username}
              </div>
              {currentUser.email && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.email}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 9999,
              color: 'var(--text-muted)',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}
