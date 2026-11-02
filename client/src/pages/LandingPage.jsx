import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  ArrowRight, 
  BookOpen, 
  FileCheck, 
  Layers, 
  Award,
  Sparkles,
  HelpCircle,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-vu-navy text-white px-6 sm:px-12 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-xl bg-vu-gold text-vu-navy flex items-center justify-center font-bold shadow-md">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">Vidyashilp University</h1>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Academic Advisor</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-200">
          <a href="#home" className="text-vu-gold hover:text-white transition">Home</a>
          <a href="#features" className="hover:text-vu-gold transition">Features</a>
          <a href="#how-it-works" className="hover:text-vu-gold transition">How It Works</a>
          <a href="#about" className="hover:text-vu-gold transition">About</a>
        </nav>

        <div>
          <button
            onClick={() => navigate('/login')}
            className="bg-vu-gold hover:bg-amber-400 text-vu-navy font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center px-6 sm:px-12 py-20 sm:py-28 overflow-hidden bg-vu-navy"
        style={{
          backgroundImage: `url('/assets/vidyashilp_campus.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Subtle dark navy gradient overlay to keep campus visible while ensuring contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b2545]/85 via-[#0b2545]/75 to-[#07192f]/90 pointer-events-none" />

        {/* Centered Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* AI Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-semibold mb-6 shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Powered Academic Support</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight mb-6 drop-shadow-md">
            Vidyashilp University <br />
            <span className="text-vu-gold">Academic Advisor</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-100 max-w-2xl leading-relaxed mb-10 font-medium drop-shadow-sm">
            Your official AI assistant for university-related academic guidance, curriculum policies, course regulations, and verified academic information.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="bg-vu-gold hover:bg-amber-400 text-vu-navy font-bold text-sm sm:text-base px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="px-8 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all border border-white/30 hover:border-white/50 shadow-md cursor-pointer"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Decorative subtle gold accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-vu-gold/40 via-amber-300 to-vu-gold/40" />
      </section>

      {/* Feature Cards Grid (Panel 1) */}
      <section id="features" className="py-14 px-6 sm:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-vu-navy">Grounded University Intelligence</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Strictly verified academic information drawn from official regulations and course spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-vu-gold flex items-center justify-center font-bold mb-3 border border-amber-200/50">
                <Sparkles className="w-5 h-5 text-vu-gold" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Academic Guidance</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Get answers to university academic queries, attendance policies, and grading standards.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-vu-blue flex items-center justify-center font-bold mb-3 border border-blue-200/50">
                <FileCheck className="w-5 h-5 text-vu-blue" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Document-Based Responses</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Trusted information derived strictly from official university regulations and guidelines.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-3 border border-emerald-200/50">
                <BookOpen className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Semester & Courses</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Find semester-wise courses, curriculum credits, and prerequisite structures across batches.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-vu-gold flex items-center justify-center font-bold mb-3 border border-amber-200/50">
                <Award className="w-5 h-5 text-vu-gold" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">Verified Citations</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                View source documents (PDF/Excel) with exact page numbers or row references.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Three Step Process) */}
      <section id="how-it-works" className="py-14 px-6 sm:px-12 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-vu-navy mb-10">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-vu-gold text-vu-navy font-extrabold text-base flex items-center justify-center shadow-md mb-3 border-2 border-white">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Get Started</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Click "Get Started" and login with Demo User for presentation access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-vu-gold text-vu-navy font-extrabold text-base flex items-center justify-center shadow-md mb-3 border-2 border-white">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Ask Your Question</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Type any university-related academic or policy question in natural language.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-vu-gold text-vu-navy font-extrabold text-base flex items-center justify-center shadow-md mb-3 border-2 border-white">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 mb-1">Get Verified Answers</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Receive accurate answers grounded in authoritative documents with citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean University Footer */}
      <footer id="about" className="bg-vu-navy text-white py-8 px-6 sm:px-12 mt-auto border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-vu-gold text-vu-navy flex items-center justify-center font-bold text-xs">VU</div>
            <span className="text-slate-300 font-semibold">Vidyashilp University Academic Advisor</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <a href="#home" className="hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <button onClick={() => navigate('/login')} className="hover:text-vu-gold transition">Demo Login</button>
            <span className="text-slate-500">© 2026 Vidyashilp University</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

