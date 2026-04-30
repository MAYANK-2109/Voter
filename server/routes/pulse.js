const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const { lat, lng, state } = req.query;

    let stateName = state;
    if (!stateName && lat && lng) {
      const locRes = await axios.get(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      stateName = locRes.data.principalSubdivision;
    }

    // Primary Query: State specific
    let query = stateName ? `election ${stateName} India` : 'election India';
    console.log(`Fetching primary news for: ${query}`);
    
    let response = await axios.get(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`,
      { timeout: 5000 }
    );

    let articles = response.data.articles || [];

    // Fallback Query: If no state news, get general India election news
    if (articles.length === 0 && stateName) {
      console.log(`No news for ${stateName}, falling back to general India election news...`);
      query = 'Indian Elections 2024';
      response = await axios.get(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&country=in&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY}`,
        { timeout: 5000 }
      );
      articles = response.data.articles || [];
    }

    res.json({
      state: stateName,
      isFallback: articles.length > 0 && response.config.url.includes('Elections'),
      articles: articles,
      totalArticles: articles.length
    });
  } catch (error) {
    console.error('Pulse API error:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: 'News API error', 
        details: error.response.data.errors || error.response.data.message || error.response.data
      });
    }
    res.status(500).json({ error: 'Failed to fetch election news' });
  }
});

module.exports = router;
