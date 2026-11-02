import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Sparkles, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  X, 
  Filter,
  FileCheck2,
  TrendingUp,
  Cpu
} from 'lucide-react';

export default function EvaluationPage() {
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState('Agentic Workflow');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = () => {
    setLoading(true);
    fetch('/api/evaluation/results')
      .then(r => r.json())
      .then(d => setBenchmarkData(d))
      .catch(err => console.error('Evaluation error:', err))
      .finally(() => setLoading(false));
  };

  const handleRunEvaluation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' });
      const data = await res.json();
      setBenchmarkData(data);
    } catch (err) {
      console.error('Run evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stagesList = benchmarkData?.stages ? Object.keys(benchmarkData.stages) : [];
  const activeStageData = benchmarkData?.stages?.[selectedStage];

  return (
    <DashboardLayout title="Quantitative Evaluation & Benchmarking">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-vu-navy via-[#134074] to-vu-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase #4 & #5: Evaluation, Measurement & Comparative Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Systematic Benchmarking & Developmental Evolution
            </h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Evaluating 25 predefined academic test scenarios across 5 system evolutionary stages: 
              <span className="font-semibold text-amber-300"> Basic LLM → Structured Prompting → RAG → RAG + Student Data → Agentic Workflow</span>. 
              Measuring accuracy, hallucination rate, eligibility correctness, and missing data handling.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-vu-gold/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-5 shadow-sm border border-slate-200 gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Comparative Developmental Matrix</h2>
            <p className="text-xs text-slate-500">Total Predefined Test Cases: {benchmarkData?.totalTestCases || 25}</p>
          </div>
          <button
            onClick={handleRunEvaluation}
            disabled={loading}
            className="bg-vu-navy hover:bg-[#134074] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-vu-gold ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating Test Suite...' : 'Re-Run Evaluation Benchmark'}</span>
          </button>
        </div>

        {/* Quantitative Comparison Table across 5 Stages */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Development Stage</th>
                  <th className="py-3.5 px-4 text-center">Accuracy (%)</th>
                  <th className="py-3.5 px-4 text-center">Hallucination Rate</th>
                  <th className="py-3.5 px-4 text-center">Eligibility Decisions</th>
                  <th className="py-3.5 px-4 text-center">Source Provenance</th>
                  <th className="py-3.5 px-4 text-center">Missing Info Handling</th>
                  <th className="py-3.5 px-4 text-center">Avg Response Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stagesList.map(stName => {
                  const s = benchmarkData.stages[stName];
                  const isSelected = selectedStage === stName;
                  return (
                    <tr
                      key={stName}
                      onClick={() => setSelectedStage(stName)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-vu-gold' : 'bg-slate-300'}`} />
                          <span className="font-bold text-slate-900">{stName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          s.accuracyPercentage >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          (s.accuracyPercentage >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800')
                        }`}>
                          {s.accuracyPercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className={`font-bold ${s.hallucinationRate === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {s.hallucinationRate}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {s.eligibilityAccuracy}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {s.sourceCorrectnessRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        {s.missingInformationHandlingRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {s.averageResponseTimeMs} ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Stage Breakdown & Test Case Inspector */}
        {activeStageData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Detailed Test Results for: <span className="text-vu-navy">{selectedStage}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Passed {activeStageData.correctCount} / {activeStageData.totalTests} ({activeStageData.accuracyPercentage}%) | 
                  Partially Correct: {activeStageData.partiallyCorrectCount} | 
                  Hallucinated: {activeStageData.hallucinatedCount}
                </p>
              </div>

              {/* Stage Switcher Pills */}
              <div className="flex flex-wrap gap-1">
                {stagesList.map(st => (
                  <button
                    key={st}
                    onClick={() => setSelectedStage(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedStage === st 
                        ? 'bg-vu-navy text-white shadow-xs' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Cases List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {activeStageData.testCases?.map(tc => {
                const isCorrect = tc.classification === 'Correct';
                const isPartial = tc.classification === 'Partially Correct';
                const isHallucinated = tc.classification === 'Unsupported/Hallucinated';

                return (
                  <div key={tc.testId} className="p-4 hover:bg-slate-50/50 transition text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {tc.testId}
                        </span>
                        <h4 className="font-bold text-slate-900">{tc.query}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' :
                        (isPartial ? 'bg-amber-100 text-amber-800' :
                        (isHallucinated ? 'bg-red-100 text-red-800' : 'bg-red-50 text-red-700'))
                      }`}>
                        {tc.classification}
                      </span>
                    </div>

                    <div className="text-slate-500 pl-8">
                      <strong className="text-slate-600">Expected Outcome:</strong> {tc.expectedDecision}
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 pl-3 text-slate-700 font-mono text-[11px] ml-8">
                      <strong>Actual Output:</strong> {tc.actualAnswer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase 5 Insights & Evolution Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-vu-gold" />
              Correctness vs. Reliability Distinction
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Correctness:</strong> Whether the recommendation strictly matches verified university guidelines on straightforward questions.<br />
              <strong>Reliability:</strong> Whether the system consistently rejects unsupported assumptions, triggers interactive follow-ups when student background is missing, and explicitly acknowledges missing data.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              Basic LLMs achieved only 20% reliability because they hallucinated answers to missing historical policies. Grounded RAG + Agentic verification brought hallucination rate to <strong>0%</strong>.
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              Handling of Missing Information (Phase 5 Requirement)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tested against 3 specific unrecorded queries (1985 CSE syllabus, hostel fee waivers, 1995 sports quotas). Instead of fabricating plausible policies, the system responds deterministically:
            </p>
            <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border border-emerald-200 text-xs font-mono">
              "Data is not available in the provided university documents."
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

