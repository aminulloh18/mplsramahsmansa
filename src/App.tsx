import { useState, useEffect } from 'react';
import { authService, UserSession } from './services/authService';

// Import public pages
import LandingPage from './pages/public/LandingPage';
import Login from './pages/Login';

// Import admin pages & layout
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import DataSiswa from './pages/admin/DataSiswa';
import DataKelas from './pages/admin/DataKelas';
import DataWaliKelas from './pages/admin/DataWaliKelas';
import PengumumanAdmin from './pages/admin/PengumumanAdmin';
import FAQAdmin from './pages/admin/FAQAdmin';
import PengaturanWebsite from './pages/admin/PengaturanWebsite';
import ActivityLog from './pages/admin/ActivityLog';
import Profile from './pages/admin/Profile';
import BinkelDashboard from './pages/admin/BinkelDashboard';
import AnalisisKebugaran from './pages/admin/AnalisisKebugaran';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [page, setPage] = useState<'landing' | 'login' | 'admin'>('landing');
  const [adminTab, setAdminTab] = useState('dashboard');

  // Verify and load active session on startup
  useEffect(() => {
    const currentSession = authService.getCurrentSession();
    if (currentSession) {
      setSession(currentSession);
      setPage('admin');
      setAdminTab(currentSession.role === 'Binkel' ? 'binkel-dashboard' : 'dashboard');
    }
  }, []);

  const handleLoginSuccess = (userSession: UserSession) => {
    setSession(userSession);
    setPage('admin');
    setAdminTab(userSession.role === 'Binkel' ? 'binkel-dashboard' : 'dashboard');
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
    setPage('landing');
  };

  // Render correct admin tab view
  const renderAdminContent = () => {
    if (!session) return null;
    
    switch (adminTab) {
      case 'dashboard':
        return (
          <Dashboard
            adminEmail={session.email}
            onNavigate={(tab) => setAdminTab(tab)}
          />
        );
      case 'siswa':
        return <DataSiswa adminEmail={session.email} />;
      case 'binkel-dashboard':
        return <BinkelDashboard session={session} onLogout={handleLogout} />;
      case 'analisis-kebugaran':
        return <AnalisisKebugaran adminEmail={session.email} />;
      case 'kelas':
        return <DataKelas adminEmail={session.email} />;
      case 'wali-kelas':
        return <DataWaliKelas adminEmail={session.email} />;
      case 'pengumuman':
        return <PengumumanAdmin adminEmail={session.email} />;
      case 'faq':
        return <FAQAdmin adminEmail={session.email} />;
      case 'pengaturan':
        return <PengaturanWebsite adminEmail={session.email} />;
      case 'logs':
        return <ActivityLog />;
      case 'profile':
        return <Profile session={session} onLogout={handleLogout} />;
      default:
        return (
          <Dashboard
            adminEmail={session.email}
            onNavigate={(tab) => setAdminTab(tab)}
          />
        );
    }
  };

  // Main Page Router Switch
  if (page === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onGoBack={() => setPage('landing')}
      />
    );
  }

  if (page === 'admin' && session) {
    return (
      <AdminLayout
        session={session}
        onLogout={handleLogout}
        activeTab={adminTab}
        onTabChange={(tab) => setAdminTab(tab)}
      >
        {renderAdminContent()}
      </AdminLayout>
    );
  }

  // Fallback to Landing Page
  return <LandingPage onGoToLogin={() => setPage('login')} />;
}
