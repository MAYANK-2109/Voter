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
    
    if (!process.env.GNEWS_API_KEY) {
      return res.json({
        state: stateName,
        isFallback: true,
        articles: [],
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
    // Return a 200 with empty data instead of a 400/500
    res.json({
      state: 'Unknown',
      isFallback: true,
      articles: [],
      error: 'News service temporarily unavailable',
      details: error.message
    });
  }
});

module.exports = router;
