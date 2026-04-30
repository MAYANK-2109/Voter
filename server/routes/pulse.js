const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { MOCK_ARTICLES } = require('../data/mockNews');

// Cache news for 10 minutes
const newsCache = new NodeCache({ stdTTL: 600 });

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state } = req.query;
    let stateName = state;

    if (!stateName && lat && lng) {
      const cacheKey = `geo_${lat}_${lng}`;
      let cachedLoc = newsCache.get(cacheKey);
      
      if (cachedLoc) {
        stateName = cachedLoc;
      } else {
        const locRes = await axios.get(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          { timeout: 3000 }
        );
        stateName = locRes.data.principalSubdivision;
        newsCache.set(cacheKey, stateName, 3600 * 24); // Cache geo for 24h
      }
    }

    const query = stateName ? `election ${stateName} India` : 'election India';
    const cacheKey = `news_${query.replace(/\s+/g, '_')}`;
    const cachedNews = newsCache.get(cacheKey);

    if (cachedNews) {
      return res.json(cachedNews);
    }

    if (!process.env.GNEWS_API_KEY) {
      return res.json({
        state: stateName || 'National',
        isFallback: true,
        articles: MOCK_ARTICLES.slice(0, 3).map(a => ({ ...a, publishedAt: new Date().toISOString() })),
        message: 'GNEWS_API_KEY is missing'
      });
    }

    console.log(`Fetching primary news for: ${query}`);
    let response = await axios.get(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`,
      { timeout: 5000 }
    );

    let articles = response.data.articles || [];

    // Fallback Query: If no state news, get general India election news
    if (articles.length === 0 && stateName) {
      console.log(`No news for ${stateName}, falling back...`);
      response = await axios.get(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent('Assembly Elections India')}&country=in&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`,
        { timeout: 5000 }
      );
      articles = response.data.articles || [];
    }

    const result = {
      state: stateName || 'National',
      isFallback: articles.length === 0 || (articles.length > 0 && !stateName),
      articles: articles.length > 0 ? articles : MOCK_ARTICLES.map(a => ({ ...a, publishedAt: new Date().toISOString() })),
      totalArticles: articles.length || MOCK_ARTICLES.length
    };

    if (articles.length > 0) {
      newsCache.set(cacheKey, result);
    }

    res.json(result);
  } catch (error) {
    console.error('Pulse API error:', error.message);
    res.json({
      state: 'National',
      isFallback: true,
      articles: MOCK_ARTICLES.map(a => ({ ...a, publishedAt: new Date().toISOString() })),
      totalArticles: MOCK_ARTICLES.length,
      message: 'Service busy, showing curated election updates'
    });
  }
});

module.exports = router;
