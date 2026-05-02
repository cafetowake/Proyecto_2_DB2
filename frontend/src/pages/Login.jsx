import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUser } from '../api/userService';

const BADGE_COLORS = { creator: '#1d4ed8', brand: '#7c3aed', public_figure: '#b45309' };

export default function Login() {
  const { allUsers, setCurrentUser, setAllUsers } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]     = useState('login');  // 'login' | 'register'
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register form
  const [form, setForm] = useState({
    username: '', email: '', biography: '',
    birthdate: '', location: '',
  });

  // ── Login tab ──────────────────────────────────────────────────
  const filtered = allUsers.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogin = (user) => {
    setCurrentUser(user);
    navigate('/');
  };

  // ── Register tab ───────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username.trim()) { setError('El nombre de usuario es obligatorio.'); return; }
    if (!form.email.trim())    { setError('El email es obligatorio.'); return; }
    setError('');
    setLoading(true);
    try {
      const newUser = await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        biography: form.biography.trim() || undefined,
        birthdate: form.birthdate || new Date().toISOString().split('T')[0],
        location: form.location.trim() || undefined,
        isActive: true,
      });
      setAllUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      navigate('/');
    } catch (err) {
      setError(err?.message ?? 'Error al crear el usuario. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  const tabStyle = (active) => ({
    flex: 1,
    padding: '14px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 400,
    fontSize: 15,
    cursor: 'pointer',
  });

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <div style={{ display: 'flex', gap: 80, alignItems: 'center', maxWidth: 900, width: '100%' }}>

        {/* Left branding */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 80 }}>𝕏</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>
            Lo que está<br />pasando ahora
          </h1>
          <p style={{ fontSize: 20, color: 'var(--text-muted)' }}>
            Únete hoy.
          </p>
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          maxWidth: 420,
          width: '100%',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button style={tabStyle(tab === 'login')}    onClick={() => { setTab('login');    setError(''); }}>
              Iniciar sesión
            </button>
            <button style={tabStyle(tab === 'register')} onClick={() => { setTab('register'); setError(''); }}>
              Crear cuenta
            </button>
          </div>

          <div style={{ padding: 24 }}>
            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Elige tu cuenta
                </h2>
                <input
                  placeholder="Buscar por usuario o email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ marginBottom: 16 }}
                />
                <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filtered.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                      No se encontraron usuarios.
                    </p>
                  )}
                  {filtered.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleLogin(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                        color: 'var(--text)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 16, color: '#fff', flexShrink: 0,
                      }}>
                        {user.username?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>@{user.username}</span>
                          {user.badge && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 9999,
                              background: BADGE_COLORS[user.badge] ?? 'var(--accent)',
                              color: '#fff',
                            }}>
                              {user.badge}
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Crea tu cuenta
                </h2>
                {field('Nombre de usuario *', 'username', 'text', '@johndoe')}
                {field('Email *', 'email', 'email', 'correo@ejemplo.com')}
                {field('Biografía', 'biography', 'text', 'Cuéntanos sobre ti…')}
                {field('Ubicación', 'location', 'text', 'Ciudad, País')}
                {field('Fecha de nacimiento', 'birthdate', 'date')}

                {error && (
                  <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    background: loading ? 'var(--text-muted)' : 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 9999,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: 4,
                  }}
                >
                  {loading ? 'Creando…' : 'Crear cuenta'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
