import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import { 
  GraduationCap, 
  User, 
  Lock, 
  KeyRound, 
  LogOut, 
  FileText, 
  BookOpen, 
  Layers, 
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  MessageSquare,
  Download
} from 'lucide-react';

export default function StudentDashboard() {
  const { userProfile, currentUser, logout, changePassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'grade_card' | 'profile'
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [passLoading, setPassLoading] = useState(false);

  const rawStudent = userProfile?.studentData;
  const student = {
    name: rawStudent?.name || rawStudent?.fullName || userProfile?.name || 'Student',
    fullName: rawStudent?.fullName || rawStudent?.name || userProfile?.name || 'Student',
    displayName: rawStudent?.displayName || rawStudent?.fullName || rawStudent?.name || userProfile?.name || 'Student',
    uun: rawStudent?.uun || userProfile?.uun || 'UUN01',
    uan: rawStudent?.uan || rawStudent?.uun || userProfile?.uun || 'UUN01',
    program: rawStudent?.program || rawStudent?.programme || 'B.Tech Computer Science and Engineering',
    programme: rawStudent?.programme || rawStudent?.program || 'B.Tech Computer Science and Engineering',
    currentSemester: rawStudent?.currentSemester || 8,
    cgpa: (rawStudent?.cgpa !== undefined && rawStudent?.cgpa !== null) ? rawStudent.cgpa : 3.65,
    completedCredits: rawStudent?.completedCredits || 0,
    attendancePercentage: rawStudent?.attendancePercentage || 88
  };

  const studentTargetId = userProfile?.studentProfileId || (student.uun ? `st_${student.uun.toLowerCase()}` : 'st_uun01');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    if (newPass !== confirmPass) {
      return setPassMsg({ type: 'error', text: 'New passwords do not match.' });
    }
    if (newPass.length < 6) {
      return setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    setPassLoading(true);
    try {
      await changePassword(newPass);
      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!currentUser?.email) return;
    try {
      await resetPassword(currentUser.email);
      setPassMsg({ type: 'success', text: `Reset email sent to ${currentUser.email}.` });
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden font-sans antialiased text-slate-800">
      {/* Student Sidebar */}
      <aside className="w-64 bg-[#0b2545] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-slate-800">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-white/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Vidyashilp</h2>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Student Portal</p>
            </div>
          </div>

          {/* Student Profile Pill */}
          <div className="p-4 mx-3 my-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Logged In Student</span>
            <div className="font-extrabold text-sm text-white truncate">{student.name}</div>
            <div className="text-[11px] font-mono text-slate-300">UUN: {student.uan}</div>
          </div>

          {/* Nav Items */}
          <nav className="p-3.5 space-y-1.5">
            {[
              { id: 'chat', label: 'My Academic Chatbot', icon: MessageSquare },
              { id: 'grade_card', label: 'My Grade Card', icon: ImageIcon },
              { id: 'profile', label: 'Account & Security', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs shrink-0">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">
              {activeTab === 'chat' && 'Personal Academic Advisor'}
              {activeTab === 'grade_card' && 'Official Grade Card & Performance'}
              {activeTab === 'profile' && 'Student Profile & Security Management'}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold">
              Restricted to your authenticated student record ({student.uan})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Semester {student.currentSemester || 8} • CGPA {student.cgpa} / 10.0
            </span>
          </div>
        </header>

        {/* Tab 1: Personal Chatbot */}
        {activeTab === 'chat' && (
          <div className="p-6 max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0">
            <div className="mb-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span><strong>Student Sandbox Active:</strong> The chatbot will answer queries about curriculum policies and your personal academic records (Grade Card, GPAs, Credits). Inquiries about other students are blocked.</span>
              </span>
            </div>
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
              <Chatbot standalone={false} />
            </div>
          </div>
        )}

        {/* Tab 2: My Grade Card Image */}
        {activeTab === 'grade_card' && (
          <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-vu-gold tracking-wider">Official Academic Record</span>
                  <h3 className="text-xl font-extrabold text-slate-900">Visual Grade Card — {student.displayName || student.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">UUN: {student.uan} • {student.program}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/students/${studentTargetId}/card-pdf`}
                    download
                    className="px-3.5 py-1.5 rounded-xl bg-vu-navy text-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                  <a
                    href={`/api/students/${studentTargetId}/card-image`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-slate-200 transition"
                  >
                    <span>Open Full SVG</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50/40">
                <img
                  src={`/api/students/${studentTargetId}/card-image`}
                  alt={`Grade Card of ${student.fullName || student.name}`}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Profile & Security Management */}
        {activeTab === 'profile' && (
          <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{student.name}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Registered Email</span>
                  <span className="font-bold text-slate-900 text-sm">{currentUser?.email}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">University UUN Number</span>
                  <span className="font-bold text-vu-blue font-mono text-sm">{student.uan} (Locked)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Account Role</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                    Verified Student
                  </span>
                </div>
              </div>
            </div>

            {/* Account Security (Password Management) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Account Security &amp; Password</span>
                <button
                  onClick={handleSendResetEmail}
                  className="text-xs font-semibold text-vu-blue hover:underline"
                >
                  Send Reset Link to Email
                </button>
              </h3>

              {passMsg.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800'
                }`}>
                  {passMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-vu-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-vu-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#0b2545] text-amber-400 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {passLoading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

