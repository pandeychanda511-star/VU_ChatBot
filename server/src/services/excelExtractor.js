import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

/**
 * Extracts structured records from an Excel workbook (.xlsx).
 * Preserves sheet names, 1-based row numbers, headers, and column/value relationships.
 * Retains meaningful source values without flattening whole sheets into a single blob.
 *
 * @param {string} filePath - Absolute path to XLSX file
 * @param {string} originalFileName - Authoritative filename
 * @returns {Promise<{
 *   sourceType: 'excel',
 *   fileName: string,
 *   sheetNames: string[],
 *   totalRecords: number,
 *   sheets: Array<{
 *     sheetName: string,
 *     totalRows: number,
 *     recordCount: number,
 *     emptyRows: number,
 *     headers: string[],
 *     records: Array<{
 *       sourceType: 'excel',
 *       fileName: string,
 *       sheetName: string,
 *       rowNumber: number,
 *       cellValues: Record<string, any>,
 *       text: string
 *     }>
 *   }>
 * }>}
 */
export async function extractExcel(filePath, originalFileName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath, { cellFormula: false, cellHTML: false });
  const sheetNames = workbook.SheetNames;
  const processedSheets = [];
  let totalRecords = 0;

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    // Convert to 2D array of raw values preserving row indices
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawData || rawData.length === 0) {
      processedSheets.push({
        sheetName,
        totalRows: 0,
        recordCount: 0,
        emptyRows: 0,
        headers: [],
        records: []
      });
      continue;
    }

    // Identify header row: usually first non-empty row or a row with recognizable column names
    let headerRowIndex = -1;
    let headers = [];

    for (let r = 0; r < Math.min(rawData.length, 10); r++) {
      const row = rawData[r];
      const nonEmpties = row.filter(cell => cell !== null && String(cell).trim() !== '');
      if (nonEmpties.length >= 2) {
        // Look for keywords or first substantial row
        headerRowIndex = r;
        headers = row.map((cell, idx) => {
          const val = String(cell || '').trim();
          return val || `Column_${idx + 1}`;
        });
        break;
      }
    }

    const records = [];
    let emptyRows = 0;

    for (let r = 0; r < rawData.length; r++) {
      const row = rawData[r];
      const actualRowNumber = r + 1; // 1-based row number matching spreadsheet UI

      // Check if row is completely empty
      const nonEmpties = row.filter(cell => cell !== null && String(cell).trim() !== '');
      if (nonEmpties.length === 0) {
        emptyRows++;
        continue;
      }

      // Map values against headers if available
      const cellValues = {};
      const textParts = [];

      row.forEach((cell, colIdx) => {
        const val = String(cell !== undefined && cell !== null ? cell : '').trim();
        if (val !== '') {
          const headerName = (headers[colIdx] && headers[colIdx] !== `Column_${colIdx + 1}`)
            ? headers[colIdx]
            : null;

          if (headerName) {
            cellValues[headerName] = val;
            textParts.push(`${headerName}: ${val}`);
          } else {
            const colLetter = XLSX.utils.encode_col(colIdx);
            cellValues[`Col_${colLetter}`] = val;
            textParts.push(val);
          }
        }
      });

      if (textParts.length > 0) {
        records.push({
          sourceType: 'excel',
          fileName: originalFileName,
          sheetName,
          rowNumber: actualRowNumber,
          cellValues,
          text: textParts.join(' | ')
        });
      } else {
        emptyRows++;
      }
    }

    totalRecords += records.length;
    processedSheets.push({
      sheetName,
      totalRows: rawData.length,
      recordCount: records.length,
      emptyRows,
      headers,
      records
    });
  }

  return {
    sourceType: 'excel',
    fileName: originalFileName,
    sheetNames,
    totalRecords,
    sheets: processedSheets
  };
}

