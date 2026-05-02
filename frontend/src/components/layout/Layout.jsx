import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        width: 600,
        minHeight: '100vh',
        borderLeft:  '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
      }}>
        {children}
      </main>
      <RightPanel />
    </div>
  );
}
