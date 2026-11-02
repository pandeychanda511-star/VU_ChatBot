/**
 * Deterministic intent and scope classifier for Vidyashilp University Academic Advisor.
 * Distinguishes greetings, small-talk redirection, out-of-scope queries, and academic questions.
 */

const GREETING_PATTERNS = [
  /^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening|day))\b/i,
  /^namaste\b/i
];

const SMALL_TALK_PATTERNS = [
  /^(how\s*are\s*you|how\s*do\s*you\s*do|who\s*are\s*you|what\s*is\s*your\s*name|what\s*can\s*you\s*do)\b/i,
  /^(tell\s*me\s*about\s*yourself|are\s*you\s*an\s*ai|are\s*you\s*a\s*robot)\b/i
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(recipe|bake|cake|cook|pizza|burger|pasta|cocktail|weather|movie|song|lyrics|cricket\s*score|fifa|football\s*match|stock\s*market|crypto|bitcoin|capital\s*of)\b/i,
  /\b(joke|riddle|poem|story|horoscope|zodiac)\b/i,
  /\b(alien|mars|space\s*exploration|quantum\s*banana)\b/i
];

export const INTENT_TYPES = {
  GREETING: 'greeting',
  SMALL_TALK: 'small_talk',
  OUT_OF_SCOPE: 'out_of_scope',
  ACADEMIC_QUERY: 'academic_query'
};

export const STANDARD_RESPONSES = {
  GREETING: "Hi! I'm the Academic Advisor chatbot of Vidyashilp University. How may I help you with your university-related questions?",
  SMALL_TALK: "I'm an Academic Advisor chatbot for Vidyashilp University. I can help with university-related academic information. Please ask me a university-related question.",
  OUT_OF_SCOPE: "I am the Academic Advisor chatbot for Vidyashilp University and can only assist with university-related academic policies, course structures, and official university guidelines from our authorized documents.",
  MISSING_DATA: "Data is not available in the provided university documents."
};

/**
 * Classifies the intent of a student message.
 *
 * @param {string} message - User query
 * @returns {{ intent: string, directResponse?: string, isGreetingOrRedirect: boolean }}
 */
export function classifyIntent(message) {
  if (!message || typeof message !== 'string') {
    return {
      intent: INTENT_TYPES.OUT_OF_SCOPE,
      directResponse: STANDARD_RESPONSES.OUT_OF_SCOPE,
      isGreetingOrRedirect: true
    };
  }

  const clean = message.trim();
  const lower = clean.toLowerCase();

  // 1. Check for pure greetings (e.g. "hi", "hello", "good morning")
  for (const pat of GREETING_PATTERNS) {
    if (pat.test(lower)) {
      // Check if it's just a greeting or contains a substantial question
      const words = lower.split(/\s+/).filter(w => w.length > 0);
      if (words.length <= 4) {
        return {
          intent: INTENT_TYPES.GREETING,
          directResponse: STANDARD_RESPONSES.GREETING,
          isGreetingOrRedirect: true
        };
      }
    }
  }

  // 2. Check for small-talk / bot identity
  for (const pat of SMALL_TALK_PATTERNS) {
    if (pat.test(lower)) {
      return {
        intent: INTENT_TYPES.SMALL_TALK,
        directResponse: STANDARD_RESPONSES.SMALL_TALK,
        isGreetingOrRedirect: true
      };
    }
  }

  // 3. Check for explicitly out-of-scope non-university topics
  for (const pat of OUT_OF_SCOPE_PATTERNS) {
    if (pat.test(lower)) {
      return {
        intent: INTENT_TYPES.OUT_OF_SCOPE,
        directResponse: STANDARD_RESPONSES.OUT_OF_SCOPE,
        isGreetingOrRedirect: true
      };
    }
  }

  // 4. Default to academic query to be evaluated by knowledge retrieval
  return {
    intent: INTENT_TYPES.ACADEMIC_QUERY,
    directResponse: null,
    isGreetingOrRedirect: false
  };
}

