import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Hash, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerStudent, loginWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [uun, setUun] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uunVerified, setUunVerified] = useState(null);

  const handleVerifyUun = async (val) => {
    const rawUun = val.trim().toUpperCase();
    setUun(rawUun);
    if (rawUun.length < 5) {
      setUunVerified(null);
      return;
    }

    try {
      const res = await fetch('/api/auth/verify-uun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uun: rawUun })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setUunVerified(data);
        if (!fullName) setFullName(data.studentName);
        setError('');
      } else {
        setUunVerified(false);
      }
    } catch {
      setUunVerified(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (!uun || uun.trim().length === 0) {
      return setError('University UUN number is required.');
    }

    setLoading(true);
    try {
      await registerStudent({
        fullName,
        email,
        password,
        uun: uun.trim().toUpperCase()
      });
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      let msg = err.message || 'Failed to complete registration.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Please sign in instead.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-25 filter blur-xs"
        style={{ backgroundImage: "url('/assets/vidyashilp_campus.jpg')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link to="/" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vu-gold to-amber-500 flex items-center justify-center text-slate-950 shadow-xl border border-amber-300">
            <GraduationCap className="w-9 h-9" />
          </Link>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Student Registration
        </h2>
        <p className="mt-1 text-center text-xs text-amber-400 font-semibold uppercase tracking-widest">
          Vidyashilp University Academic Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Student A"
                  className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold focus:bg-white"
                />
              </div>
            </div>

            {/* UUN Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>University UUN Number</span>
                <span className="text-[10px] text-slate-400 font-normal">e.g. VU24BTECH001 to VU24BTECH020</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={uun}
                  onChange={(e) => handleVerifyUun(e.target.value)}
                  placeholder="VU24BTECH001"
                  className={`w-full pl-10 pr-10 py-2 text-xs font-mono uppercase bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold focus:bg-white ${
                    uunVerified?.valid ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                />
                {uunVerified?.valid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {uunVerified?.valid && (
                <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  ✓ Verified Record: {uunVerified.studentName} ({uunVerified.program})
                </p>
              )}
              {uunVerified === false && (
                <p className="mt-1 text-[11px] text-amber-700">
                  UUN not recognized. You may use test UUNs: VU24BTECH001 through VU24BTECH020.
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@vidyashilp.edu.in"
                  className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold focus:bg-white"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vu-gold focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#0b2545] text-amber-400 hover:bg-[#133e6f] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Registering Student Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-extrabold text-vu-blue hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Strict Role-Based Security: Students cannot assign themselves Administrator access.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

