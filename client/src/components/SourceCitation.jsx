import React from 'react';
import { FileText, Sheet, ExternalLink } from 'lucide-react';

/**
 * Renders verified citation references beneath assistant responses.
 * Clicking a citation opens either the PDF viewer or Excel sheet modal.
 *
 * @param {object} props
 * @param {Array<object>} props.citations
 * @param {Function} props.onSelectCitation
 */
export default function SourceCitation({ citations, onSelectCitation }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center">
        <span>Verified Sources & Evidence ({citations.length}):</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {citations.map((cite, idx) => {
          const isPdf = cite.sourceType === 'pdf';
          const isExcel = cite.sourceType === 'excel';

          return (
            <button
              key={cite.id || idx}
              type="button"
              onClick={() => onSelectCitation && onSelectCitation(cite)}
              title={
                isPdf
                  ? `Click to view ${cite.fileName} at page ${cite.pageNumber}`
                  : `Click to inspect ${cite.fileName} (${cite.sheetName}, Row ${cite.rowNumber})`
              }
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition shadow-xs border ${
                isPdf
                  ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
              }`}
            >
              {isPdf ? (
                <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <Sheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span className="truncate max-w-[240px] sm:max-w-[320px]">
                {cite.displayText || cite.fileName}
              </span>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

