import { EmbeddingProvider } from './embeddingProvider.js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, '../../data/processed/embeddings_cache.json');

export class GeminiEmbeddingProvider extends EmbeddingProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.model = 'text-embedding-004';
    this.client = null;
    this.cache = new Map();

    if (this.apiKey && this.apiKey.trim().length > 0 && this.apiKey !== 'your_gemini_api_key_here') {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
        this.loadCache();
      } catch (err) {
        console.error('[GeminiEmbeddingProvider] Initialization error:', err.message);
      }
    }
  }

  isAvailable() {
    return !!(this.client && this.apiKey && this.apiKey.trim().length > 0 && this.apiKey !== 'your_gemini_api_key_here');
  }

  loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          this.cache.set(k, v);
        }
      } catch {
        this.cache = new Map();
      }
    }
  }

  saveCache() {
    try {
      const obj = {};
      for (const [k, v] of this.cache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf-8');
    } catch (err) {
      console.error('[GeminiEmbeddingProvider] Failed to save cache:', err.message);
    }
  }

  async embedQuery(text) {
    if (!this.isAvailable()) return null;
    if (this.cache.has(text)) {
      return this.cache.get(text);
    }

    try {
      const response = await this.client.models.embedContent({
        model: this.model,
        contents: text
      });
      const vector = response.embedding?.values;
      if (vector) {
        this.cache.set(text, vector);
        this.saveCache();
      }
      return vector;
    } catch (err) {
      console.warn('[GeminiEmbeddingProvider] Failed to embed query:', err.message);
      return null;
    }
  }
}

