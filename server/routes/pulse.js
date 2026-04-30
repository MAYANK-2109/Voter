const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');
const { MOCK_ARTICLES } = require('../data/mockNews');
const logger = require('../utils/logger');

const newsCache = new NodeCache({ stdTTL: 600 });
const FALLBACK_PATH = path.join(__dirname, '../data/newsFallback.json');

/**
 * Standardizes articles from different APIs
 */
const standardize = (articles) => {
  return (articles || []).map(a => ({
    title: a.title || 'Election Update',
    description: a.description || a.snippet || 'Stay informed about the latest democratic pulse.',
    url: a.url || a.link || '#',
    image: a.image || a.image_url || a.urlToImage || 'https://via.placeholder.com/800x450?text=Election+Update',
    source: a.source?.name || a.source_id || 'News Wire',
    publishedAt: a.publishedAt || a.pubDate || new Date().toISOString()
  })).slice(0, 10);
};

/**
 * Persists the last successful articles to a file
 */
const persistFallback = async (articles) => {
  try {
    const top5 = articles.slice(0, 5);
    await fs.writeFile(FALLBACK_PATH, JSON.stringify(top5, null, 2));
  } catch (err) {
    logger.error('Failed to persist news fallback', { error: err.message });
  }
};

/**
 * Loads persisted fallback articles
 */
const loadFallback = async () => {
  try {
    const data = await fs.readFile(FALLBACK_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return MOCK_ARTICLES;
  }
};

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state } = req.query;
    let stateName = state;

    // 1. Resolve State (cached)
    if (!stateName && lat && lng) {
      const cacheKey = `geo_${lat}_${lng}`;
      stateName = newsCache.get(cacheKey);
      
      if (!stateName) {
        try {
          const locRes = await axios.get(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
            { timeout: 2000 }
          );
          stateName = locRes.data.principalSubdivision;
          newsCache.set(cacheKey, stateName, 3600 * 24);
        } catch (e) {
          stateName = 'India';
        }
      }
    }

    const query = stateName ? `election ${stateName} India` : 'election India';
    const cacheKey = `news_${query.replace(/\s+/g, '_')}`;
    const cached = newsCache.get(cacheKey);
    if (cached) return res.json(cached);

    let articles = [];
    let successProvider = null;

    // 2. Primary Provider: GNews
    if (process.env.GNEWS_API_KEY) {
      try {
        const response = await axios.get(
          `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`,
          { timeout: 4000 }
        );
        if (response.data.articles?.length > 0) {
          articles = standardize(response.data.articles);
          successProvider = 'GNews';
        }
      } catch (e) {
        logger.warn('GNews failed, trying NewsData', { error: e.message });
      }
    }

    // 3. Secondary Provider: NewsData.io
    if (articles.length === 0 && process.env.NEWSDATA_API_KEY) {
      try {
        const response = await axios.get(
          `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}&country=in&language=en`,
          { timeout: 4000 }
        );
        if (response.data.results?.length > 0) {
          articles = standardize(response.data.results);
          successProvider = 'NewsData';
        }
      } catch (e) {
        logger.warn('NewsData failed', { error: e.message });
      }
    }

    // 4. Persistence & Fallback Logic
    if (articles.length > 0) {
      await persistFallback(articles);
    } else {
      articles = await loadFallback();
      successProvider = 'Persistent Cache/Mock';
    }

    const result = {
      state: stateName || 'National',
      isFallback: successProvider === 'Persistent Cache/Mock',
      articles,
      provider: successProvider,
      totalArticles: articles.length,
      ts: new Date().toISOString()
    };

    newsCache.set(cacheKey, result);
    res.json(result);

  } catch (error) {
    logger.error('Critical News API error', { error: error.message });
    const fallback = await loadFallback();
    res.json({
      state: 'National',
      isFallback: true,
      articles: fallback,
      totalArticles: fallback.length,
      message: 'System is busy, showing recent election updates'
    });
  }
});

module.exports = router;
