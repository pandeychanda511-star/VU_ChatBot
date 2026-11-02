import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import PdfViewerModal from '../components/PdfViewerModal';
import { FileText, BookOpen, ShieldCheck } from 'lucide-react';

export default function HandbookPage() {
  const [activePdfModal, setActivePdfModal] = useState(null);

  const policySections = [
    {
      title: 'Student Handbook (Aug 2026)',
      doc: '4. Student Handbook Aug 2026.pdf',
      page: 1,
      description: 'Comprehensive guidelines covering academic credits, grading scales, examination protocols, and graduation criteria.',
      badge: 'Official Handbook'
    },
    {
      title: 'Student SOP Guidelines',
      doc: 'SOP STUDENT 17082026 - Final.pdf',
      page: 1,
      description: 'Standard Operating Procedures for course registrations, leave applications, grievance redressal, and code of conduct.',
      badge: 'Operational SOP'
    },
    {
      title: 'Attendance Regulations & Leave Policy',
      doc: '4. Student Handbook Aug 2026.pdf',
      page: 12,
      description: 'Minimum 75% attendance requirements, condonation rules for medical emergencies, and documented approval flows.',
      badge: 'Academic Policy'
    },
    {
      title: 'Examination & Evaluation Framework',
      doc: 'SOP STUDENT 17082026 - Final.pdf',
      page: 8,
      description: 'Continuous assessment breakdown, end-semester evaluation weightages, and re-evaluation submission timelines.',
      badge: 'Evaluation Rule'
    }
  ];

  return (
    <DashboardLayout title="Student Handbook & Policies">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0b2545]">Official Handbooks & University SOPs</h2>
              <p className="text-xs sm:text-sm text-slate-500">Verified regulatory documentation governing university academics.</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            All chatbot answers referencing institutional policy are cross-referenced with exact page numbers from <span className="font-semibold text-slate-800">4. Student Handbook Aug 2026.pdf</span> and <span className="font-semibold text-slate-800">SOP STUDENT 17082026 - Final.pdf</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {policySections.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-amber-400/80 transition-all flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {item.badge}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-2.5">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">Page: {item.page}</span>
                <button
                  onClick={() => setActivePdfModal({
                    sourceDocument: item.doc,
                    pageNumber: item.page
                  })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View PDF Page</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activePdfModal && (
        <PdfViewerModal
          citation={activePdfModal}
          onClose={() => setActivePdfModal(null)}
        />
      )}
    </DashboardLayout>
  );
}

