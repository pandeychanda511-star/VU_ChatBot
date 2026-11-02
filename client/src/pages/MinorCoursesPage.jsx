import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ExcelViewerModal from '../components/ExcelViewerModal';
import { Layers, BookOpen, CheckCircle2 } from 'lucide-react';

export default function MinorCoursesPage() {
  const [activeModal, setActiveModal] = useState(null);

  const minorTracks = [
    {
      title: 'Law Minor for B.Tech',
      description: 'Regulating platform and Gig workers, Intellectual Property, and Cyber Law frameworks.',
      sheet: 'Law Minor',
      row: 2,
      doc: 'Minor_Courses_for_BTech_Students.xlsx'
    },
    {
      title: 'Management & Entrepreneurship',
      description: 'Business finance, startup strategy, venture development, and team leadership.',
      sheet: 'Management Minor',
      row: 2,
      doc: 'Minor_Courses_for_BTech_Students.xlsx'
    },
    {
      title: 'Design & Human-Centered Innovation',
      description: 'Interaction design, usability engineering, product semantics, and physical computing.',
      sheet: 'Design Minor',
      row: 2,
      doc: 'Minor_Courses_for_BTech_Students.xlsx'
    },
    {
      title: 'Psychology & Behavioral Sciences',
      description: 'Cognitive ergonomics, organizational psychology, and behavioral economics.',
      sheet: 'Psychology Minor',
      row: 2,
      doc: 'Minor_Courses_for_BTech_Students.xlsx'
    }
  ];

  return (
    <DashboardLayout title="Minor Courses">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b2545]">Minor Course Tracks for B.Tech Students</h2>
              <p className="text-xs sm:text-sm text-slate-500">Official interdisciplinary minor tracks and credit pathways.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            Data sourced directly from <span className="font-semibold text-slate-800">Minor_Courses_for_BTech_Students.xlsx</span>. Students can pursue minors across interdisciplinary schools to earn specialized graduation honors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {minorTracks.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-amber-400/80 transition-all flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
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
                  <span>Inspect Excel Data</span>
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

