const express = require('express');
const router = express.Router();
const axios = require('axios');
const { z } = require('zod');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const { circuitBreakerRegistry } = require('../src/resilience/CircuitBreaker');

const CACHE_KEY_PREFIX = 'w:';
const weatherCache = new NodeCache({ stdTTL: 900, checkperiod: 120 });

const weatherBreaker = circuitBreakerRegistry.get('openweather', {
  failureThreshold: 3,
  timeout: 5000,
});

// Self-documenting heat rules — sorted descending by minTempC
const HEAT_RULES = Object.freeze([
  {
    minTempC: 45,
    status: 'Extreme',
    isHeatwave: true,
    alerts: ['🔴 EXTREME HEAT: Early morning voting only.', '💧 Carry 1L+ water.'],
    safeWindows: [{ time: '6-8 AM', safety: 'caution', label: 'Early' }],
  },
  {
    minTempC: 40,
    status: 'Severe',
    isHeatwave: true,
    alerts: ['🟠 SEVERE HEAT: Use ORS.', '💧 Wear cotton.'],
    safeWindows: [
      { time: '6-9 AM', safety: 'safe', label: 'Morning' },
      { time: '4:30-6 PM', safety: 'caution', label: 'Evening' },
    ],
  },
  {
    minTempC: 35,
    status: 'Caution',
    isHeatwave: false,
    alerts: ['🟡 HEAT CAUTION: Stay hydrated.'],
    safeWindows: [
      { time: '6-10 AM', safety: 'safe', label: 'Morning' },
      { time: '4-6 PM', safety: 'safe', label: 'Evening' },
    ],
  },
  {
    minTempC: -Infinity,
    status: 'Optimal',
    isHeatwave: false,
    alerts: [],
    safeWindows: [
      { time: '7-11 AM', safety: 'safe', label: 'Morn' },
      { time: '11-3 PM', safety: 'safe', label: 'Aft' },
      { time: '3-6 PM', safety: 'safe', label: 'Eve' },
    ],
  },
]);

const CoordsSchema = z.object({
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number).pipe(z.number().min(-90).max(90)),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number).pipe(z.number().min(-180).max(180)),
}).strict();

const getRuleForFeelsLike = (feelsLikeC) =>
  HEAT_RULES.find(rule => feelsLikeC >= rule.minTempC);

/**
 * Transforms raw OpenWeather API data into a client-ready response object.
 * Unicode-safe city name sanitisation via \p{L}/\p{N} with the `u` flag.
 */
const buildWeatherResponse = (apiData, rule, humidity) => {
  const alerts = [...rule.alerts];
  if (humidity > 80) alerts.push('💦 High humidity risk.');
  return {
    city: apiData.name.replace(/[^\p{L}\p{N}\s]/giu, ''),
    temperature: Math.round(apiData.main.temp),
    feelsLike: Math.round(apiData.main.feels_like),
    humidity: apiData.main.humidity,
    windSpeed: apiData.wind?.speed || 0,
    condition: apiData.weather[0]?.main || 'Clear',
    description: apiData.weather[0]?.description || 'Clear skies',
    status: rule.status,
    isHeatwave: rule.isHeatwave,
    alerts,
    safeWindows: rule.safeWindows,
    ts: new Date().toISOString(),
  };
};

const fetchFromOpenWeather = async (lat, lng) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'placeholder') throw new Error('ERR_AUTH');

  return weatherBreaker.execute(async () => {
    const start = Date.now();
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon: lng, units: 'metric', appid: apiKey },
      timeout: 3000,
    });
    return { ...response, responseTime: Date.now() - start };
  });
};

const resolveWeather = async (lat, lng) => {
  // Round to 0.05° (~5 km) for better cache hit rate in dense urban areas
  const roundedLat = (Math.round(lat / 0.05) * 0.05).toFixed(2);
  const roundedLng = (Math.round(lng / 0.05) * 0.05).toFixed(2);
  const cacheKey = `${CACHE_KEY_PREFIX}${roundedLat}:${roundedLng}`;

  const cached = weatherCache.get(cacheKey);
  if (cached) return cached;

  const { data } = await fetchFromOpenWeather(lat, lng);
  const rule = getRuleForFeelsLike(data.main.feels_like);
  const result = buildWeatherResponse(data, rule, data.main.humidity);

  weatherCache.set(cacheKey, result);
  return result;
};

router.get('/', async (req, res) => {
  try {
    const parsed = CoordsSchema.safeParse(req.query);
    if (!parsed.success) {
      logger.warn('Weather: invalid query params', { query: req.query });
      return res.status(400).json({ error: 'INVALID_PARAMS' });
    }

    const weatherData = await resolveWeather(parsed.data.lat, parsed.data.lng);

    // Efficiency: Cache-Control lets browser and CDN cache responses for 5 min
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    return res.json(weatherData);
  } catch (err) {
    logger.error('Weather resolution failed', {
      error: err.message,
      breakerState: weatherBreaker.state,
    });

    if (weatherBreaker.isOpen()) {
      return res.status(503).json({
        error: 'SERVICE_RECOVERY',
        message: 'System is recovering from upstream failure. Please retry in 30s.',
      });
    }

    const statusCode = err.message === 'ERR_AUTH' ? 401 : (err.response?.status || 500);
    return res.status(statusCode).json({ error: 'SERVICE_UNAVAILABLE' });
  }
});

module.exports = router;
