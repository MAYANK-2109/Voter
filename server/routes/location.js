const express = require('express');
const router = express.Router();
const axios = require('axios');
const { z } = require('zod');

const CoordsSchema = z.object({
  lat: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-180).max(180))
});

router.get('/', async (req, res) => {
  try {
    const validation = CoordsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const { lat, lng } = validation.data;

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
