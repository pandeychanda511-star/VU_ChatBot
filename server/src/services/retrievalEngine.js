import { getKnowledgeBase } from './knowledgePreparation.js';
import { DeferredEmbeddingProvider } from './embeddingProvider.js';

// Common stop words to exclude from TF-IDF indexing, while explicitly preserving
// critical negation, qualification, and comparison keywords (not, no, without, minimum, maximum, except)
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more',
  'most', 'my', 'myself', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
  'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves'
  // NOTE: 'not', 'no', 'without', 'minimum', 'maximum', 'except', 'pass', 'fail', 'attendance' are NOT in stop words
]);

// Common university domain synonyms / paraphrases to handle varied student phrasing
const SYNONYM_MAP = {
  'attendance': ['presence', 'attend', 'absent', 'absence', 'shortage'],
  'percentage': ['percent', '%'],
  'minimum': ['min', 'least', 'lowest', 'cutoff', 'cut-off', 'compulsory', 'mandatory'],
  'maximum': ['max', 'highest', 'limit', 'duration'],
  'exam': ['examination', 'exams', 'examinations', 'test', 'end-term', 'end term', 'sit'],
  'fee': ['fees', 'tuition', 'payment', 'remit', 'remittance', 'dues'],
  'course': ['subject', 'paper', 'curriculum', 'syllabus'],
  'scholarship': ['concession', 'freeship', 'aid', 'financial aid'],
  'drop': ['withdrawal', 'withdraw', 'discontinue'],
  'grade': ['grades', 'grading', 'marks', 'cgpa', 'sgpa', 'gpa', 'points']
};

/**
 * Tokenizes text conservatively: preserves alphanumerics, course codes (e.g., LAWM305, COMP201),
 * percentages, and critical qualifier words.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text) return [];
  // Normalize but keep course codes, hyphens in codes, numbers
  const cleaned = text.toLowerCase()
    .replace(/[^\w\s\-%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const rawTokens = cleaned.split(' ').filter(t => t.length > 0);
  const tokens = [];

  for (const token of rawTokens) {
    if (!STOP_WORDS.has(token)) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * BM25 + Exact Code / Phrase Lexical Scorer
 */
export class LexicalIndex {
  constructor(records) {
    this.records = records;
    this.N = records.length;
    this.docLengths = new Map();
    this.avgDocLength = 0;
    this.invertedIndex = new Map(); // term -> Map(recordId -> termFreq)

    this.k1 = 1.5; // BM25 term frequency saturation
    this.b = 0.75; // BM25 length normalization

    this.buildIndex();
  }

  buildIndex() {
    let totalLength = 0;

    for (const record of this.records) {
      const tokens = tokenize(record.text);
      this.docLengths.set(record.id, tokens.length);
      totalLength += tokens.length;

      const termCounts = new Map();
      for (const token of tokens) {
        termCounts.set(token, (termCounts.get(token) || 0) + 1);
      }

      for (const [term, freq] of termCounts.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term).set(record.id, freq);
      }
    }

    this.avgDocLength = this.N > 0 ? (totalLength / this.N) : 1;
  }

  /**
   * Scores all documents against a query string using BM25 + phrase bonuses.
   *
   * @param {string} query
   * @returns {Map<string, { bm25Score: number, matchSignals: string[] }>}
   */
  score(query) {
    const queryTokens = tokenize(query);
    const queryLower = query.toLowerCase();
    const scores = new Map();

    // Expand query tokens with known synonyms
    const expandedTerms = new Map(); // term -> weight
    for (const token of queryTokens) {
      expandedTerms.set(token, 1.0);
      for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
        if (token === key || syns.includes(token)) {
          expandedTerms.set(key, 0.8);
          for (const s of syns) {
            if (!expandedTerms.has(s)) expandedTerms.set(s, 0.6);
          }
        }
      }
    }

    for (const [term, weight] of expandedTerms.entries()) {
      if (!this.invertedIndex.has(term)) continue;

      const postingMap = this.invertedIndex.get(term);
      const docCountWithTerm = postingMap.size;
      // Standard BM25 IDF
      const idf = Math.log(1 + (this.N - docCountWithTerm + 0.5) / (docCountWithTerm + 0.5));

      for (const [recordId, tf] of postingMap.entries()) {
        const docLen = this.docLengths.get(recordId) || 1;
        const normTf = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (docLen / this.avgDocLength)));
        const termScore = idf * normTf * weight;

        if (!scores.has(recordId)) {
          scores.set(recordId, { bm25Score: 0, matchSignals: [] });
        }
        const entry = scores.get(recordId);
        entry.bm25Score += termScore;
        entry.matchSignals.push(`term:${term}(weight:${weight})`);
      }
    }

    // Exact course code boost or phrase matching
    // Detect course code pattern e.g. COMP201, LAWM305, MATH201
    const codeMatch = query.match(/\b[A-Za-z]{3,4}\s*\d{3}\b/gi);
    if (codeMatch) {
      for (const rawCode of codeMatch) {
        const normCode = rawCode.replace(/\s+/g, '').toLowerCase();
        for (const record of this.records) {
          const recTextLower = record.text.toLowerCase();
          if (recTextLower.includes(normCode)) {
            if (!scores.has(record.id)) {
              scores.set(record.id, { bm25Score: 0, matchSignals: [] });
            }
            const entry = scores.get(record.id);
            entry.bm25Score += 8.0; // Substantial boost for direct code match
            entry.matchSignals.push(`exact_code:${normCode}`);
          }
        }
      }
    }

    // Detect batch years (e.g. 2022, 2023, 2024, 2025, 2026) and semester terms (e.g. semester 1, sem 1, s1)
    const yearMatch = query.match(/\b(202[2-6])\b/);
    const semMatch = query.match(/\b(semester\s*([1-8]|i{1,3}|iv|v|vi{1,2}|viii)|sem\s*([1-8])|s([1-8]))\b/i);

    let parsedSemNum = null;
    if (semMatch) {
      const rawNum = (semMatch[2] || semMatch[3] || semMatch[4]).toLowerCase();
      const romanMap = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8 };
      parsedSemNum = romanMap[rawNum] || parseInt(rawNum, 10);
    }

    if (parsedSemNum !== null) {
      const targetYear = yearMatch ? yearMatch[1] : null;
      for (const record of this.records) {
        // High priority for aggregated semester overview records
        if (record.metadata?.isSemesterOverview && record.metadata?.semesterNumber === parsedSemNum) {
          if (!scores.has(record.id)) {
            scores.set(record.id, { bm25Score: 0, matchSignals: [] });
          }
          const entry = scores.get(record.id);
          
          if (targetYear && record.sheetName && record.sheetName.includes(targetYear)) {
            entry.bm25Score += 40.0;
            entry.matchSignals.push(`semester_overview_exact_batch:${targetYear}_sem${parsedSemNum}`);
          } else if (!targetYear) {
            entry.bm25Score += 25.0;
            entry.matchSignals.push(`semester_overview_sem${parsedSemNum}`);
          } else {
            // Different batch year
            entry.bm25Score += 5.0;
          }
        }

        // Minor track overview boost
        if (record.metadata?.isMinorTrackOverview && queryLower.includes('minor')) {
          if (!scores.has(record.id)) {
            scores.set(record.id, { bm25Score: 0, matchSignals: [] });
          }
          const entry = scores.get(record.id);
          entry.bm25Score += 25.0;
          entry.matchSignals.push(`minor_track_overview`);
        }
      }
    }

    if (yearMatch) {
      const year = yearMatch[1];
      for (const record of this.records) {
        // Boost sheets specifically named or dedicated to this batch year
        if (record.sheetName && record.sheetName.includes(year)) {
          if (!scores.has(record.id)) {
            scores.set(record.id, { bm25Score: 0, matchSignals: [] });
          }
          const entry = scores.get(record.id);
          entry.bm25Score += 6.0;
          entry.matchSignals.push(`batch_year:${year}`);

          // Extra boost if query asks for a specific semester and row has data for that semester
          if (semMatch) {
            const semNum = semMatch[2] || semMatch[3] || semMatch[4];
            let sTag = 's1';
            if (semNum) {
              const n = semNum.toLowerCase();
              if (n === '1' || n === 'i') sTag = 's1';
              else if (n === '2' || n === 'ii') sTag = 's2';
              else if (n === '3' || n === 'iii') sTag = 's3';
              else if (n === '4' || n === 'iv') sTag = 's4';
              else if (n === '5' || n === 'v') sTag = 's5';
              else if (n === '6' || n === 'vi') sTag = 's6';
              else if (n === '7' || n === 'vii') sTag = 's7';
              else if (n === '8' || n === 'viii') sTag = 's8';
            }
            if (record.text.toLowerCase().includes(`${sTag}:`) || record.text.toLowerCase().includes(`semester - ${sTag.slice(1)}`)) {
              entry.bm25Score += 6.0;
              entry.matchSignals.push(`semester_match:${sTag}`);
            }
          }
        }
      }
    }

    return scores;
  }
}

/**
 * Hybrid Retrieval Engine
 */
export class HybridRetrievalEngine {
  constructor(options = {}) {
    this.lexicalWeight = options.lexicalWeight ?? 1.0;
    this.semanticWeight = options.semanticWeight ?? 0.0; // Deferred in Phase 3
    this.relevanceThreshold = options.relevanceThreshold ?? 2.5; // BM25 baseline threshold for relevance
    this.embeddingProvider = options.embeddingProvider || new DeferredEmbeddingProvider();
    this.index = null;
    this.records = [];
    this.recordMap = new Map();
  }

  async initialize() {
    const kb = await getKnowledgeBase();
    this.records = kb.records;
    this.recordMap = new Map(this.records.map(r => [r.id, r]));
    this.index = new LexicalIndex(this.records);
    return {
      totalIndexed: this.records.length,
      embeddingProviderAvailable: this.embeddingProvider.isAvailable()
    };
  }

  /**
   * Searches the 4 authoritative university sources.
   *
   * @param {string} query - Student query text
   * @param {object} options - Search options (limit, threshold, filter)
   * @returns {Promise<{
   *   query: string,
   *   totalResults: number,
   *   thresholdUsed: number,
   *   results: Array<{
   *     id: string,
   *     score: number,
   *     lexicalScore: number,
   *     semanticScore: number | null,
   *     matchExplanation: string,
   *     sourceType: 'pdf' | 'excel',
   *     fileName: string,
   *     pageNumber?: number,
   *     sheetName?: string,
   *     rowNumber?: number,
   *     text: string
   *   }>
   * }>}
   */
  async search(query, options = {}) {
    if (!this.index) {
      await this.initialize();
    }

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return {
        query: '',
        totalResults: 0,
        thresholdUsed: options.threshold ?? this.relevanceThreshold,
        results: []
      };
    }

    const trimmedQuery = query.trim();
    const limit = Math.min(Math.max(options.limit || 5, 1), 20);
    const threshold = options.threshold ?? this.relevanceThreshold;

    // 1. Lexical Scoring
    const lexicalScores = this.index.score(trimmedQuery);

    // 2. Semantic Scoring (deferred interface check)
    let semanticScores = null;
    if (this.embeddingProvider && this.embeddingProvider.isAvailable()) {
      // Future hook for Phase 4
    }

    // 3. Combined Hybrid Scoring
    const candidateResults = [];

    // In addition to score threshold, check term coverage ratio (how many distinct query tokens matched)
    // This prevents single-word coincidental hits (e.g. "home" in "take home assignments") from passing
    const rawTokens = tokenize(trimmedQuery);
    const nonSynonymQueryTerms = new Set(rawTokens);

    for (const [recordId, lexicalData] of lexicalScores.entries()) {
      const record = this.recordMap.get(recordId);
      if (!record) continue;

      const bm25 = lexicalData.bm25Score;
      const combinedScore = bm25 * this.lexicalWeight;

      // Calculate how many query terms actually hit
      const matchedTerms = new Set();
      for (const sig of lexicalData.matchSignals) {
        if (sig.startsWith('term:')) {
          const t = sig.split('(')[0].replace('term:', '');
          matchedTerms.add(t);
        } else if (sig.startsWith('source_match:')) {
          const t = sig.replace('source_match:', '');
          matchedTerms.add(t);
        } else if (sig.startsWith('batch_year:')) {
          matchedTerms.add('year');
        } else if (sig.startsWith('semester_match:')) {
          matchedTerms.add('semester');
        } else if (sig.startsWith('exact_code:')) {
          matchedTerms.add('code');
        } else if (sig === 'exact_phrase_match') {
          matchedTerms.add('phrase');
        }
      }

      const isExactCodeOrPhrase = lexicalData.matchSignals.some(s => s.startsWith('exact_code:') || s === 'exact_phrase_match');
      const termCoverage = nonSynonymQueryTerms.size > 0 ? (matchedTerms.size / nonSynonymQueryTerms.size) : 0;

      // Filter: must meet baseline threshold AND have at least 25% query term coverage or exact code/phrase/source match
      const passesCoverage = isExactCodeOrPhrase || (nonSynonymQueryTerms.size <= 2 ? matchedTerms.size >= 1 : termCoverage >= 0.25);

      if (combinedScore >= threshold && passesCoverage) {
        candidateResults.push({
          id: record.id,
          score: Number(combinedScore.toFixed(3)),
          lexicalScore: Number(bm25.toFixed(3)),
          semanticScore: null,
          termCoverage: Number(termCoverage.toFixed(2)),
          matchExplanation: lexicalData.matchSignals.slice(0, 5).join('; '),
          sourceType: record.sourceType,
          fileName: record.fileName,
          pageNumber: record.pageNumber,
          sheetName: record.sheetName,
          rowNumber: record.rowNumber,
          metadata: record.metadata,
          text: record.text
        });
      }
    }

    // Sort descending by score
    candidateResults.sort((a, b) => b.score - a.score);

    const topResults = candidateResults.slice(0, limit);

    return {
      query: trimmedQuery,
      totalResults: topResults.length,
      thresholdUsed: threshold,
      results: topResults
    };
  }
}

// Singleton retrieval engine instance
let defaultEngine = null;

export async function getRetrievalEngine() {
  if (!defaultEngine) {
    defaultEngine = new HybridRetrievalEngine();
    await defaultEngine.initialize();
  }
  return defaultEngine;
}
