const express = require('express');
const router = express.Router();
const axios = require('axios');
const { z } = require('zod');
const NodeCache = require('node-cache');

// --- Configuration & Constants ---
const CACHE_TTL = 900; // 15 Minutes
const API_TIMEOUT = 4000;
const weatherCache = new NodeCache({ stdTTL: CACHE_TTL });

// --- Safety Thresholds (Decision Matrix) ---
// This table maps feels-like temperatures to safety status and alerts.
const SAFETY_RULES = [
  {
    minTemp: 45,
    status: 'Extreme',
    isHeatwave: true,
    alerts: [
      '🔴 EXTREME HEAT WARNING: Vote only during early morning.',
      '💧 Carry 1L+ water. Seek shade if feeling dizzy.'
    ],
    windows: [{ time: '6:00 AM - 8:00 AM', safety: 'caution', label: 'Early Morning' }]
  },
  {
    minTemp: 40,
    status: 'Severe',
    isHeatwave: true,
    alerts: [
      '🟠 SEVERE HEAT ALERT: Heatwave detected.',
      '💧 Stay hydrated. Use ORS. Wear cotton.'
    ],
    windows: [
      { time: '6:00 AM - 9:00 AM', safety: 'safe', label: 'Morning Window' },
      { time: '4:30 PM - 6:00 PM', safety: 'caution', label: 'Evening Window' }
    ]
  },
  {
    minTemp: 35,
    status: 'Caution',
    isHeatwave: false,
    alerts: [
      '🟡 HEAT CAUTION: Temperatures are elevated.',
      '💧 Drink water before and after voting.'
    ],
    windows: [
      { time: '6:00 AM - 10:00 AM', safety: 'safe', label: 'Morning Window' },
      { time: '4:00 PM - 6:00 PM', safety: 'safe', label: 'Evening Window' }
    ]
  },
  {
    minTemp: -Infinity, // Default baseline
    status: 'Optimal',
    isHeatwave: false,
    alerts: [],
    windows: [
      { time: '7:00 AM - 11:00 AM', safety: 'safe', label: 'Morning' },
      { time: '11:00 AM - 3:00 PM', safety: 'safe', label: 'Afternoon' },
      { time: '3:00 PM - 6:00 PM', safety: 'safe', label: 'Evening' }
    ]
  }
];

const HUMIDITY_ALERT = '💦 High humidity: Heat stress risk is higher than it feels.';

// --- Validation Schemas ---
const CoordsSchema = z.object({
  lat: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-180).max(180))
});

/**
 * WeatherService
 * Handles all logic for fetching and processing weather-based voting safety.
 */
class WeatherService {
  /**
   * Process the raw weather data into voter-friendly insights.
   */
  static getSafetyInsights(feelsLike, humidity) {
    // Find the first rule that matches the current temperature
    const rule = SAFETY_RULES.find(r => feelsLike >= r.minTemp);
    
    const alerts = [...rule.alerts];
    if (humidity > 80) alerts.push(HUMIDITY_ALERT);

    return {
      status: rule.status,
      isHeatwave: rule.isHeatwave,
      alerts,
      windows: rule.windows
    };
  }

  /**
   * Fetch weather from API or Cache.
   */
  static async fetchWeather(lat, lng) {
    const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    
    // 1. Check Cache
    const cached = weatherCache.get(cacheKey);
    if (cached) return { ...cached, isFromCache: true };

    // 2. Fetch Fresh Data
    if (!process.env.OPENWEATHER_API_KEY) {
      throw new Error('WEATHER_API_KEY_MISSING');
    }

    try {
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { lat, lon: lng, units: 'metric', appid: process.env.OPENWEATHER_API_KEY },
        timeout: API_TIMEOUT
      });

      const insights = this.getSafetyInsights(data.main.feels_like, data.main.humidity);

      const result = {
        city: data.name,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        condition: data.weather[0]?.main || 'Clear',
        description: data.weather[0]?.description,
        windSpeed: data.wind?.speed,
        ...insights,
        updatedAt: new Date().toISOString()
      };

      // 3. Update Cache
      weatherCache.set(cacheKey, result);
      return { ...result, isFromCache: false };

    } catch (error) {
      console.error('[Weather] API Error:', error.message);
      throw error;
    }
  }
}

// --- API Routes ---

router.get('/', async (req, res, next) => {
  try {
    // Validate Input
    const query = CoordsSchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: 'Invalid coordinates provided.' });
    }

    const { lat, lng } = query.data;
    const weather = await WeatherService.fetchWeather(lat, lng);
    
    res.json(weather);

  } catch (error) {
    // Graceful error handling
    const status = error.response?.status || 500;
    const message = error.message === 'WEATHER_API_KEY_MISSING' 
      ? 'Weather service is currently unconfigured.' 
      : 'Failed to fetch local weather pulse.';
    
    res.status(status).json({ error: message });
  }
});

module.exports = router;
