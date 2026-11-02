import React from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { 
  MessageSquare, 
  Calendar, 
  Layers, 
  FileText, 
  ArrowRight,
  Sparkles,
  Cpu,
  Volume2,
  BarChart3,
  ShieldCheck,
  Scale,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

export default function DashboardOverview() {
  const cards = [
    {
      title: 'Academic Chatbot',
      description: 'Interactive RAG & Agentic chatbot with student profiles & voice.',
      icon: MessageSquare,
      path: '/dashboard/chatbot',
      badge: 'Core Chat'
    },
    {
      title: 'Multi-Agent Advisory Studio',
      description: '5-agent pipeline: Retrieval → Eligibility → Credits → Recommendation → Verification.',
      icon: Cpu,
      path: '/dashboard/agentic',
      badge: 'Phase 9'
    },
    {
      title: 'Multimodal Advising Studio',
      description: 'Interactive course flowcharts, audio briefings, and transcript analyzer.',
      icon: Volume2,
      path: '/dashboard/multimodal',
      badge: 'Phase 8'
    },
    {
      title: 'Evaluation & Benchmarks',
      description: '25 academic test cases comparing Basic LLM, RAG, and Agentic stages.',
      icon: BarChart3,
      path: '/dashboard/evaluation',
      badge: 'Phase 4/5'
    },
    {
      title: 'Privacy & Security Audit',
      description: 'Active prompt injection defense, PII redaction, and audit logs.',
      icon: ShieldCheck,
      path: '/dashboard/security',
      badge: 'Phase 10'
    },
    {
      title: 'Ethics, Copyright & Legal Hub',
      description: 'Analysis of 3 AI outputs, copyright ownership, and fair use guidelines.',
      icon: Scale,
      path: '/dashboard/ethics',
      badge: 'Phase 11'
    },
    {
      title: 'Semester & Curriculum',
      description: 'Explore semester-wise courses and curriculum credit distributions.',
      icon: Calendar,
      path: '/dashboard/curriculum',
      badge: 'Authoritative'
    },
    {
      title: 'Minor Courses for B.Tech',
      description: 'Explore minor tracks: Psychology, Law, Start-up, and Liberal Arts.',
      icon: Layers,
      path: '/dashboard/minors',
      badge: 'Specializations'
    },
    {
      title: 'Student Handbook & Policies',
      description: 'Official academic regulations, attendance rules, and grading scale.',
      icon: FileText,
      path: '/dashboard/handbook',
      badge: 'Regulations'
    }
  ];

  return (
    <DashboardLayout title="Academic Decision-Support Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto pb-8">
        {/* 1. Dashboard Welcome Banner */}
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-300 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="relative z-10 max-w-2xl flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-xs font-semibold mb-3.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Assignments #1 & #2 Complete Decision-Support System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0b2545] tracking-tight leading-tight">
              Vidyashilp University Academic Decision-Support System
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              An enterprise-grade, multimodal, secure, and agentic AI Academic Advisor grounded in verified university documents. Features interactive follow-up questioning, multi-agent orchestration, automated evaluation, and privacy safeguards.
            </p>
          </div>

          <div className="relative flex-shrink-0 w-48 sm:w-56 lg:w-64 h-36 sm:h-40 flex items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-slate-50 to-amber-50/40 border border-slate-100 shadow-inner">
            <img 
              src="/assets/dashboard_academic.jpg" 
              alt="Academic Advisor Illustration" 
              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* 2. Key Architecture Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grounded Records</span>
              <div className="text-base font-extrabold text-slate-800">589 Records</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agentic Stages</span>
              <div className="text-base font-extrabold text-slate-800">5 Agents</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modalities</span>
              <div className="text-base font-extrabold text-slate-800">3 Modalities</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Audit</span>
              <div className="text-base font-extrabold text-emerald-600">100% Pass</div>
            </div>
          </div>
        </div>

        {/* 3. Primary Action Banner */}
        <Link
          to="/dashboard/chatbot"
          className="group block bg-[#0b2545] hover:bg-[#07192f] rounded-2xl p-6 sm:p-7 text-white shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 transition-all duration-200 border border-slate-800"
        >
          <div className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-4.5 min-w-0">
              <div className="w-13 h-13 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors duration-200 shadow-xs">
                <MessageSquare className="w-6 h-6 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Open Academic Chatbot
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full shadow-2xs">
                    RAG & Agentic Ready
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-normal">
                  Ask course eligibility, prerequisite checks, or attendance rules with voice and student profile support.
                </p>
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-amber-400 group-hover:bg-amber-300 text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition-all duration-200 group-hover:scale-105">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </div>
        </Link>

        {/* 4. Complete Feature Grid (3x3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.path}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-md hover:border-amber-400/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all duration-200 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-950 group-hover:border-amber-400 transition-colors duration-200 shadow-xs">
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60">
                      {card.badge}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-[#0b2545] transition-colors duration-200 tracking-tight">
                    {card.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {card.description}
                  </p>
                </div>

                <div className="flex items-center justify-end text-xs font-semibold text-vu-blue group-hover:text-amber-600 transition pt-2 border-t border-slate-100">
                  <span className="mr-1">Open Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
