import { Link } from 'react-router-dom';
import Button from '../shared/Button';

export default function GroupCard({ group, onJoin, joined }) {
  if (!group) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <Link to={`/groups/${group.id}`} style={{ fontWeight: 700, fontSize: 16 }}>
          {group.name}
        </Link>
        {group.category && (
          <span style={{
            fontSize: 11, color: 'var(--accent)',
            background: 'rgba(29,155,240,0.1)',
            padding: '2px 8px', borderRadius: 9999,
          }}>
            {group.category}
          </span>
        )}
      </div>
      {group.description && (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
          {group.description.slice(0, 120)}{group.description.length > 120 ? '…' : ''}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {group.membersCount ?? 0} miembros
        </span>
        {onJoin && (
          <Button
            variant={joined ? 'primary' : 'outline'}
            style={{ padding: '5px 14px', fontSize: 13 }}
            onClick={() => onJoin(group.id)}
          >
            {joined ? 'Ver grupo' : 'Unirse'}
          </Button>
        )}
      </div>
    </div>
  );
}
