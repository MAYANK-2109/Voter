const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const crypto = require('crypto'); // added for hashing
const fs = require('fs').promises;
const path = require('path');
const { MOCK_ARTICLES } = require('../data/mockNews');
const logger = require('../utils/logger');

const newsCache = new NodeCache({ stdTTL: 600 });
const FALLBACK_PATH = path.join(__dirname, '../data/newsFallback.json');

const standardize = (articles) =>
  (articles || []).map(a => ({
    title: a.title || 'Election Update',
    description: a.description || a.snippet || 'Stay informed about the latest democratic pulse.',
    url: a.url || a.link || '#',
    image: a.image || a.image_url || a.urlToImage || '/assets/news-placeholder.png',
    source: a.source?.name || a.source_id || 'News Wire',
    publishedAt: a.publishedAt || a.pubDate || new Date().toISOString(),
  })).slice(0, 10);

// In-memory hash to prevent unnecessary disk writes
let lastFallbackHash = '';

const persistFallback = async (articles) => {
  try {
    const top5 = articles.slice(0, 5);
    const currentHash = crypto.createHash('md5').update(JSON.stringify(top5)).digest('hex');
    
    // Efficiency: Only write to disk if articles have actually changed
    if (currentHash !== lastFallbackHash) {
      await fs.writeFile(FALLBACK_PATH, JSON.stringify(top5, null, 2));
      lastFallbackHash = currentHash;
    }
  } catch (err) {
    logger.error('Failed to persist news fallback', { error: err.message });
  }
};

const loadFallback = async () => {
  try {
    const raw = await fs.readFile(FALLBACK_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return MOCK_ARTICLES;
  }
};

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state } = req.query;
    let stateName = state ? String(state).slice(0, 100) : null;

    if (!stateName && lat && lng) {
      const cacheKey = `geo_${lat}_${lng}`;
      stateName = newsCache.get(cacheKey);

      if (!stateName) {
        try {
          const locRes = await axios.get(
            'https://api.bigdatacloud.net/data/reverse-geocode-client',
            {
              params: { latitude: parseFloat(lat), longitude: parseFloat(lng), localityLanguage: 'en' },
              timeout: 2000,
            }
          );
          stateName = locRes.data.principalSubdivision;
          newsCache.set(cacheKey, stateName, 3600 * 24);
        } catch {
          stateName = 'India';
        }
      }
    }

    const query = stateName ? `election ${stateName} India` : 'election India';
    const cacheKey = `news_${query.replace(/\s+/g, '_')}`;
    const cached = newsCache.get(cacheKey);
    if (cached) {
      // Efficiency: Add Cache-Control header
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
      return res.json(cached);
    }

    let articles = [];
    let successProvider = null;

    if (process.env.GNEWS_API_KEY) {
      try {
        const response = await axios.get('https://gnews.io/api/v4/search', {
          params: { q: query, country: 'in', lang: 'en', max: 10, apikey: process.env.GNEWS_API_KEY },
          timeout: 4000,
        });
        if (response.data.articles?.length > 0) {
          articles = standardize(response.data.articles);
          successProvider = 'GNews';
        }
      } catch (err) {
        logger.warn('GNews failed, trying NewsData', { error: err.message });
      }
    }

    if (articles.length === 0 && process.env.NEWSDATA_API_KEY) {
      try {
        const response = await axios.get('https://newsdata.io/api/1/news', {
          params: { apikey: process.env.NEWSDATA_API_KEY, q: query, country: 'in', language: 'en' },
          timeout: 4000,
        });
        if (response.data.results?.length > 0) {
          articles = standardize(response.data.results);
          successProvider = 'NewsData';
        }
      } catch (err) {
        logger.warn('NewsData failed', { error: err.message });
      }
    }

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
      ts: new Date().toISOString(),
    };

    newsCache.set(cacheKey, result);
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.json(result);
  } catch (error) {
    logger.error('Critical News API error', { error: error.message });
    const fallback = await loadFallback();
    return res.json({
      state: 'National',
      isFallback: true,
      articles: fallback,
      totalArticles: fallback.length,
      message: 'System is busy, showing recent election updates',
    });
  }
});

module.exports = router;
