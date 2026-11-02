import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  EyeOff, 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Terminal,
  FileText
} from 'lucide-react';

export default function SecurityPage() {
  const [auditResults, setAuditResults] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testInput, setTestInput] = useState('My phone is 9845012345 and email is student@test.com. Can I register for Machine Learning?');
  const [sanitizedPreview, setSanitizedPreview] = useState(null);

  useEffect(() => {
    runSecurityTest();
    fetchLogs();
  }, []);

  const runSecurityTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/test', { method: 'POST' });
      const data = await res.json();
      setAuditResults(data);
    } catch (err) {
      console.error('Security test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/security/audit-log');
      const data = await res.json();
      if (data.logs) setAuditLogs(data.logs);
    } catch (err) {
      console.error('Audit log error:', err);
    }
  };

  const handleTestSanitize = async () => {
    try {
      const res = await fetch('/api/security/sanitize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testInput })
      });
      const data = await res.json();
      setSanitizedPreview(data);
    } catch (err) {
      console.error('Sanitize error:', err);
    }
  };

  return (
    <DashboardLayout title="Privacy & Security Audit Hub">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-vu-navy via-[#134074] to-vu-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase #10: Privacy, Security & Ethical Guardrails</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Academic Privacy & Security Audit
            </h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Rigorous vulnerability testing protecting student confidentiality:
              <span className="font-semibold text-amber-300"> Prompt Injection Defense</span>, 
              <span className="font-semibold text-amber-300"> PII Redaction Engine</span>, and 
              <span className="font-semibold text-amber-300"> Cross-Student Access Boundaries</span>.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-vu-gold/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Security Audit Scorecard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audit Pass Rate</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {auditResults ? `${auditResults.passRatePercentage}%` : '100%'}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-vu-blue flex items-center justify-center font-bold">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PII Defense</span>
              <div className="text-2xl font-extrabold text-slate-900">ACTIVE</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Injection Guard</span>
              <div className="text-2xl font-extrabold text-slate-900">ENFORCED</div>
            </div>
          </div>
        </div>

        {/* Automated Security Test Suite Runner */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Automated Attack Vector Test Suite</h2>
              <p className="text-xs text-slate-500">
                {auditResults?.passedCount || 0} / {auditResults?.totalTests || 8} Security Tests Passed Successfully
              </p>
            </div>
            <button
              onClick={runSecurityTest}
              disabled={loading}
              className="bg-vu-navy hover:bg-[#134074] text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-vu-gold ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Executing Suite...' : 'Re-Run Security Suite'}</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {auditResults?.results?.map(test => (
              <div key={test.id} className="p-4 hover:bg-slate-50/50 transition text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {test.id}
                    </span>
                    <span className="font-bold text-slate-900">{test.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    test.actualStatus === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                    (test.actualStatus === 'SANITIZED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                  }`}>
                    {test.actualStatus}
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg font-mono text-[11px] text-slate-700">
                  <strong>Input:</strong> "{test.input}"
                </div>

                <p className="text-[11px] text-slate-500 pl-1">
                  <strong>Guardrail Action:</strong> {test.outcome}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Live PII & Injection Interactive Playground */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-vu-gold" />
            Live Guardrail & Sanitization Playground
          </h2>
          <p className="text-xs text-slate-500">
            Type any query containing sensitive personal info (emails, phone numbers, Aadhaar numbers) or jailbreak attempts to test the live defense engine.
          </p>

          <div className="space-y-3">
            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              rows={3}
              className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-vu-gold"
            />
            <button
              onClick={handleTestSanitize}
              className="bg-vu-navy hover:bg-[#134074] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-vu-gold" />
              <span>Sanitize & Check Guardrail</span>
            </button>
          </div>

          {sanitizedPreview && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">Prompt Injection:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  sanitizedPreview.isPromptInjection ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {sanitizedPreview.isPromptInjection ? 'DETECTED & BLOCKED' : 'CLEAN'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">PII Detected:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  sanitizedPreview.piiDetected ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {sanitizedPreview.piiDetected ? `REDACTED (${sanitizedPreview.piiTypes.join(', ')})` : 'NONE'}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700 block mb-1">Sanitized Output Passed to Advisory Engine:</span>
                <pre className="bg-slate-900 text-amber-300 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {sanitizedPreview.sanitizedText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Security Audit Log */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-vu-gold" />
              Real-Time Security Event Audit Log
            </h2>
            <button
              onClick={fetchLogs}
              className="text-xs text-vu-blue font-bold hover:underline"
            >
              Refresh Logs
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No security events logged yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="font-bold text-slate-800">{log.eventType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">"{log.querySnippet}"</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                    (log.status === 'SANITIZED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800')
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

