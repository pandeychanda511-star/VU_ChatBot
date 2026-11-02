import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Bot, 
  Sparkles, 
  Search, 
  CheckCircle, 
  Calculator, 
  Lightbulb, 
  ShieldCheck, 
  ArrowRight, 
  User, 
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AgenticPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('student_a');
  const [query, setQuery] = useState('Can I take Machine Learning next semester?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedAgent, setExpandedAgent] = useState(null);

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(d => {
        if (d.students) setStudents(d.students);
      })
      .catch(err => console.error('Error fetching students:', err));
  }, []);

  const handleRunAgentic = async (customQuery = null, customStudentId = null) => {
    const q = customQuery || query;
    const sId = customStudentId !== undefined ? customStudentId : selectedStudentId;

    if (!q.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/agentic/advise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          studentProfileId: sId || null
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Agentic execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  const sampleScenarios = [
    { label: 'Student A (Eligible for ML)', studentId: 'student_a', query: 'Can I take Machine Learning next semester?' },
    { label: 'Student B (Prerequisite Backlog in EDA)', studentId: 'student_b', query: 'Can I take Machine Learning next semester?' },
    { label: 'Student C (Credit Overload 28 cr)', studentId: 'student_c', query: 'Can I register for 28 credits in Semester 5?' },
    { label: 'Student D (Attendance Risk 68%)', studentId: 'student_d', query: 'Can I write the end-semester exam with 68% attendance?' },
    { label: 'Anonymous (Missing Course History)', studentId: '', query: 'Can I take Machine Learning next semester?' },
  ];

  const agentIcons = [Search, CheckCircle, Calculator, Lightbulb, ShieldCheck];
  const agentColors = ['blue', 'indigo', 'emerald', 'amber', 'purple'];

  return (
    <DashboardLayout title="Multi-Agent Workflow Studio">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-vu-navy via-[#134074] to-vu-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase #9: Agentic Architecture Extension</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Multi-Agent Academic Advisory Pipeline
            </h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Experience the 5-stage agentic workflow: 
              <span className="font-semibold text-amber-300"> Regulation Retrieval → Course Eligibility → Credit Calculation → Recommendation → Verification</span>. 
              Each specialized agent performs deterministic validation to eliminate hallucinations and enforce academic policies.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-vu-gold/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 5-Agent Interactive Visual Pipeline */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Cooperating Agent Architecture
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {[
              { num: 1, name: 'Regulation Retrieval', desc: 'Hybrid search across Student Handbook & Course Sheets', icon: Search, color: 'border-blue-500 text-blue-600 bg-blue-50' },
              { num: 2, name: 'Course Eligibility', desc: 'Evaluates prerequisites against student passed/failed history', icon: CheckCircle, color: 'border-indigo-500 text-indigo-600 bg-indigo-50' },
              { num: 3, name: 'Credit Calculation', desc: 'Audits semester credit limits (16-24 cr) and progression', icon: Calculator, color: 'border-emerald-500 text-emerald-600 bg-emerald-50' },
              { num: 4, name: 'Recommendation', desc: 'Synthesizes grounded advice and identifies missing info', icon: Lightbulb, color: 'border-amber-500 text-amber-600 bg-amber-50' },
              { num: 5, name: 'Verification & Guardrail', desc: 'Checks factual grounding and anti-hallucination policies', icon: ShieldCheck, color: 'border-purple-500 text-purple-600 bg-purple-50' },
            ].map((ag, i) => {
              const Icon = ag.icon;
              return (
                <div key={ag.num} className="relative flex flex-col p-4 rounded-xl border-2 border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-vu-navy text-white text-xs font-bold flex items-center justify-center">
                      {ag.num}
                    </span>
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 mb-1">{ag.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-tight">{ag.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Studio Controls: Student Profile & Query */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Context & Quick Scenarios */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <User className="w-4 h-4 text-vu-gold" />
                Active Student Profile
              </h3>

              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-vu-gold focus:outline-none mb-3"
              >
                <option value="">None (Anonymous / Generic Student)</option>
                {students.map(s => {
                  const scenarioDesc = s.scenario ? ` - ${s.scenario.slice(0, 40)}...` : (s.uun ? ` (${s.uun})` : '');
                  return (
                    <option key={s.id} value={s.id}>
                      {s.fullName || s.name}{scenarioDesc}
                    </option>
                  );
                })}
              </select>

              {selectedStudent ? (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{selectedStudent.name}</span>
                    <span className="text-amber-600">Sem {selectedStudent.currentSemester}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Credits: {selectedStudent.completedCredits}/160 | CGPA: {selectedStudent.cgpa}</div>
                  <div className="text-[11px] text-slate-600 pt-1">
                    <span className="font-semibold text-slate-700">Scenario:</span> {selectedStudent.scenario}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/80 text-[11px] text-amber-800">
                  No profile selected. System will trigger interactive follow-up questioning if course history is needed.
                </div>
              )}
            </div>

            {/* Quick Test Scenarios */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Preconfigured Test Scenarios
              </h3>
              <div className="space-y-2">
                {sampleScenarios.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedStudentId(sc.studentId);
                      setQuery(sc.query);
                      handleRunAgentic(sc.query, sc.studentId);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-vu-gold hover:bg-amber-50/40 text-xs text-slate-700 transition flex items-center justify-between group"
                  >
                    <span className="font-medium group-hover:text-vu-navy">{sc.label}</span>
                    <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-vu-gold shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Box & Trace Output */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Academic Advisory Query
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask an academic question..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-vu-gold"
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAgentic()}
                />
                <button
                  onClick={() => handleRunAgentic()}
                  disabled={loading || !query.trim()}
                  className="bg-vu-navy hover:bg-[#134074] text-white font-bold text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span>Executing...</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-vu-gold" />
                      <span>Run Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results & Agent Trace */}
            {result && (
              <div className="space-y-6 animate-fade-in">
                {/* Final Recommendation Card */}
                <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-vu-gold/40">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Final Agentic Recommendation</h4>
                        <p className="text-[11px] text-slate-400">Synthesized & verified across 5 cooperating agents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{result.metrics?.totalExecutionTimeMs || 0} ms</span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {result.reply}
                  </div>

                  {result.citations && result.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authoritative Sources:</span>
                      {result.citations.map((c, i) => (
                        <span key={i} className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium">
                          {c.displayText}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agentic Trace Explorer (5 Cooperating Agents) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-vu-gold" />
                    Agentic Execution Trace ({result.agentTrace?.length || 0} Stages)
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Inspect the reasoning, intermediate calculations, and validation checks performed by each agent.
                  </p>

                  <div className="space-y-3">
                    {result.agentTrace?.map((step, idx) => {
                      const Icon = agentIcons[idx % agentIcons.length];
                      const isExpanded = expandedAgent === idx;

                      return (
                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden transition">
                          <button
                            onClick={() => setExpandedAgent(isExpanded ? null : idx)}
                            className="w-full text-left p-3.5 bg-slate-50/80 hover:bg-slate-100 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-vu-navy text-white text-xs font-bold flex items-center justify-center">
                                {step.step}
                              </span>
                              <span className="font-bold text-xs text-slate-800">{step.agentName}</span>
                              <span className="text-[11px] text-slate-500 font-mono">({step.durationMs}ms)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                {step.status}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-white border-t border-slate-200 text-xs space-y-2">
                              <p className="text-slate-700 font-medium">{step.summary}</p>
                              {step.details && (
                                <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg text-[11px] overflow-x-auto font-mono">
                                  {JSON.stringify(step.details, null, 2)}
                                </pre>
                              )}
                              {step.checks && (
                                <div className="space-y-1 pt-1">
                                  <span className="font-bold text-slate-600 block">Guardrail Checks:</span>
                                  {step.checks.map((chk, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-2 text-slate-600">
                                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span><strong>{chk.check}:</strong> {chk.note}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase 9 Comparison Analysis Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-sm text-slate-900 mb-2">
            Why Agentic Architecture Outperforms Basic RAG (Phase #9 Insights)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-1">Standard RAG Limitations:</h4>
              <p>
                In standard RAG, the LLM receives retrieved document chunks and attempts to simultaneously interpret student eligibility, calculate credits, and format the advice. On complex scenarios (e.g. Student B who passed Python but failed EDA), basic RAG often misidentifies prerequisites or misses credit overload caps.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-1">Agentic Workflow Advantage:</h4>
              <p>
                By decomposing the advisory process into 5 specialized agents, each decision is verified deterministically: Course Eligibility directly compares course codes, Credit Calculation performs exact credit arithmetic, and the Verification Guardrail cross-checks all statements against source documents before presenting to the student.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

