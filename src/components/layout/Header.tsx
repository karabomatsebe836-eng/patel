import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { CLINIC } from '../../lib/siteData';

export default function Header() {
  const { profile, signOut } = useAuth();
  const { navigate, path } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Only the home page gets a transparent hero header; all other pages are always solid white
  const isHeroPage = path === '/';
  const solid = scrolled || !isHeroPage;

  const headerBg = solid ? 'bg-white shadow-md' : 'bg-transparent';
  const textColor = solid ? 'text-gray-800' : 'text-white';
  const logoTextColor = solid ? 'text-blue-700' : 'text-white';
  const logoSubColor = solid ? 'text-teal-600' : 'text-teal-300';

  const handleNav = (to: string) => {
    navigate(to);
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const dashboardPath =
    profile?.role === 'dentist' ? '/dentist' : profile?.role === 'admin' ? '/admin' : '/patient';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => handleNav('/')} className="flex items-center gap-2 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${solid ? 'bg-blue-700' : 'bg-white/20 backdrop-blur-sm'}`}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8 2 6 5 6 8c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 1 .5 2 2 2h4c1.5 0 2-1 2-2 0-2 .5-3.5 1-5 .5-1.5 1-3 1-5 0-3-2-6-6-6z"/>
              </svg>
            </div>
            <div className="text-left">
              <div className={`font-bold text-sm leading-tight ${logoTextColor}`}>Mohamed Patel</div>
              <div className={`text-xs leading-tight ${logoSubColor}`}>Optometrist</div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', path: '/' },
              { label: 'Services', path: '/services' },
              { label: 'Contact', path: '/contact' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  path === item.path
                    ? solid
                      ? 'text-blue-700 bg-blue-50'
                      : 'text-white bg-white/20'
                    : solid
                    ? `${textColor} hover:text-blue-700 hover:bg-blue-50`
                    : 'text-white/90 hover:text-white hover:bg-white/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    solid ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{profile.full_name}</span>
                  <ChevronDown size={14} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-800 truncate">{profile.full_name}</div>
                      <div className="text-xs text-gray-500 capitalize">{profile.role}</div>
                    </div>
                    <button
                      onClick={() => handleNav(dashboardPath)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleNav('/profile')}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={15} />
                      My Profile
                    </button>
                    <div className="border-t border-gray-100 mt-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/login')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    solid ? 'text-blue-700 hover:bg-blue-50' : 'text-white hover:bg-white/20'
                  }`}
                >
                  Sign In
                </button>
                <a href={CLINIC.phoneHref} className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-md shadow-blue-700/20">
                  Call Us
                </a>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${solid ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <nav className="px-4 py-3 space-y-1">
            {[
              { label: 'Home', path: '/' },
              { label: 'Services', path: '/services' },
              { label: 'Contact', path: '/contact' },
            ].map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {item.label}
              </button>
            ))}

            {profile ? (
              <>
                <button
                  onClick={() => handleNav(dashboardPath)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </button>
                <button
                  onClick={() => handleNav('/profile')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <User size={16} />
                  My Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="flex-1 py-2 rounded-xl text-sm font-medium border border-blue-700 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </button>
                <a href={CLINIC.phoneHref} className="flex-1 py-2 text-center rounded-xl text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                  Call Us
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
