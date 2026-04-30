const express = require('express');
const router = express.Router();
const axios = require('axios');
const leadersData = require('../data/leaders.json');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function getAIInfo(apiKey, modelId, prompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelId });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function getLeaderImage(name) {
  try {
    const wikiRes = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { timeout: 3000 }
    );
    return wikiRes.data.thumbnail?.source || null;
  } catch (err) {
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state, city } = req.query;

    let stateName = state;
    let cityName = city;

    if (!stateName && lat && lng) {
      const locRes = await axios.get(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      stateName = locRes.data.principalSubdivision;
      cityName = cityName || locRes.data.city || locRes.data.locality;
    }

    if (!stateName) {
      return res.status(400).json({ error: 'Could not determine state. Provide lat/lng or state.' });
    }

    const stateKey = Object.keys(leadersData.states).find(
      k => k.toLowerCase() === stateName.toLowerCase()
    );

    if (!stateKey) {
      return res.status(404).json({ error: `No data found for state: ${stateName}` });
    }

    const stateData = leadersData.states[stateKey];
    const result = {
      state: stateKey,
      city: cityName || null,
      leaders: []
    };

    if (stateData.cm) result.leaders.push({ role: 'Chief Minister', ...stateData.cm });
    if (stateData.governor) result.leaders.push({ role: 'Governor', ...stateData.governor });

    if (cityName && stateData.cities) {
      const cityKey = Object.keys(stateData.cities).find(
        k => k.toLowerCase() === cityName.toLowerCase()
      );
      if (cityKey) {
        const cityData = stateData.cities[cityKey];
        result.city = cityKey;
        if (cityData.mayor) result.leaders.push({ role: 'Mayor', city: cityKey, ...cityData.mayor });
        if (cityData.mp) result.leaders.push({ role: 'Member of Parliament', city: cityKey, ...cityData.mp });
        if (cityData.collector) result.leaders.push({ role: 'District Collector', city: cityKey, ...cityData.collector });
      }
    }

    // Add thumbnails to the initial list if available
    for (let leader of result.leaders) {
       leader.image = await getLeaderImage(leader.name);
    }

    res.json(result);
  } catch (error) {
    console.error('Leaders API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch leaders data' });
  }
});

router.get('/info', async (req, res) => {
  const { name, role, state, city } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const prompt = `Provide a concise, factual, non-partisan biography of about 70 words for ${name}, who is the ${role} of ${city ? city + ', ' : ''}${state}, India. Focus on their political career, key roles, and major contributions. Maintain a neutral tone.`;

  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash"];
  let lastError = null;
  let infoText = '';
  let modelUsed = '';

  for (const modelId of models) {
    try {
      console.log(`Fetching leader info with model: ${modelId}`);
      infoText = await getAIInfo(process.env.GEMINI_API_KEY, modelId, prompt);
      modelUsed = modelId;
      break; 
    } catch (error) {
      console.error(`Leader info model ${modelId} failed:`, error.message);
      lastError = error;
    }
  }

  if (!infoText) {
    return res.status(500).json({ error: 'Failed to fetch leader information.', details: lastError?.message });
  }

  const imageUrl = await getLeaderImage(name);

  res.json({ 
    info: infoText, 
    image: imageUrl,
    model: modelUsed 
  });
});

module.exports = router;
