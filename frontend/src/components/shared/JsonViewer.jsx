export default function JsonViewer({ data }) {
  if (!data) return null;
  return (
    <pre style={{
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      background: '#0a0a0a',
      fontSize: 12,
      color: 'var(--success)',
      overflow: 'auto',
      maxHeight: 260,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
