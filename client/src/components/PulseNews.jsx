import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import axios from 'axios';
import { FiRadio, FiExternalLink, FiRefreshCw, FiClock } from 'react-icons/fi';

export default function PulseNews() {
  const { coords, locationData } = useLocation();
  const [articles, setArticles] = useState([]);
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = coords?.lat ? `lat=${coords.lat}&lng=${coords.lng}` : `state=${locationData?.state}`;
      const res = await axios.get(`/api/pulse?${params}`);
      setArticles(res.data.articles || []);
      setIsFallback(res.data.isFallback || false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load news');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [coords]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-saffron/20 flex items-center justify-center">
            <FiRadio className="w-4 h-4 text-saffron" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Live Election Pulse</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-text-muted">{locationData?.state || 'Your State'}</p>
              {isFallback && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-india-blue/10 text-india-blue font-semibold uppercase tracking-wider">National fallback</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={fetchNews} className="p-2 rounded-lg hover:bg-component-hover transition-colors cursor-pointer" title="Refresh">
          <FiRefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !articles.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-20 h-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-2 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm mb-2">{error}</p>
          <button onClick={fetchNews} className="btn-outline text-xs">Try Again</button>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm">No election news found</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-2 rounded-lg hover:bg-component-hover transition-colors group"
            >
              {article.image && (
                <img
                  src={article.image}
                  alt=""
                  className="w-20 h-16 object-cover rounded-lg shrink-0"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-text-primary line-clamp-2 group-hover:text-saffron transition-colors leading-relaxed">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-text-muted truncate">{article.source?.name}</span>
                  <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                    <FiClock className="w-2.5 h-2.5" /> {timeAgo(article.publishedAt)}
                  </span>
                  <FiExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
