import { useAuth } from './contexts/AuthContext';
import { useRouter } from './contexts/RouterContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import WhatsAppButton from './components/layout/WhatsAppButton';
import Home from './pages/public/Home';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PatientDashboard from './pages/patient/PatientDashboard';
import DentistDashboard from './pages/dentist/DentistDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProfilePage from './pages/profile/ProfilePage';

const PUBLIC_PAGES = ['/', '/services', '/contact', '/login', '/register'];
const DASHBOARD_PAGES = ['/patient', '/dentist', '/admin'];

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();

  if (loading) return <LoadingScreen />;

  if (!profile) {
    navigate('/login');
    return null;
  }

  if (profile.role !== allowedRole) {
    const dest = profile.role === 'dentist' ? '/dentist' : profile.role === 'admin' ? '/admin' : '/patient';
    navigate(dest);
    return null;
  }

  return <>{children}</>;
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const { navigate } = useRouter();

  if (loading) return <LoadingScreen />;

  if (!profile) {
    navigate('/login');
    return null;
  }

  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-blue-700/20 border-t-blue-700 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { path } = useRouter();
  const { loading } = useAuth();

  const isPublic = PUBLIC_PAGES.includes(path);
  const isDashboard = DASHBOARD_PAGES.includes(path);
  const isProfile = path === '/profile';

  // Pages that show the public header
  const showHeader = !isDashboard;
  // Pages that show the public footer
  const showFooter = isPublic;

  if (loading && (isDashboard || isProfile)) return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      {showHeader && <Header />}

      {/* Public pages */}
      {path === '/' && <Home />}
      {path === '/services' && <Services />}
      {path === '/contact' && <Contact />}

      {/* Auth pages */}
      {path === '/login' && <Login />}
      {path === '/register' && <Register />}

      {/* Profile page — accessible to all authenticated users */}
      {isProfile && (
        <AuthRequired>
          <ProfilePage />
        </AuthRequired>
      )}

      {/* Protected dashboards */}
      {path === '/patient' && (
        <ProtectedRoute allowedRole="patient">
          <PatientDashboard />
        </ProtectedRoute>
      )}
      {path === '/dentist' && (
        <ProtectedRoute allowedRole="dentist">
          <DentistDashboard />
        </ProtectedRoute>
      )}
      {path === '/admin' && (
        <ProtectedRoute allowedRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      )}

      {/* 404 fallback */}
      {!PUBLIC_PAGES.includes(path) && !DASHBOARD_PAGES.includes(path) && !isProfile && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
            <p className="text-gray-500 mb-6">Page not found</p>
            <button
              onClick={() => (window.location.hash = '/')}
              className="bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      )}

      {showFooter && <Footer />}
      <WhatsAppButton />
    </div>
  );
}
