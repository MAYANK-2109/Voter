import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import api from '../utils/api';
import { FiSun, FiCloudRain, FiCloud, FiWind, FiDroplet, FiThermometer, FiAlertTriangle } from 'react-icons/fi';

const WEATHER_ICONS = {
  Clear: FiSun,
  Clouds: FiCloud,
  Rain: FiCloudRain,
  Drizzle: FiCloudRain,
  Thunderstorm: FiCloudRain,
  default: FiSun
};

export default function ClimateWatch() {
  const { coords } = useLocation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!coords?.lat) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/weather?lat=${coords.lat}&lng=${coords.lng}`);
        setWeather(res.data);
      } catch (err) {
        console.error('Weather fetch failed:', err);
      }
      setLoading(false);
    };
    fetch();
  }, [coords]);

  if (loading) {
    return (
      <div className="glass-card p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton w-8 h-8 rounded-lg" />
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="skeleton h-16 w-full mb-3" />
        <div className="space-y-2">
          <div className="skeleton h-8 w-full" />
          <div className="skeleton h-8 w-full" />
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="glass-card p-5 h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <FiThermometer className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-sm font-bold text-text-primary">Climate Watch</h2>
        </div>
        <p className="text-text-muted text-xs">Unable to load weather data</p>
      </div>
    );
  }

  const WeatherIcon = WEATHER_ICONS[weather.condition] || WEATHER_ICONS.default;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${weather.isHeatwave ? 'bg-danger/20' : 'bg-blue-500/20'}`}>
          <FiThermometer className={`w-4 h-4 ${weather.isHeatwave ? 'text-danger' : 'text-blue-400'}`} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary">Climate Watch</h2>
          <p className="text-[10px] text-text-muted">{weather.city || 'Your Area'}</p>
        </div>
        {weather.isHeatwave && (
          <span className="badge badge-danger ml-auto text-[10px]">
            <FiAlertTriangle className="w-3 h-3" /> HEATWAVE
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <WeatherIcon className="w-10 h-10 text-saffron-light" />
          <div>
            <p className="text-3xl font-black text-text-primary">{weather.temperature}°</p>
            <p className="text-[10px] text-text-muted">Feels {weather.feelsLike}°C</p>
          </div>
        </div>
        <div className="ml-auto text-right space-y-1">
          <p className="text-[10px] text-text-secondary flex items-center gap-1 justify-end">
            <FiDroplet className="w-3 h-3" /> {weather.humidity}%
          </p>
          <p className="text-[10px] text-text-secondary flex items-center gap-1 justify-end">
            <FiWind className="w-3 h-3" /> {weather.windSpeed} m/s
          </p>
          <p className="text-[10px] text-text-muted capitalize">{weather.description}</p>
        </div>
      </div>

      {weather.alerts?.length > 0 && (
        <div className="mb-3 space-y-1">
          {weather.alerts.map((alert, i) => (
            <p key={i} className="text-[10px] text-warning leading-relaxed">{alert}</p>
          ))}
        </div>
      )}

      <div>
        <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2">Safe Voting Windows</p>
        <div className="space-y-1.5">
          {weather.safeWindows?.map((w, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-component-subtle">
              <div className="flex items-center gap-2">
                <span className={`status-dot ${w.safety === 'safe' ? 'status-green' : 'status-yellow'}`} />
                <span className="text-xs font-medium text-text-primary">{w.label}</span>
              </div>
              <span className="text-[10px] text-text-secondary font-mono">{w.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
