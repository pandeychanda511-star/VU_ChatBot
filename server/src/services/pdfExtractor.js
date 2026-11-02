import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Extracts text page-by-page from a PDF file using pdfjs-dist.
 * Preserves 1-based page numbers, original filename, and flags potential scanned/empty pages.
 *
 * @param {string} filePath - Absolute path to PDF file
 * @param {string} originalFileName - Authoritative filename
 * @returns {Promise<{
 *   sourceType: 'pdf',
 *   fileName: string,
 *   pageCount: number,
 *   extractedPageCount: number,
 *   emptyPages: number[],
 *   pages: Array<{
 *     sourceType: 'pdf',
 *     fileName: string,
 *     pageNumber: number,
 *     text: string,
 *     charCount: number,
 *     isScannedOrEmpty: boolean
 *   }>
 * }>}
 */
export async function extractPdf(filePath, originalFileName) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const dataBuffer = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({
    data: dataBuffer,
    useSystemFonts: true,
    disableFontFace: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pages = [];
  const emptyPages = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items into logical lines based on vertical position (transform[5])
    let lastY = null;
    let lineChunks = [];
    let lines = [];

    for (const item of textContent.items) {
      if (!item.str) continue;
      const currentY = item.transform ? Math.round(item.transform[5]) : null;

      if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
        if (lineChunks.length > 0) {
          lines.push(lineChunks.join(' ').trim());
          lineChunks = [];
        }
      }
      lineChunks.push(item.str);
      lastY = currentY;
    }

    if (lineChunks.length > 0) {
      lines.push(lineChunks.join(' ').trim());
    }

    // Conservative whitespace normalization
    const normalizedText = lines
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(l => l.length > 0)
      .join('\n');

    const charCount = normalizedText.length;
    // Flag as scanned/empty if extractable text is fewer than 25 characters
    const isScannedOrEmpty = charCount < 25;

    if (isScannedOrEmpty) {
      emptyPages.push(pageNum);
    }

    pages.push({
      sourceType: 'pdf',
      fileName: originalFileName,
      pageNumber: pageNum,
      text: normalizedText,
      charCount,
      isScannedOrEmpty
    });
  }

  return {
    sourceType: 'pdf',
    fileName: originalFileName,
    pageCount: numPages,
    extractedPageCount: pages.filter(p => !p.isScannedOrEmpty).length,
    emptyPages,
    pages
  };
}

