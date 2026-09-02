import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProgressProvider } from './context/ProgressContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';

import { LoginPage, RegisterPage } from './pages/Auth/AuthPages.jsx';
import KnowledgeTest from './pages/KnowledgeTest/KnowledgeTest.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Roadmap from './pages/Roadmap/Roadmap.jsx';
import ModuleList from './pages/Module/ModuleList.jsx';
import ModuleDetail from './pages/Module/ModuleDetail.jsx';
import CircuitBuilder from './pages/CircuitBuilder/CircuitBuilder.jsx';
import QuantumLab from './pages/QuantumLab/QuantumLab.jsx';
import SkillMap from './pages/SkillMap/SkillMap.jsx';
import Achievements from './pages/Achievements/Achievements.jsx';
import AdminPanel from './pages/Admin/AdminPanel.jsx';
import QuantumRace from './pages/QuantumRace/QuantumRace.jsx';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/register', '/test'].includes(location.pathname);

  if (isAuthPage || !user) {
    return (
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/test" element={<ProtectedRoute><KnowledgeTest /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/modules" element={<ProtectedRoute><ModuleList /></ProtectedRoute>} />
          <Route path="/modules/:id" element={<ProtectedRoute><ModuleDetail /></ProtectedRoute>} />
          <Route path="/circuit" element={<ProtectedRoute><CircuitBuilder /></ProtectedRoute>} />
          <Route path="/lab" element={<ProtectedRoute><QuantumLab /></ProtectedRoute>} />
          <Route path="/skillmap" element={<ProtectedRoute><SkillMap /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
          <Route path="/race" element={<ProtectedRoute><QuantumRace /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <MainLayout />
      </ProgressProvider>
    </AuthProvider>
  );
}
