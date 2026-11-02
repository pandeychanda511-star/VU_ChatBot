/**
 * Interface definition for semantic embedding providers.
 *
 * NOTE FOR PHASE 3:
 * As mandated by the Master Project Brief and Phase 3 instructions:
 * - Hosted LLMs/APIs (such as Gemini) are explicitly NOT called during Phase 3.
 * - External network calls to embed documents or queries are not performed.
 * - This interface provides a clean, decoupled abstraction layer so that in Phase 4,
 *   when Gemini API integration is authorized, the Gemini embedding provider can be
 *   plugged in seamlessly without re-architecting the retrieval engine.
 */

export class EmbeddingProvider {
  /**
   * Generates a dense embedding vector for a given text.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedQuery(text) {
    throw new Error('EmbeddingProvider.embedQuery() is not implemented or deferred until authorized.');
  }

  /**
   * Generates dense embedding vectors for an array of texts.
   * @param {string[]} texts
   * @returns {Promise<number[][]>}
   */
  async embedDocuments(texts) {
    throw new Error('EmbeddingProvider.embedDocuments() is not implemented or deferred until authorized.');
  }

  /**
   * Indicates whether this provider is currently active and ready.
   * @returns {boolean}
   */
  isAvailable() {
    return false;
  }
}

/**
 * Null/Deferred embedding provider used during Phase 3.
 */
export class DeferredEmbeddingProvider extends EmbeddingProvider {
  constructor(reason = 'Semantic embeddings deferred until Phase 4 (Gemini API authorization boundary)') {
    super();
    this.reason = reason;
  }

  isAvailable() {
    return false;
  }

  async embedQuery(text) {
    return null;
  }

  async embedDocuments(texts) {
    return null;
  }
}

