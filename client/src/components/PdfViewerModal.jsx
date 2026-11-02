import React from 'react';
import { X, FileText, ExternalLink, Download } from 'lucide-react';

/**
 * PDF Viewer Modal that embeds the original PDF positioned at the cited page.
 */
export default function PdfViewerModal({ citation, onClose }) {
  if (!citation) return null;

  const sourceKey = citation.fileName.includes('Handbook') ? 'handbook' : 'sop';
  const pageNum = citation.pageNumber || 1;
  const pdfUrl = `/api/sources/pdf/${sourceKey}#page=${pageNum}&toolbar=1&navpanes=0`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white w-full max-w-4xl h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-rose-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-rose-800 rounded-lg">
              <FileText className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                {citation.fileName}
              </h3>
              <p className="text-xs text-rose-200">
                Opening directly at: <span className="font-bold text-white">Page {pageNum}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new browser tab"
              className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded PDF iframe */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe
            src={pdfUrl}
            title={citation.fileName}
            className="w-full h-full border-0"
          />
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <span>Cited Page: {pageNum}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

