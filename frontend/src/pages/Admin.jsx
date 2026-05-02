import { useState } from 'react';
import {
  getUsers, getUserStats,
  bulkUpdateUsers, removeUserProps, bulkRemoveUserProps,
  bulkDeleteUsers,
} from '../api/userService';
import {
  unfollowUser, bulkUnfollow,
  bulkUpdateFollows,
  bulkAddFollowProps,
  removeFollowProp, bulkRemoveFollowProp,
} from '../api/relationshipService';
import { triggerSeed, uploadCSV } from '../api/adminService';

// ── AdminSection ─────────────────────────────────────────────────────────────
function AdminSection({ title, rubric, children, response, error }) {
  return (
    <section style={{
      background: 'var(--bg-card)', borderRadius: 12,
      padding: 20, marginBottom: 16,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>{title}</h3>
        {rubric && <span style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(29,155,240,0.1)', padding: '2px 8px', borderRadius: 9999 }}>
          Rúbrica: {rubric}
        </span>}
      </div>
      {children}
      {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 8 }}>{error}</p>}
      {response !== null && response !== undefined && (
        <pre style={{
          marginTop: 12, padding: 12, borderRadius: 8,
          background: '#0a0a0a', fontSize: 12,
          color: 'var(--success)', overflow: 'auto', maxHeight: 220,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </section>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────
function Field({ label, ...props }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>}
      <input {...props} />
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>{children}</div>;
}

function Btn({ onClick, loading: l, children, variant = 'primary' }) {
  const bg = variant === 'danger' ? 'var(--danger)' : 'var(--accent)';
  return (
    <button
      onClick={onClick}
      disabled={l}
      style={{
        background: bg, color: '#fff', border: 'none',
        borderRadius: 9999, padding: '8px 18px',
        fontWeight: 700, fontSize: 14, cursor: l ? 'not-allowed' : 'pointer',
        opacity: l ? 0.7 : 1, marginTop: 4,
      }}
    >
      {l ? 'Cargando...' : children}
    </button>
  );
}

// ── Section components ────────────────────────────────────────────────────────

function CSVUploadSection() {
  const [file, setFile]   = useState(null);
  const [type, setType]   = useState('users');
  const [resp, setResp]   = useState(null);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const types = ['users','posts','groups','topics','hashtags','follows','likes','members','follows_hashtag','tag_in_topic'];

  const handle = async () => {
    if (!file) return setErr('Selecciona un archivo CSV.');
    setErr(''); setLoading(true);
    try { setResp(await uploadCSV(file, type)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="CSV Upload" rubric="Carga masiva" response={resp} error={err}>
      <Row>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Archivo CSV</label>
          <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </Row>
      <Btn onClick={handle} loading={loading}>Subir CSV</Btn>
    </AdminSection>
  );
}

function SeederSection() {
  const [resp, setResp] = useState(null);
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await triggerSeed()); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Seeder" rubric="Datos de prueba" response={resp} error={err}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
        Pobla la base de datos con datos de prueba.
      </p>
      <Btn onClick={handle} loading={loading}>Seed Database</Btn>
    </AdminSection>
  );
}

function CreateVerifiedUserSection() {
  const [f, setF] = useState({ username:'', email:'', biography:'', badge:'creator', isActive: true, interests:'', birthdate:'' });
  const [resp, setResp] = useState(null);
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try {
      const data = {
        username:  f.username.trim(),
        email:     f.email.trim(),
        biography: f.biography.trim(),
        badge:     f.badge,
        isActive:  f.isActive,
        interests: f.interests ? f.interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        ...(f.birthdate ? { birthdate: f.birthdate } : {}),
      };
      setResp(await createVerifiedUser(data));
    } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Crear Verified User (2 etiquetas: User + VerifiedUser)" rubric="CREATE nodo 2+ labels — 5pts" response={resp} error={err}>
      <Row>
        <Field label="Username *" value={f.username} onChange={e => setF(p => ({...p, username: e.target.value}))} placeholder="vip_user" />
        <Field label="Email *" value={f.email} onChange={e => setF(p => ({...p, email: e.target.value}))} placeholder="vip@email.com" />
      </Row>
      <Row>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Badge</label>
          <select value={f.badge} onChange={e => setF(p => ({...p, badge: e.target.value}))}>
            <option value="creator">creator</option>
            <option value="brand">brand</option>
            <option value="public_figure">public_figure</option>
          </select>
        </div>
        <Field label="Intereses (coma)" value={f.interests} onChange={e => setF(p => ({...p, interests: e.target.value}))} placeholder="tech, music" />
      </Row>
      <Row>
        <Field label="Fecha nacimiento (opcional)" value={f.birthdate} onChange={e => setF(p => ({...p, birthdate: e.target.value}))} placeholder="1990-01-15" />
        <Field label="Biografía" value={f.biography} onChange={e => setF(p => ({...p, biography: e.target.value}))} placeholder="..." />
      </Row>
      <Btn onClick={handle} loading={loading}>Crear VerifiedUser</Btn>
    </AdminSection>
  );
}

function GetUsersSection() {
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState('');
  const [limit, setLimit] = useState('10');
  const [resp, setResp]   = useState(null);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const params = { limit: Number(limit) || 10 };
    if (badge) params.badge = badge;
    if (isActive !== '') params.isActive = isActive === 'true';
    try { setResp(await getUsers(params)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Obtener Usuarios (con filtros)" rubric="READ muchos nodos + filtro" response={resp} error={err}>
      <Row>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Badge</label>
          <select value={badge} onChange={e => setBadge(e.target.value)}>
            <option value="">— cualquiera —</option>
            <option value="creator">creator</option>
            <option value="brand">brand</option>
            <option value="public_figure">public_figure</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>isActive</label>
          <select value={isActive} onChange={e => setIsActive(e.target.value)}>
            <option value="">— cualquiera —</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </div>
        <Field label="Limit" value={limit} onChange={e => setLimit(e.target.value)} placeholder="10" style={{ maxWidth: 80 }} />
      </Row>
      <Btn onClick={handle} loading={loading}>Buscar</Btn>
    </AdminSection>
  );
}

function UserStatsSection() {
  const [resp, setResp] = useState(null);
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await getUserStats()); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="User Stats (Agregación)" rubric="Aggregation" response={resp} error={err}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
        totalUsers, activeUsers, verifiedUsers, promedio de edad...
      </p>
      <Btn onClick={handle} loading={loading}>Obtener Stats</Btn>
    </AdminSection>
  );
}

function BulkUpdateUsersSection() {
  const [badge, setBadge]     = useState('');
  const [propKey, setPropKey] = useState('');
  const [propVal, setPropVal] = useState('');
  const [resp, setResp]       = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const filter = {};
    if (badge) filter.badge = badge;
    try { setResp(await bulkUpdateUsers(filter, { [propKey.trim()]: propVal })); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Update Usuarios" rubric="UPDATE muchos nodos" response={resp} error={err}>
      <Row>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Filtro: badge</label>
          <select value={badge} onChange={e => setBadge(e.target.value)}>
            <option value="">— todos —</option>
            <option value="creator">creator</option>
            <option value="brand">brand</option>
            <option value="public_figure">public_figure</option>
          </select>
        </div>
        <Field label="Propiedad a setear" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="isActive" />
        <Field label="Valor" value={propVal} onChange={e => setPropVal(e.target.value)} placeholder="true" />
      </Row>
      <Btn onClick={handle} loading={loading}>Bulk Update</Btn>
    </AdminSection>
  );
}

function AddPropsUserSection() {
  const [id, setId]       = useState('');
  const [propKey, setPropKey] = useState('');
  const [propVal, setPropVal] = useState('');
  const [resp, setResp]   = useState(null);
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await updateUser(id.trim(), { [propKey.trim()]: propVal })); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Agregar Prop a 1 Usuario" rubric="ADD prop a 1 nodo" response={resp} error={err}>
      <Row>
        <Field label="User ID" value={id} onChange={e => setId(e.target.value)} placeholder="abc-123..." />
        <Field label="Nueva propiedad" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="website" />
        <Field label="Valor" value={propVal} onChange={e => setPropVal(e.target.value)} placeholder="https://..." />
      </Row>
      <Btn onClick={handle} loading={loading}>Agregar Prop</Btn>
    </AdminSection>
  );
}

function BulkAddPropsUsersSection() {
  const [badge, setBadge]     = useState('');
  const [propKey, setPropKey] = useState('');
  const [propVal, setPropVal] = useState('');
  const [resp, setResp]       = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const filter = {};
    if (badge) filter.badge = badge;
    try { setResp(await bulkUpdateUsers(filter, { [propKey.trim()]: propVal })); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Agregar Props a Usuarios" rubric="ADD props a muchos nodos" response={resp} error={err}>
      <Row>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Filtro: badge</label>
          <select value={badge} onChange={e => setBadge(e.target.value)}>
            <option value="">— todos —</option>
            <option value="creator">creator</option>
            <option value="brand">brand</option>
            <option value="public_figure">public_figure</option>
          </select>
        </div>
        <Field label="Nueva prop" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="tier" />
        <Field label="Valor" value={propVal} onChange={e => setPropVal(e.target.value)} placeholder="gold" />
      </Row>
      <Btn onClick={handle} loading={loading}>Bulk Agregar Props</Btn>
    </AdminSection>
  );
}

function RemovePropsUserSection() {
  const [id, setId]         = useState('');
  const [propKeys, setPropKeys] = useState('');
  const [resp, setResp]     = useState(null);
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const keys = propKeys.split(',').map(s => s.trim()).filter(Boolean);
    try { setResp(await removeUserProps(id.trim(), keys)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Eliminar Props de 1 Usuario" rubric="REMOVE props de 1 nodo" response={resp} error={err}>
      <Row>
        <Field label="User ID" value={id} onChange={e => setId(e.target.value)} placeholder="abc-123..." />
        <Field label="Props a eliminar (coma)" value={propKeys} onChange={e => setPropKeys(e.target.value)} placeholder="website, location" />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Eliminar Props</Btn>
    </AdminSection>
  );
}

function BulkRemovePropsUsersSection() {
  const [badge, setBadge]       = useState('');
  const [propKeys, setPropKeys] = useState('');
  const [resp, setResp]         = useState(null);
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const filter = {};
    if (badge) filter.badge = badge;
    const keys = propKeys.split(',').map(s => s.trim()).filter(Boolean);
    try { setResp(await bulkRemoveUserProps(filter, keys)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Eliminar Props de Usuarios" rubric="REMOVE props de muchos nodos" response={resp} error={err}>
      <Row>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Filtro: badge</label>
          <select value={badge} onChange={e => setBadge(e.target.value)}>
            <option value="">— todos —</option>
            <option value="creator">creator</option>
            <option value="brand">brand</option>
            <option value="public_figure">public_figure</option>
          </select>
        </div>
        <Field label="Props a eliminar (coma)" value={propKeys} onChange={e => setPropKeys(e.target.value)} placeholder="tier, website" />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Bulk Eliminar Props</Btn>
    </AdminSection>
  );
}

function BulkDeleteUsersSection() {
  const [ids, setIds]   = useState('');
  const [resp, setResp] = useState(null);
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!window.confirm('¿Eliminar estos usuarios?')) return;
    setErr(''); setLoading(true);
    const idArr = ids.split(',').map(s => s.trim()).filter(Boolean);
    try { setResp(await bulkDeleteUsers(idArr)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="🗑 Bulk Eliminar Usuarios" rubric="DELETE muchos nodos — 5pts" response={resp} error={err}>
      <Row>
        <Field label="IDs separados por coma" value={ids} onChange={e => setIds(e.target.value)} placeholder="id1, id2, id3..." />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Bulk Eliminar</Btn>
    </AdminSection>
  );
}

// ── Relationship sections ─────────────────────────────────────────────────────

function BulkUpdateFollowsSection() {
  const [minScore, setMinScore] = useState('');
  const [key, setKey]           = useState('');
  const [val, setVal]           = useState('');
  const [resp, setResp]         = useState(null);
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const filter = {};
    if (minScore) filter.minInteractionScore = Number(minScore);
    try { setResp(await bulkUpdateFollows(filter, { [key.trim()]: val })); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Update FOLLOWS" rubric="UPDATE muchas relaciones" response={resp} error={err}>
      <Row>
        <Field label="Filtro: minInteractionScore" value={minScore} onChange={e => setMinScore(e.target.value)} placeholder="0.5" />
        <Field label="Propiedad" value={key} onChange={e => setKey(e.target.value)} placeholder="notificationsEnabled" />
        <Field label="Valor" value={val} onChange={e => setVal(e.target.value)} placeholder="false" />
      </Row>
      <Btn onClick={handle} loading={loading}>Bulk Update FOLLOWS</Btn>
    </AdminSection>
  );
}

function BulkAddPropsFollowsSection() {
  const [propKey, setPropKey] = useState('');
  const [propVal, setPropVal] = useState('');
  const [resp, setResp]       = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await bulkAddFollowProps({}, { [propKey.trim()]: propVal })); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Agregar Props a FOLLOWS" rubric="ADD props a muchas relaciones" response={resp} error={err}>
      <Row>
        <Field label="Nueva prop (para todas)" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="tier" />
        <Field label="Valor" value={propVal} onChange={e => setPropVal(e.target.value)} placeholder="silver" />
      </Row>
      <Btn onClick={handle} loading={loading}>Bulk Add Props</Btn>
    </AdminSection>
  );
}

function RemovePropFollowSection() {
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [propKey, setPropKey] = useState('');
  const [resp, setResp]       = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await removeFollowProp(from.trim(), to.trim(), propKey.trim())); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Eliminar Prop de 1 FOLLOWS" rubric="REMOVE prop de 1 relación" response={resp} error={err}>
      <Row>
        <Field label="From ID" value={from} onChange={e => setFrom(e.target.value)} placeholder="userId1..." />
        <Field label="To ID" value={to} onChange={e => setTo(e.target.value)} placeholder="userId2..." />
        <Field label="Prop a eliminar" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="nickname" />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Eliminar Prop</Btn>
    </AdminSection>
  );
}

function BulkRemovePropFollowsSection() {
  const [propKey, setPropKey] = useState('');
  const [resp, setResp]       = useState(null);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await bulkRemoveFollowProp(propKey.trim(), {})); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Eliminar Prop de FOLLOWS" rubric="REMOVE props de muchas relaciones" response={resp} error={err}>
      <Row>
        <Field label="Prop a eliminar (de todas)" value={propKey} onChange={e => setPropKey(e.target.value)} placeholder="tier" />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Bulk Remove Prop</Btn>
    </AdminSection>
  );
}

function UnfollowSection() {
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [resp, setResp] = useState(null);
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    try { setResp(await unfollowUser(from.trim(), to.trim())); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Unfollow (DELETE 1 relación)" rubric="DELETE 1 relación — 5pts" response={resp} error={err}>
      <Row>
        <Field label="Follower ID" value={from} onChange={e => setFrom(e.target.value)} placeholder="userId1..." />
        <Field label="Followed ID" value={to} onChange={e => setTo(e.target.value)} placeholder="userId2..." />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Unfollow</Btn>
    </AdminSection>
  );
}

function BulkUnfollowSection() {
  const [followerId, setFollowerId]   = useState('');
  const [followedIds, setFollowedIds] = useState('');
  const [resp, setResp]               = useState(null);
  const [err, setErr]                 = useState('');
  const [loading, setLoading]         = useState(false);

  const handle = async () => {
    setErr(''); setLoading(true);
    const ids = followedIds.split(',').map(s => s.trim()).filter(Boolean);
    try { setResp(await bulkUnfollow(followerId.trim(), ids)); } catch (e) { setErr(e?.message ?? 'Error'); }
    setLoading(false);
  };

  return (
    <AdminSection title="Bulk Unfollow (DELETE muchas relaciones)" rubric="DELETE muchas relaciones — 5pts" response={resp} error={err}>
      <Row>
        <Field label="Follower ID" value={followerId} onChange={e => setFollowerId(e.target.value)} placeholder="userId1..." />
        <Field label="Followed IDs (coma)" value={followedIds} onChange={e => setFollowedIds(e.target.value)} placeholder="id1, id2, id3..." />
      </Row>
      <Btn onClick={handle} loading={loading} variant="danger">Bulk Unfollow</Btn>
    </AdminSection>
  );
}

// ── Main Admin page ───────────────────────────────────────────────────────────

const SECTION_GROUPS = [
  { id: 'tools', label: 'Herramientas' },
  { id: 'nodes', label: 'Nodos' },
  { id: 'rels',  label: 'Relaciones' },
];

export default function Admin() {
  const [activeGroup, setActiveGroup] = useState('tools');

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
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>⚙️ Admin Panel — Rubric Demo</h1>
        <div style={{ display: 'flex', gap: 0 }}>
          {SECTION_GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              style={{
                flex: 1, padding: '10px',
                background: activeGroup === g.id ? 'var(--accent)' : 'transparent',
                color: activeGroup === g.id ? '#fff' : 'var(--text-muted)',
                fontWeight: activeGroup === g.id ? 700 : 400,
                fontSize: 14,
                borderRadius: 0,
                transition: 'all 0.15s',
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {activeGroup === 'tools' && (
          <>
            <CSVUploadSection />
            <SeederSection />
          </>
        )}

        {activeGroup === 'nodes' && (
          <>
            <GetUsersSection />
            <UserStatsSection />
            <BulkUpdateUsersSection />
            <AddPropsUserSection />
            <BulkAddPropsUsersSection />
            <RemovePropsUserSection />
            <BulkRemovePropsUsersSection />
            <BulkDeleteUsersSection />
          </>
        )}

        {activeGroup === 'rels' && (
          <>
            <BulkUpdateFollowsSection />
            <BulkAddPropsFollowsSection />
            <RemovePropFollowSection />
            <BulkRemovePropFollowsSection />
            <UnfollowSection />
            <BulkUnfollowSection />
          </>
        )}
      </div>
    </div>
  );
}
