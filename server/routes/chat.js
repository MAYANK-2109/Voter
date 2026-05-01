const { Router } = require('express');
const router = Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger'); // added for logging

const SYSTEM_INSTRUCTION = `You are VoterPath AI, a neutral, non-partisan Indian election guide assistant. Your role is to help Indian citizens navigate the voting process with accurate, up-to-date information.

IMPORTANT RULES:
- NEVER express political opinions or party preferences.
- NEVER recommend candidates.
- Cite ECI (eci.gov.in) as the authority.
- Be concise and factual.`;

// Lazy singleton — constructed on first chat request so dotenv is guaranteed
// to have run first, regardless of require() order in index.js.
let _genAI = null;
const getGenAI = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Chat limit reached. Please try again in an hour.' },
});

// Accept 'user' | 'model' | 'assistant' from the client.
// 'assistant' is normalised → 'model' before being sent to Gemini.
const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model', 'assistant']),
      text: z.string(),
    })
  ).optional(),
});

/**
 * Sends a message to the Gemini model, replaying the provided conversation history.
 * Uses the module-level genAI singleton.
 *
 * @param {string} modelId - Gemini model identifier
 * @param {string} message - The user's latest message
 * @param {Array}  history - Prior turns in the conversation
 * @param {string} systemInstruction - System-level prompt injected into the model
 * @returns {Promise<{text: string, usage: object}>} The model's text reply and usage stats
 */
async function getAIResponse(modelId, message, history, systemInstruction) {
  const model = getGenAI().getGenerativeModel({ model: modelId, systemInstruction });

  // Normalise roles: 'assistant' → 'model'.
  // Drop leading model turns — Gemini requires history to start with 'user'.
  const chatHistory = (history || [])
    .map(turn => ({ role: turn.role === 'assistant' ? 'model' : turn.role, text: turn.text }))
    .filter((turn, idx) => !(idx === 0 && turn.role === 'model'))
    .map(turn => ({ role: turn.role, parts: [{ text: turn.text }] }));

  const chat = model.startChat({ history: chatHistory });
  const result = await chat.sendMessage(message);
  return { 
    text: result.response.text(),
    usage: result.response.usageMetadata 
  };
}

// Fallback sequence: cheapest → more capable
const MODEL_FALLBACK_SEQUENCE = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];

// Helper for exponential backoff
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

router.post('/', chatLimiter, async (req, res) => {
  const validation = ChatSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'INVALID_REQUEST_DATA',
      details: validation.error.format(),
    });
  }

  const { message, history = [] } = validation.data;
  let lastError = null;

  for (const modelId of MODEL_FALLBACK_SEQUENCE) {
    let attempts = 0;
    const maxRetries = 2; // For 429 backoff

    while (attempts <= maxRetries) {
      try {
        const { text, usage } = await getAIResponse(modelId, message, history, SYSTEM_INSTRUCTION);
        
        // Google Services: Log token usage for cost monitoring
        logger.info('Gemini chat usage', { model: modelId, tokens: usage });

        return res.json({
          reply: text,
          model: modelId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        lastError = error;
        
        // Google Services: Exponential backoff on 429 Quota Exhausted
        if (error.status === 429 && attempts < maxRetries) {
          attempts++;
          const backoffMs = (2 ** attempts) * 500;
          logger.warn(`Gemini 429. Retrying ${modelId} in ${backoffMs}ms (Attempt ${attempts})`);
          await delay(backoffMs);
          continue; // Retry the same model
        }
        
        // If not 429 or max retries reached, break the while loop and try next model in fallback sequence
        logger.warn(`Gemini model ${modelId} failed`, { error: error.message });
        break; 
      }
    }
  }

  logger.error('All Gemini models failed', { lastError: lastError?.message });
  return res.status(503).json({
    error: 'All Gemini models are currently unavailable. Please try again shortly.',
  });
});

module.exports = router;
