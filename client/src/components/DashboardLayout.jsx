import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Layers, 
  FileText, 
  HelpCircle, 
  Bell, 
  User, 
  Crown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Cpu,
  Volume2,
  BarChart3,
  ShieldCheck,
  Scale,
  Users
} from 'lucide-react';

export default function DashboardLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Dynamically fetch actual registered students count from database
  const fetchStudentCount = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        const total = typeof data.total === 'number' ? data.total : (data.students?.length || 0);
        setStudentCount(total);
      }
    } catch (err) {
      console.error('Failed to fetch dynamic student count:', err);
    }
  };

  useEffect(() => {
    fetchStudentCount();

    // Auto-refresh student count periodically (every 5 seconds) to reflect live registrations/deletions in real time
    const interval = setInterval(fetchStudentCount, 5000);

    // Also listen to window focus or custom student update events
    window.addEventListener('focus', fetchStudentCount);
    window.addEventListener('studentsUpdated', fetchStudentCount);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchStudentCount);
      window.removeEventListener('studentsUpdated', fetchStudentCount);
    };
  }, []);

  // Format count dynamically: e.g. "0 Students", "1 Student", "2 Students", "10 Students"
  const studentBadgeText = studentCount !== null 
    ? `${studentCount} ${studentCount === 1 ? 'Student' : 'Students'}`
    : '...';

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Academic Chatbot', path: '/dashboard/chatbot', icon: MessageSquare },
    { name: 'Multi-Agent Studio', path: '/dashboard/agentic', icon: Cpu, badge: 'Phase 9' },
    { name: 'Multimodal Advising', path: '/dashboard/multimodal', icon: Volume2, badge: 'Phase 8' },
    { name: 'Student Directory & Cards', path: '/dashboard/students', icon: Users, badge: studentBadgeText },
    { name: 'Evaluation & Benchmarks', path: '/dashboard/evaluation', icon: BarChart3, badge: 'Phase 4/5' },
    { name: 'Privacy & Security', path: '/dashboard/security', icon: ShieldCheck, badge: 'Phase 10' },
    { name: 'Ethics & Legal Hub', path: '/dashboard/ethics', icon: Scale, badge: 'Phase 11' },
    { name: 'Semester & Curriculum', path: '/dashboard/curriculum', icon: BookOpen },
    { name: 'Minor Courses', path: '/dashboard/minors', icon: Layers },
    { name: 'Student Handbook', path: '/dashboard/handbook', icon: FileText },
    { name: 'Help & About', path: '/dashboard/help', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden font-sans antialiased text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0b2545] text-white flex flex-col justify-between shrink-0 shadow-xl lg:shadow-none border-r border-slate-800/90 transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* University Branding Logo */}
          <div className="p-5 flex items-center justify-between border-b border-white/10">
            <NavLink to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white leading-tight">Vidyashilp</h2>
                <p className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase">University</p>
              </div>
            </NavLink>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      isActive ? 'bg-slate-950/20 text-slate-900' : 'bg-white/10 text-amber-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-950 shrink-0 opacity-80" />}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Administrator Badge at Bottom */}
        <div className="p-4 border-t border-white/10 bg-slate-950/30">
          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-white/5 text-[11px] text-slate-300 border border-white/10">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-white leading-none">Administrator Session</p>
              <p className="text-[10px] text-amber-300 mt-0.5 truncate">{currentUser?.email || 'admin@vidyashilp.edu.in'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs shrink-0 z-10">
          <div className="flex items-center space-x-3">
            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {title || 'Academic Advisor Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                {currentUser?.email ? (
                  <User className="w-4 h-4 text-slate-300" />
                ) : (
                  <Crown className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {userProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Admin User')}
                </p>
                <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                  {userProfile?.role === 'admin' ? 'University Administrator' : 'Academic Officer'}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Children Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
