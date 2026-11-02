import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ExcelViewerModal from '../components/ExcelViewerModal';
import { Calendar, Search, BookOpen, ExternalLink } from 'lucide-react';

export default function CurriculumPage() {
  const [activeModal, setActiveModal] = useState(null);

  const programs = [
    {
      code: 'BTECH-CS',
      title: 'B.Tech in Computer Science & Engineering',
      duration: '4 Years (8 Semesters)',
      regulations: 'Sept 2026 Structure',
      doc: 'Semester_Spread_Structures_Sept_2026.xlsx',
      sheet: 'BTech CSE',
      row: 4
    },
    {
      code: 'BTECH-AI',
      title: 'B.Tech in Artificial Intelligence & Data Science',
      duration: '4 Years (8 Semesters)',
      regulations: 'Sept 2026 Structure',
      doc: 'Semester_Spread_Structures_Sept_2026.xlsx',
      sheet: 'BTech AI & DS',
      row: 4
    },
    {
      code: 'BA-LLB',
      title: 'Integrated B.A. LL.B. (Hons.) / B.B.A. LL.B. (Hons.)',
      duration: '5 Years (10 Semesters)',
      regulations: 'Sept 2026 Structure',
      doc: 'Semester_Spread_Structures_Sept_2026.xlsx',
      sheet: 'Law Courses',
      row: 4
    },
    {
      code: 'BBA-HONS',
      title: 'Bachelor of Business Administration (Hons.)',
      duration: '3/4 Years NEP Framework',
      regulations: 'Sept 2026 Structure',
      doc: 'Semester_Spread_Structures_Sept_2026.xlsx',
      sheet: 'BBA Structure',
      row: 4
    }
  ];

  return (
    <DashboardLayout title="Semester & Curriculum">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b2545]">Official Semester Spread Structures</h2>
              <p className="text-xs sm:text-sm text-slate-500">Authorized curriculum datasets for Vidyashilp University programs.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            Curriculum data is retrieved directly from <span className="font-semibold text-slate-800">Semester_Spread_Structures_Sept_2026.xlsx</span>. You can inspect the source rows and sheets using the built-in verified viewer below or ask specific questions directly to the Academic Chatbot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {programs.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-amber-400/80 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">
                    {item.code}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-2.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.duration} • {item.regulations}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Sheet: {item.sheet}</span>
                <button
                  onClick={() => setActiveModal({
                    sourceDocument: item.doc,
                    sheetName: item.sheet,
                    rowNumber: item.row
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Inspect Sheet</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeModal && (
        <ExcelViewerModal
          citation={activeModal}
          onClose={() => setActiveModal(null)}
        />
      )}
    </DashboardLayout>
  );
}

