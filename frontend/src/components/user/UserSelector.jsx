import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UserSelector() {
  const { currentUser, setCurrentUser, allUsers } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleChange = (e) => {
    const user = allUsers.find(u => u.id === e.target.value);
    if (!user) return;
    setCurrentUser(user);
    // If currently on a profile page, redirect to the new user's profile
    if (location.pathname.startsWith('/profile/')) {
      navigate(`/profile/${user.id}`);
    }
  };

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Cuenta activa (demo)</p>
      <select
        value={currentUser?.id ?? ''}
        onChange={handleChange}
        style={{ fontSize: 13 }}
      >
        {allUsers.map(u => (
          <option key={u.id} value={u.id}>
            @{u.username}{u.badge ? ` (${u.badge})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
