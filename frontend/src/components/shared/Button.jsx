export default function Button({ children, variant = 'primary', onClick, disabled, style = {} }) {
  const base = {
    padding: '9px 18px',
    borderRadius: 9999,
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background 0.15s',
    ...style,
  };

  const variants = {
    primary:  { background: 'var(--accent)', color: '#fff' },
    danger:   { background: 'var(--danger)', color: '#fff' },
    outline:  { background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost:    { background: 'transparent', color: 'var(--accent)' },
  };

  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
