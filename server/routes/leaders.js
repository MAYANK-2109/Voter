const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const leadersData = require('../data/leaders.json');

// Lazy singleton — same pattern as chat.js to survive any require() order
let _genAI = null;
const getGenAI = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};

// Fix #12: 1-hour TTL cache keyed by stateKey+cityKey — eliminates redundant
// geocode and Wikipedia roundtrips on every request
const leaderCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Fallback model sequence — cheapest first
const AI_MODEL_SEQUENCE = ['gemini-1.5-flash', 'gemini-1.5-pro'];

/**
 * Generates a factual, non-partisan biography using the Gemini API.
 * Uses the module-level singleton (Fix #8).
 *
 * @param {string} modelId
 * @param {string} prompt - Pre-sanitized prompt string
 * @returns {Promise<string>}
 */
async function generateLeaderBio(modelId, prompt) {
  const model = getGenAI().getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Fetches the Wikipedia thumbnail for a given leader name.
 * Silently returns null on any failure — image is non-critical.
 *
 * @param {string} name
 * @returns {Promise<string|null>}
 */
async function fetchWikipediaThumbnail(name) {
  try {
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000 }
    );
    return response.data.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/**
 * Strips characters not safe for use inside an LLM prompt.
 * Prevents prompt-injection via crafted query parameters (Fix #6).
 */
const sanitizeForPrompt = (value, maxLength) =>
  String(value || '')
    .replace(/[^\w\s.'\-,]/g, '')
    .slice(0, maxLength);

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state, city } = req.query;

    let stateName = state ? String(state).slice(0, 100) : null;
    let cityName  = city  ? String(city).slice(0, 100)  : null;

    // Fix #5: Validate coordinates before any outbound HTTP call
    if (!stateName && lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);

      if (
        isNaN(parsedLat) || isNaN(parsedLng) ||
        parsedLat < -90  || parsedLat > 90   ||
        parsedLng < -180 || parsedLng > 180
      ) {
        return res.status(400).json({ error: 'INVALID_COORDINATES' });
      }

      // Fix #5: Enforce a request timeout on the geocode call
      const locRes = await axios.get(
        'https://api.bigdatacloud.net/data/reverse-geocode-client',
        {
          params: { latitude: parsedLat, longitude: parsedLng, localityLanguage: 'en' },
          timeout: 3000,
        }
      );
      stateName = locRes.data.principalSubdivision;
      cityName  = cityName || locRes.data.city || locRes.data.locality || null;
    }

    if (!stateName) {
      return res.status(400).json({
        error: 'MISSING_LOCATION',
        message: 'Could not determine state. Provide lat/lng or state.',
      });
    }

    const stateKey = Object.keys(leadersData.states).find(
      k => k.toLowerCase() === stateName.toLowerCase()
    );

    if (!stateKey) {
      return res.status(404).json({ error: `No data found for state: ${stateName}` });
    }

    // Fix #12: Return cached leader list if available
    const cacheKey = `leaders_${stateKey}_${cityName || 'none'}`;
    const cached = leaderCache.get(cacheKey);
    if (cached) return res.json(cached);

    const stateData = leadersData.states[stateKey];
    const leaderList = [];

    if (stateData.cm)       leaderList.push({ role: 'Chief Minister', ...stateData.cm });
    if (stateData.governor) leaderList.push({ role: 'Governor',       ...stateData.governor });

    if (cityName && stateData.cities) {
      const cityKey = Object.keys(stateData.cities).find(
        k => k.toLowerCase() === cityName.toLowerCase()
      );
      if (cityKey) {
        const cityData = stateData.cities[cityKey];
        cityName = cityKey; // normalise to canonical casing
        if (cityData.mayor)     leaderList.push({ role: 'Mayor',                city: cityKey, ...cityData.mayor });
        if (cityData.mp)        leaderList.push({ role: 'Member of Parliament', city: cityKey, ...cityData.mp });
        if (cityData.collector) leaderList.push({ role: 'District Collector',   city: cityKey, ...cityData.collector });
      }
    }

    // Fix #11: Fetch all Wikipedia thumbnails in parallel instead of sequentially,
    // cutting response time from O(n × latency) to O(max latency).
    const thumbnailResults = await Promise.allSettled(
      leaderList.map(leader => fetchWikipediaThumbnail(leader.name))
    );
    const leaders = leaderList.map((leader, i) => ({
      ...leader,
      image: thumbnailResults[i].status === 'fulfilled' ? thumbnailResults[i].value : null,
    }));

    const result = { state: stateKey, city: cityName || null, leaders };

    leaderCache.set(cacheKey, result); // Fix #12
    // Efficiency: Cache-Control for 1 hour as leader data is static
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=300');
    return res.json(result);
  } catch (error) {
    // Fix #9/#21: Structured log; no hardcoded politician fallback
    logger.error('Leaders GET error', { error: error.message });
    return res.status(503).json({
      error: 'SERVICE_UNAVAILABLE',
      message: 'Leader data temporarily unavailable. Please try again shortly.',
    });
  }
});

router.get('/info', async (req, res) => {
  const { name, role, state, city } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  // Fix #6: Sanitize all query params before building the AI prompt
  const safeName  = sanitizeForPrompt(name,  100);
  const safeRole  = sanitizeForPrompt(role,   50);
  const safeState = sanitizeForPrompt(state,  50);
  const safeCity  = sanitizeForPrompt(city,   50);

  if (!safeName) return res.status(400).json({ error: 'INVALID_NAME' });

  const prompt = [
    `Provide a concise, factual, non-partisan biography of about 70 words for ${safeName},`,
    `who is the ${safeRole} of ${safeCity ? safeCity + ', ' : ''}${safeState}, India.`,
    'Focus on their political career, key roles, and major contributions.',
    'Maintain a neutral tone. Do not add any content beyond this biography.',
  ].join(' ');

  let bioText  = '';
  let modelUsed = '';
  let lastError = null;

  for (const modelId of AI_MODEL_SEQUENCE) {
    try {
      logger.info('Fetching leader bio', { modelId, name: safeName });
      bioText   = await generateLeaderBio(modelId, prompt);
      modelUsed = modelId;
      break;
    } catch (error) {
      logger.warn('Leader bio model failed', { modelId, error: error.message });
      lastError = error;
    }
  }

  if (!bioText) {
    return res.status(503).json({
      error: 'Failed to fetch leader information.',
      message: 'All AI models are currently unavailable.',
    });
  }

  // Thumbnail fetch is non-critical — run independently of bio
  const imageUrl = await fetchWikipediaThumbnail(safeName);

  return res.json({ info: bioText, image: imageUrl, model: modelUsed });
});

module.exports = router;
