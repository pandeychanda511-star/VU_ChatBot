import { GoogleGenAI } from '@google/genai';
import { STANDARD_RESPONSES } from './intentClassifier.js';

// Primary fast model (gemini-3.5-flash) with robust fallback candidates
const PRIMARY_MODEL = 'gemini-3.5-flash';
const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

/**
 * System prompt strictly constraining Gemini to supplied evidence.
 */
const SYSTEM_INSTRUCTION = `You are the official Academic Advisor for Vidyashilp University.
Your sole authority is the retrieved evidence provided with the user query.

CRITICAL GROUNDING RULES:
1. ONLY answer using facts explicitly supported by the supplied retrieved evidence.
2. DO NOT use pretrained knowledge or assumptions to extrapolate university policies, dates, fees, rules, course codes, or attendance requirements.
3. If the retrieved evidence does not contain the answer, reply EXACTLY:
   "${STANDARD_RESPONSES.MISSING_DATA}"
4. If a question has multiple parts and only some are supported by the evidence:
   - Answer the supported parts clearly using the evidence.
   - For any unsupported subquestion, state explicitly: "${STANDARD_RESPONSES.MISSING_DATA}" (or state clearly which specific part is not available in the university documents).
5. Preserve numbers, percentages, grades (e.g. 75%, 65%, 4.00 CGPA, FA grade, S/U grade) and course codes exactly as stated in the text.
6. Present your answer cleanly with structured formatting:
   - Direct answer
   - Key requirements or conditions (bullet points)
   - Procedures (numbered steps if applicable)
7. For curriculum, semester spread, and minor track course queries:
   - Provide the complete, exhaustive list of all courses present in the evidence for that semester or track.
   - Do NOT omit or summarize away any courses. List every course with its course code, title, credits, category, and prerequisites as provided in the evidence.
8. Format your response in JSON with this structure:
   {
     "answer": "string containing formatted response",
     "usedEvidenceIds": ["id1", "id2"],
     "missingInformationNote": null or "explanation if part is missing"
   }
   Ensure you return valid JSON. Do not wrap in markdown code blocks if possible.`;

export class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.client = null;
    this.modelName = PRIMARY_MODEL;

    if (this.apiKey && this.apiKey.trim().length > 0 && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.error('[Gemini Service] Initialization error:', err.message);
      }
    }
  }

  isConfigured() {
    return !!(this.client && this.apiKey && this.apiKey.trim().length > 0 && this.apiKey !== 'your_gemini_api_key_here');
  }

  /**
   * Generates a grounded answer from retrieved evidence records.
   *
   * @param {string} userQuery - The user question
   * @param {Array<object>} retrievedEvidence - Retrieved chunks from retrievalEngine
   * @returns {Promise<{
   *   answer: string,
   *   usedEvidenceIds: string[],
   *   missingInformationNote: string | null,
   *   isGrounded: boolean
   * }>}
   */
  async generateGroundedAnswer(userQuery, retrievedEvidence) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_NOT_CONFIGURED');
    }

    if (!retrievedEvidence || retrievedEvidence.length === 0) {
      return {
        answer: STANDARD_RESPONSES.MISSING_DATA,
        usedEvidenceIds: [],
        missingInformationNote: 'No relevant evidence found in university sources.',
        isGrounded: false
      };
    }

    // Prepare bounded evidence payload
    const evidencePayload = retrievedEvidence.map(item => ({
      evidenceId: item.id,
      source: item.fileName,
      location: item.sourceType === 'pdf' ? `Page ${item.pageNumber}` : `Sheet ${item.sheetName}, Row ${item.rowNumber}`,
      content: item.text
    }));

    const promptText = `USER QUESTION:
${userQuery}

RETRIEVED UNIVERSITY EVIDENCE (Authoritative Source Data):
${JSON.stringify(evidencePayload, null, 2)}

Provide your response in the required JSON format.`;

    let lastError = null;
    const maxRetries = 2; // Maximum 2 attempts total to ensure sub-5s response
    let attempts = 0;

    for (const modelToTry of CANDIDATE_MODELS) {
      if (attempts >= maxRetries) break;
      attempts++;

      try {
        // Enforce 10-second timeout per attempt to prevent hanging requests
        const callPromise = this.client.models.generateContent({
          model: modelToTry,
          contents: promptText,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.1, // Low temperature for high factual accuracy
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingBudget: 0
            }
          }
        });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('GEMINI_API_TIMEOUT')), 10000);
        });

        const response = await Promise.race([callPromise, timeoutPromise]);

        const responseText = response.text;
        let parsed = null;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          // Fallback cleaning if wrapped in markdown blocks
          const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        }

        // Validate returned evidence IDs against actual retrieved IDs
        const validIds = new Set(retrievedEvidence.map(e => e.id));
        const filteredEvidenceIds = (Array.isArray(parsed.usedEvidenceIds) ? parsed.usedEvidenceIds : [])
          .filter(id => validIds.has(id));

        // If the answer states data is not available, return standard refusal with NO citations
        if (parsed.answer && parsed.answer.includes(STANDARD_RESPONSES.MISSING_DATA) && filteredEvidenceIds.length === 0) {
          return {
            answer: STANDARD_RESPONSES.MISSING_DATA,
            usedEvidenceIds: [],
            missingInformationNote: parsed.missingInformationNote || null,
            isGrounded: false
          };
        }

        return {
          answer: parsed.answer || STANDARD_RESPONSES.MISSING_DATA,
          usedEvidenceIds: filteredEvidenceIds.length > 0 ? filteredEvidenceIds : [],
          missingInformationNote: parsed.missingInformationNote || null,
          isGrounded: filteredEvidenceIds.length > 0
        };
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini Service] Model ${modelToTry} attempt failed (${err.message.slice(0, 80)}). Retrying next candidate if available...`);
      }
    }
    throw lastError;
  }
}

let geminiServiceInstance = null;

export function getGeminiService() {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiService();
  }
  return geminiServiceInstance;
}

