import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { HelpCircle, ShieldCheck, Database, Cpu, MessageSquare } from 'lucide-react';

export default function HelpPage() {
  return (
    <DashboardLayout title="Help & About">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b2545]">About Vidyashilp University Academic Advisor</h2>
              <p className="text-xs sm:text-sm text-slate-500">Architecture, verification safeguards, and usage guidelines.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            The Vidyashilp University Academic Advisor is an enterprise-grade AI system specifically engineered to assist students, faculty, and advisors with high-confidence answers grounded strictly in authorized university documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Grounded Accuracy</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Every response is strictly synthesized from 4 authoritative institutional documents with verifiable page and sheet citations.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Four Authoritative Sources</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Student Handbook Aug 2026, Student SOP 17082026, Minor Courses for BTech, and Semester Spread Structures Sept 2026.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Deterministic Citations</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Interactive modal inspectors allow instant side-by-side verification of original PDF text and Excel tabular rows.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

