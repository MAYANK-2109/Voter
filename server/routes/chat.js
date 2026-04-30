const express = require('express');
const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

const SYSTEM_INSTRUCTION = `You are VoterPath AI, a neutral, non-partisan Indian election guide assistant. Your role is to help Indian citizens navigate the voting process with accurate, up-to-date information.

IMPORTANT RULES:
- NEVER express political opinions or party preferences.
- NEVER recommend candidates.
- Cite ECI (eci.gov.in) as the authority.
- Be concise and factual.`;
const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 chat requests per hour
  message: { error: 'Chat limit reached. Please try again in an hour.' }
});

const ChatSchema = z.object({
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'assistant']),
    text: z.string()
  })).optional()
});

async function getAIResponse(apiKey, modelId, message, history, systemInstruction) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: modelId,
    systemInstruction: systemInstruction
  });

  let chatHistory = (history || []).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  if (chatHistory.length > 0 && chatHistory[0].role === 'model') {
    chatHistory.shift();
  }

  const chat = model.startChat({
    history: chatHistory
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
}

router.post('/', chatLimiter, async (req, res) => {
  const validation = ChatSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Invalid request data', 
      details: validation.error.format() 
    });
  }

  const { message, history = [] } = validation.data;

  // Custom model fallback sequence requested by user
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];
  let lastError = null;

  for (const modelId of models) {
    try {
      console.log(`Attempting chat with model: ${modelId}`);
      const text = await getAIResponse(process.env.GEMINI_API_KEY, modelId, message, history, SYSTEM_INSTRUCTION);
      return res.json({
        reply: text,
        model: modelId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Model ${modelId} failed:`, error.message);
      lastError = error;
    }
  }

  res.status(500).json({ 
    error: 'All requested Gemini models are currently unavailable.', 
    details: lastError?.message 
  });
});

module.exports = router;
