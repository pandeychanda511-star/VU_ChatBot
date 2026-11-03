import React, { useState, useEffect } from 'react';
import { X, Table, AlertCircle, FileSpreadsheet, Check } from 'lucide-react';

/**
 * Controlled modal for inspecting cited Excel sheet data & rows.
 * Fetches structured row details from /api/sources/excel.
 */
export default function ExcelViewerModal({ citation, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Safely resolve sheet name and row number from citation or citation.metadata
  const rawSheetName = citation?.sheetName || citation?.metadata?.sheetName || (
    citation?.id ? citation.id.split('::')[1] : ''
  );
  const rawRowNumber = citation?.rowNumber || citation?.metadata?.rowNumber || (
    citation?.id && citation.id.includes('::r') ? citation.id.split('::r')[1] : ''
  );

  useEffect(() => {
    if (!citation) return;
    fetchRowData();
  }, [citation]);

  const fetchRowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const fileName = citation?.fileName || '';
      const sourceKey = fileName.toLowerCase().includes('minor') ? 'minors' : 'semester_spread';
      
      const sheetParam = rawSheetName ? `sheet=${encodeURIComponent(rawSheetName)}` : '';
      const rowParam = rawRowNumber ? `row=${encodeURIComponent(rawRowNumber)}` : '';
      const queryString = [sheetParam, rowParam].filter(Boolean).join('&');

      const url = `/api/sources/excel/${sourceKey}${queryString ? `?${queryString}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load excel data:', err);
      setError(err.message || 'Unable to load worksheet record');
    } finally {
      setLoading(false);
    }
  };

  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">
                {citation.fileName || 'Spreadsheet Source'}
              </h3>
              <p className="text-xs text-emerald-200">
                Sheet: <span className="font-medium text-white">{rawSheetName || data?.sheetName || 'Overview'}</span>
                {rawRowNumber ? (
                  <> • Cited Row: <span className="font-medium text-white">{rawRowNumber}</span></>
                ) : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          {loading && (
            <div className="py-12 text-center text-slate-500">
              <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading verified worksheet row data...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to display row</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Fallback to citation snippet if data.record is empty or when loading completes */}
          {citation.textSnippet && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Verified Citation Evidence:
              </span>
              <p className="text-xs font-mono text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/70 leading-relaxed whitespace-pre-wrap">
                {citation.textSnippet}
              </p>
            </div>
          )}

          {data && data.record && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center">
                  <Table className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Extracted Record Details {rawRowNumber ? `(Row ${rawRowNumber})` : ''}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(data.record.cellValues || {}).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-600 block text-[11px] mb-0.5">
                        {key}:
                      </span>
                      <span className="text-slate-900 break-words font-mono text-[11px]">
                        {String(val) || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Text Line */}
              {data.record.text && (
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Full Searchable Row Record:
                  </span>
                  <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                    {data.record.text}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* If sheet has records list */}
          {data && !data.record && data.records && data.records.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center">
                <Table className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Sheet Records Overview ({data.sheetName})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.records.slice(0, 10).map((r, i) => (
                  <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs font-mono text-slate-700">
                    {r.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            Authoritative source: {citation.fileName}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
