import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Hash, CheckCircle2, ArrowRight, AlertCircle, LogOut } from 'lucide-react';

export default function RegisterUunPage() {
  const navigate = useNavigate();
  const { currentUser, linkGoogleStudent, logout } = useAuth();
  const [uun, setUun] = useState('');
  const [uunVerified, setUunVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        setError('');
      } else {
        setUunVerified(false);
      }
    } catch {
      setUunVerified(false);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await linkGoogleStudent(uun.trim().toUpperCase(), currentUser?.displayName);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to link UUN number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-4 font-bold shadow-md">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 text-center">
          Link Your University UUN
        </h2>
        <p className="text-xs text-slate-500 text-center mt-1 mb-6">
          Signed in with Google as <strong>{currentUser?.email}</strong>. Please enter your university-assigned UUN to access your student records.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLink} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Assigned UUN Number
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={uun}
                onChange={(e) => handleVerifyUun(e.target.value)}
                placeholder="e.g. VU24BTECH001"
                className="w-full pl-10 pr-3 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-vu-gold"
              />
            </div>
            {uunVerified?.valid && (
              <p className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified: {uunVerified.studentName} ({uunVerified.program})</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !uunVerified?.valid}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-vu-navy text-amber-400 hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Linking UUN...' : 'Confirm & Open Student Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign in with a different account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

