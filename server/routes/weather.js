const express = require('express');
const router = express.Router();
const axios = require('axios');

function computeSafeWindows(temp, feelsLike, humidity) {
  const windows = [];
  const alerts = [];

  if (feelsLike >= 45) {
    alerts.push('🔴 EXTREME HEAT WARNING: Avoid outdoor exposure. Vote only during early morning.');
    alerts.push('💧 Carry at least 1 litre of water. Seek shade immediately if feeling dizzy.');
    windows.push({ time: '6:00 AM - 8:00 AM', safety: 'caution', label: 'Early Morning (Best Option)' });
  } else if (feelsLike >= 40) {
    alerts.push('🟠 SEVERE HEAT ALERT: Heatwave conditions detected.');
    alerts.push('💧 Stay hydrated. Carry water and ORS. Wear light cotton clothes.');
    windows.push({ time: '6:00 AM - 9:00 AM', safety: 'safe', label: 'Morning Window' });
    windows.push({ time: '4:30 PM - 6:00 PM', safety: 'caution', label: 'Evening Window' });
  } else if (feelsLike >= 35) {
    alerts.push('🟡 HEAT CAUTION: Temperatures are elevated.');
    alerts.push('💧 Drink water before and after voting.');
    windows.push({ time: '6:00 AM - 10:00 AM', safety: 'safe', label: 'Morning Window' });
    windows.push({ time: '4:00 PM - 6:00 PM', safety: 'safe', label: 'Evening Window' });
  } else {
    windows.push({ time: '7:00 AM - 11:00 AM', safety: 'safe', label: 'Morning' });
    windows.push({ time: '11:00 AM - 3:00 PM', safety: 'safe', label: 'Afternoon' });
    windows.push({ time: '3:00 PM - 6:00 PM', safety: 'safe', label: 'Evening' });
  }

  if (humidity > 80) {
    alerts.push('💦 High humidity detected. Heat stress risk is elevated even at lower temperatures.');
  }

  return { windows, alerts, isHeatwave: feelsLike >= 40 };
}

router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

    if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'placeholder') {
      return res.status(401).json({ error: 'Weather API key missing', details: 'Please add a valid OPENWEATHER_API_KEY to your .env file' });
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${process.env.OPENWEATHER_API_KEY}`,
      { timeout: 5000 }
    );

    const data = response.data;
    const temp = data.main.temp;
    const feelsLike = data.main.feels_like;
    const humidity = data.main.humidity;
    const { windows, alerts, isHeatwave } = computeSafeWindows(temp, feelsLike, humidity);

    res.json({
      temperature: Math.round(temp),
      feelsLike: Math.round(feelsLike),
      humidity,
      condition: data.weather[0]?.main || 'Clear',
      description: data.weather[0]?.description || '',
      icon: data.weather[0]?.icon || '01d',
      windSpeed: data.wind?.speed || 0,
      city: data.name,
      isHeatwave,
      safeWindows: windows,
      alerts
    });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
  }
});

module.exports = router;
