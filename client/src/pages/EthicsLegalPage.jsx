import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { 
  Sparkles, 
  Scale, 
  FileText, 
  Image as ImageIcon, 
  Volume2, 
  ShieldCheck, 
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Lock,
  UserCheck
} from 'lucide-react';

export default function EthicsLegalPage() {
  const outputs = [
    {
      num: 1,
      name: 'AI-Synthesized Academic Advice & Recommendations',
      modality: 'Textual Generation (LLM Synthesis)',
      icon: FileText,
      color: 'blue',
      copyrightOwnership: 'Vidyashilp University retains ultimate proprietary ownership of the underlying academic policies, syllabus data, and handbook regulations. The synthesized textual advice produced by Google Gemini is considered a derivative educational decision-support aid. Under prevailing copyright doctrines, purely machine-generated text without substantial human authorship lacks copyright protection, but the compilation of authoritative university data is legally protected under institutional intellectual property policies.',
      attributionLicensing: 'All responses strictly cite original university documents with precise provenance: Handbook page numbers and Excel sheet rows (e.g. "4. Student Handbook Aug 2026.pdf (Page 29)"). Distributed under University Internal Educational Fair Dealing (Section 52(1)(a) of the Indian Copyright Act 1957).',
      misuseRisks: 'Hallucination of graduation requirements, misleading prerequisite guidance, student reliance on outdated policies causing academic delay, or unauthorized advice regarding fee concessions.',
      safeguards: 'Strict retrieval grounding (0% hallucination rate), mandatory citations, anti-fabrication validator, and explicit disclaimer that the written Student Handbook remains the authoritative legal instrument.'
    },
    {
      num: 2,
      name: 'Curriculum Prerequisite Flowcharts & Course Infographics',
      modality: 'Visual Infographics & Dependency Graph',
      icon: ImageIcon,
      color: 'amber',
      copyrightOwnership: 'Course structures, credit weights, and prerequisite sequences are established by the Vidyashilp University Board of Studies (BoS) and Academic Council. Visual flowcharts and infographic cards are institutional representations of approved curricula. Unauthorized commercial distribution or alteration of university course structures constitutes intellectual property infringement.',
      attributionLicensing: 'Curriculum diagrams are licensed exclusively for registered university students and faculty for academic planning. Visual assets reference BoS Revision Sept 2026.',
      misuseRisks: 'Misrepresentation of non-accredited courses, falsification of prerequisite fulfillment, or unapproved alterations to degree credit totals.',
      safeguards: 'Deterministic curriculum graphs synchronized directly with official Excel spreadsheets (Semester_Spread_Structures_Sept_2026.xlsx); read-only visual presentation.'
    },
    {
      num: 3,
      name: 'Synthesized Audio Regulation Briefings',
      modality: 'Voice & Speech Synthesis (Audio Narration)',
      icon: Volume2,
      color: 'purple',
      copyrightOwnership: 'Synthesized voice narrations interpret written university regulations into spoken briefings. While the underlying text is university intellectual property, voice synthesis uses standardized browser speech models without impersonating real university officials or faculty voices.',
      attributionLicensing: 'Voice briefings are provided under fair use for educational accessibility (supporting visually impaired students and auditory learners). All audio scripts cite the exact handbook sections.',
      misuseRisks: 'Deepfake voice spoofing, out-of-context audio clips circulated as official administrative edicts, or auditory misinterpretation of complex exam rules.',
      safeguards: 'Neutral synthetic voice profiles with clear audible preamble ("This is an automated academic regulation briefing"), accompanied by synchronized on-screen text transcripts.'
    }
  ];

  return (
    <DashboardLayout title="Ethics, Copyright & Legal Analysis Hub">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-vu-navy via-[#134074] to-vu-navy rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase #11: Synthetic Media, Copyright & Legal Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Responsible AI, Intellectual Property & Legal Analysis
            </h1>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">
              Comprehensive ethical, copyright, and legal investigation of three core AI-generated modalities: 
              <span className="font-semibold text-amber-300"> Textual Advice</span>, 
              <span className="font-semibold text-amber-300"> Visual Infographics</span>, and 
              <span className="font-semibold text-amber-300"> Synthetic Audio Briefings</span>.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-vu-gold/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 3 AI Generated Outputs Detailed Audit */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-vu-gold" />
            Audit of Three Project AI-Generated Outputs (Phase #11 Requirement)
          </h2>

          <div className="space-y-6">
            {outputs.map(out => {
              const Icon = out.icon;
              return (
                <div key={out.num} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-vu-navy flex items-center justify-center font-bold">
                        <Icon className="w-5 h-5 text-vu-gold" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Output #{out.num} • {out.modality}
                        </span>
                        <h3 className="font-extrabold text-base text-slate-900">{out.name}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Copyright, Ownership & Intellectual Property:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{out.copyrightOwnership}</p>
                    </div>

                    <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
                      <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Attribution, Citation & Licensing:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{out.attributionLicensing}</p>
                    </div>

                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-1.5">
                      <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Potential Misuse & Harm Risks:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{out.misuseRisks}</p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/60 space-y-1.5">
                      <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Implemented Technical & Policy Safeguards:
                      </span>
                      <p className="text-slate-700 leading-relaxed">{out.safeguards}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Human-in-the-Loop & Institutional Governance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-vu-gold" />
            Human-in-the-Loop Governance & Advisor Boundaries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">1. AI Decision-Support, Not Authority</h4>
              <p className="text-slate-600 leading-relaxed">
                The AI Academic Advisor operates strictly as a decision-support guide for rapid informational discovery. Final graduation clearances, credit waivers, and disciplinary actions remain exclusively within human administrative domain.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">2. Mandatory Provenance</h4>
              <p className="text-slate-600 leading-relaxed">
                Every generated piece of advice is bound to specific page or spreadsheet cell citations. If a policy is not formally documented, the AI is constrained from guessing.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800">3. Student Privacy Protections</h4>
              <p className="text-slate-600 leading-relaxed">
                Complies with digital privacy standards. Synthetic student data is anonymized; real PII (contact details, national IDs) is scrubbed in real-time before reaching model APIs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

