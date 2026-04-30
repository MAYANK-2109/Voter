import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from '../context/LocationContext';
import axios from 'axios';
import { FiUser, FiInfo, FiX, FiAward, FiMapPin, FiAnchor, FiBriefcase, FiExternalLink } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

const ROLE_CONFIG = {
  'Chief Minister': { icon: FiUser, color: 'bg-saffron/20 text-saffron', gradient: 'from-saffron/5 to-transparent' },
  'Governor': { icon: FiAward, color: 'bg-india-blue/20 text-india-blue', gradient: 'from-india-blue/5 to-transparent' },
  'Mayor': { icon: FiAnchor, color: 'bg-india-green/20 text-india-green', gradient: 'from-india-green/5 to-transparent' },
  'Member of Parliament': { icon: FiMapPin, color: 'bg-indigo-500/20 text-indigo-600', gradient: 'from-indigo-500/5 to-transparent' },
  'District Collector': { icon: FiBriefcase, color: 'bg-slate-500/20 text-slate-600', gradient: 'from-slate-500/5 to-transparent' }
};

export default function MyLeaders() {
  const { coords, locationData } = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [leaderInfo, setLeaderInfo] = useState('');
  const [leaderImage, setLeaderImage] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      try {
        const params = coords?.lat ? `lat=${coords.lat}&lng=${coords.lng}` : `state=${locationData?.state}&city=${locationData?.city}`;
        const res = await axios.get(`/api/leaders?${params}`);
        setData(res.data);
      } catch (err) {
        console.error('Leaders fetch failed:', err);
      }
      setLoading(false);
    };
    fetchLeaders();
  }, [coords, locationData]);

  const handleLeaderClick = async (leader) => {
    setSelectedLeader(leader);
    setLeaderInfo('');
    setLeaderImage(leader.image || null);
    setInfoLoading(true);
    try {
      const res = await axios.get(`/api/leaders/info`, {
        params: {
          name: leader.name,
          role: leader.role,
          state: data.state,
          city: leader.city || data.city
        }
      });
      setLeaderInfo(res.data.info);
      if (res.data.image) setLeaderImage(res.data.image);
    } catch (err) {
      setLeaderInfo('Failed to load leader information. Please try again later.');
    }
    setInfoLoading(false);
  };

  return (
    <>
      <div className="glass-card p-5 h-full relative">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-india-blue/20 flex items-center justify-center">
            <FiUser className="w-4 h-4 text-india-blue" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Know Your Leaders</h2>
            <p className="text-[10px] text-text-muted">{data?.city ? `${data.city}, ` : ''}{data?.state || 'Your State'}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        ) : data?.leaders?.length > 0 ? (
          <div className="space-y-2">
            {data.leaders.map((leader, i) => {
              const config = ROLE_CONFIG[leader.role] || ROLE_CONFIG['District Collector'];
              const RoleIcon = config.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleLeaderClick(leader)}
                  className={`w-full text-left p-3 rounded-lg bg-gradient-to-r ${config.gradient} bg-component-subtle hover:bg-component-hover transition-all group flex items-center justify-between cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    {leader.image ? (
                      <img src={leader.image} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-text-primary group-hover:text-india-blue transition-colors">{leader.name}</h3>
                      <p className="text-[10px] text-text-muted">{leader.role}{leader.city ? ` — ${leader.city}` : ''}</p>
                    </div>
                  </div>
                  <FiInfo className="w-4 h-4 text-text-muted group-hover:text-india-blue transition-colors" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text-muted text-xs">No leadership data available for this area.</p>
          </div>
        )}
      </div>

      {/* Leader Info Modal Overlay - Using Portal to escape all transformed parent containers */}
      {createPortal(
        <AnimatePresence>
          {selectedLeader && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white max-w-xl w-full rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden relative"
              >
                <button 
                  onClick={() => setSelectedLeader(null)}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-text-muted hover:text-danger shadow-sm transition-all hover:rotate-90 active:scale-90 cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>

                <div className="flex flex-col md:flex-row h-full">
                  {/* Image Section */}
                  <div className="md:w-2/5 relative h-72 md:h-auto bg-slate-100">
                    {leaderImage ? (
                      <img src={leaderImage} alt={selectedLeader.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <FiUser className="w-16 h-16 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
                    <div className="absolute bottom-6 left-6 md:hidden">
                      <h3 className="text-white text-xl font-black">{selectedLeader.name}</h3>
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{selectedLeader.role}</p>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-center bg-white">
                    <div className="hidden md:block mb-6">
                      <h3 className="text-2xl font-black text-text-primary leading-tight">{selectedLeader.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${ROLE_CONFIG[selectedLeader.role]?.color || 'bg-slate-100'}`}>
                          {selectedLeader.role}
                        </span>
                        {selectedLeader.party && (
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{selectedLeader.party}</span>
                        )}
                      </div>
                    </div>

                    <div className="relative max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {infoLoading ? (
                        <div className="space-y-4">
                          <div className="skeleton h-3 w-full" />
                          <div className="skeleton h-3 w-11/12" />
                          <div className="skeleton h-3 w-10/12" />
                          <div className="skeleton h-3 w-full" />
                          <div className="skeleton h-3 w-9/12" />
                        </div>
                      ) : (
                        <div className="text-sm text-text-secondary leading-relaxed font-medium">
                          <ReactMarkdown>{leaderInfo}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4">
                      <button 
                        onClick={() => setSelectedLeader(null)}
                        className="btn-primary flex-1 py-3 text-xs shadow-saffron/30"
                      >
                        Close Profile
                      </button>
                      <a 
                        href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedLeader.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-component-subtle hover:bg-india-blue/10 hover:text-india-blue text-text-muted transition-all"
                        title="Read more on Wikipedia"
                      >
                        <FiExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
