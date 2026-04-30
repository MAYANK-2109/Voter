const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    const response = await axios.get(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );

    const data = response.data;
    const adminLevels = data.localityInfo?.administrative || [];

    res.json({
      city: data.city || data.locality || 'Unknown',
      state: data.principalSubdivision || 'Unknown',
      district: adminLevels.find(a => a.order === 4)?.name || data.city || 'Unknown',
      country: data.countryName || 'India',
      locality: data.locality || '',
      pincode: data.postcode || ''
    });
  } catch (error) {
    console.error('Location API error:', error.message);
    // Fallback to a default location instead of failing
    res.json({
      city: 'Raipur',
      state: 'Chhattisgarh',
      district: 'Raipur',
      country: 'India',
      locality: '',
      pincode: ''
    });
  }
});

module.exports = router;
