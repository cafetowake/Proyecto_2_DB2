import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login       from './pages/Login';
import Home        from './pages/Home';
import Explore     from './pages/Explore';
import Profile     from './pages/Profile';
import Groups      from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import PostDetail  from './pages/PostDetail';
import Admin       from './pages/Admin';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"            element={<ProtectedRoute><Layout><Home /></Layout></ProtectedRoute>} />
      <Route path="/explore"     element={<ProtectedRoute><Layout><Explore /></Layout></ProtectedRoute>} />
      <Route path="/profile/:id" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/groups"      element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
      <Route path="/groups/:id"  element={<ProtectedRoute><Layout><GroupDetail /></Layout></ProtectedRoute>} />
      <Route path="/post/:id"    element={<ProtectedRoute><Layout><PostDetail /></Layout></ProtectedRoute>} />
      <Route path="/admin"       element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
