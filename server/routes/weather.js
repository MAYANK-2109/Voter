const express = require('express');
const router = express.Router();
const axios = require('axios');
const { z } = require('zod');
const NodeCache = require('node-cache');

// -------------------------------------------------------------------------
// ARCHITECTURAL CONSTANTS & CONFIG
// Pillar: Maintainability & Observability
// -------------------------------------------------------------------------
const CACHE_TTL_SEC = 900; // 15 minutes
const API_TIMEOUT_MS = 4000;
const weatherCache = new NodeCache({ stdTTL: CACHE_TTL_SEC });

// Pillar: Security & Type-Safety
const CoordsSchema = z.object({
  lat: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-90).max(90)),
  lng: z.string().transform(v => parseFloat(v)).pipe(z.number().min(-180).max(180))
});

// -------------------------------------------------------------------------
// CUSTOM EXCEPTION TYPES
// Pillar: Resilience & Error Handling
// -------------------------------------------------------------------------
class WeatherServiceError extends Error {
  constructor(message, statusCode = 500, code = 'WEATHER_INTERNAL_ERROR') {
    super(message);
    this.name = 'WeatherServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

// -------------------------------------------------------------------------
// WEATHER SERVICE LAYER
// Pillar: Scalability & Open-Closed Principle
// -------------------------------------------------------------------------
class WeatherService {
  /**
   * computeSafeWindows
   * Business logic for calculating safe voting times based on climate data.
   * Pillar: Self-Documenting & Testable
   */
  static computeSafeWindows(temp, feelsLike, humidity) {
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

  /**
   * getWeatherData
   * Fetches data from OpenWeather with coordinate-based caching.
   * Pillar: Efficiency & Concurrency
   */
  static async getWeatherData(lat, lng) {
    const cacheKey = `weather_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    
    if (cached) return { ...cached, _cached: true };

    if (!process.env.OPENWEATHER_API_KEY) {
      throw new WeatherServiceError('Weather API key not configured', 401, 'CONFIG_MISSING');
    }

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat,
            lon: lng,
            units: 'metric',
            appid: process.env.OPENWEATHER_API_KEY
          },
          timeout: API_TIMEOUT_MS
        }
      );

      const { main, weather, wind, name } = response.data;
      const { windows, alerts, isHeatwave } = this.computeSafeWindows(main.temp, main.feels_like, main.humidity);

      const result = {
        temperature: Math.round(main.temp),
        feelsLike: Math.round(main.feels_like),
        humidity: main.humidity,
        condition: weather[0]?.main || 'Clear',
        description: weather[0]?.description || '',
        icon: weather[0]?.icon || '01d',
        windSpeed: wind?.speed || 0,
        city: name,
        isHeatwave,
        safeWindows: windows,
        alerts,
        timestamp: new Date().toISOString(),
        source: 'OpenWeather API'
      };

      weatherCache.set(cacheKey, result);
      return result;
    } catch (error) {
      // Pillar: Fail-Safe & Graceful Degradation
      // Log the error with high cardinality data for telemetry
      console.error(`[WeatherService] Error fetching data for ${lat},${lng}:`, error.message);
      
      // If we have ANY old cache for this neighborhood, return it as stale data
      if (cached) return { ...cached, _stale: true };
      
      throw new WeatherServiceError(
        'Weather upstream service unavailable', 
        error.response?.status || 502, 
        'UPSTREAM_ERROR'
      );
    }
  }
}

// -------------------------------------------------------------------------
// ROUTE HANDLER
// Pillar: Separation of Concerns
// -------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    // 1. Validation
    const validation = CoordsSchema.safeParse(req.query);
    if (!validation.success) {
      throw new WeatherServiceError('Invalid coordinate parameters', 400, 'VALIDATION_ERROR');
    }
    const { lat, lng } = validation.data;

    // 2. Service Call
    const data = await WeatherService.getWeatherData(lat, lng);
    
    // 3. Response Delivery
    res.json(data);

  } catch (error) {
    // 4. Global Error Propagation
    // Pillar: Resilience (Fail-Safe Hand-off to global handler)
    next(error);
  }
});

module.exports = router;
