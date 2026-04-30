import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import axios from 'axios';
import { FiActivity, FiSend, FiThumbsUp, FiClock, FiMapPin, FiCamera, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const QUEUE_MAP = {
  empty: { label: 'Empty', time: '0-5 min', color: 'text-success' },
  short: { label: 'Short', time: '5-15 min', color: 'text-success' },
  moderate: { label: 'Moderate', time: '15-45 min', color: 'text-warning' },
  long: { label: 'Long', time: '45-90 min', color: 'text-danger' },
  extreme: { label: 'Extreme', time: '90+ min', color: 'text-danger font-black' }
};

export default function BoothReporter() {
  const { coords, locationData } = useLocation();
  const [tab, setTab] = useState('view');
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nearbyBooths, setNearbyBooths] = useState([]);
  
  const [form, setForm] = useState({
    boothId: '',
    evmStatus: 'working',
    queueLength: 'moderate',
    safetyStatus: 'peaceful',
    reporterName: '',
    description: ''
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = coords?.lat ? `lat=${coords.lat}&lng=${coords.lng}&radius=1.0` : '';
      const res = await axios.get(`/api/booth-status?${params}`);
      setReports(res.data.reports || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Booth fetch failed:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [coords]);

  useEffect(() => {
    if (!coords?.lat) {
      setNearbyBooths([]);
      return;
    }
    
    // Simulate nearby booths based on user location (same logic as BoothFinder)
    const simulatedBooths = [
      { id: 1, name: 'Government Primary School, East Wing', lat: coords.lat + 0.002, lng: coords.lng + 0.001, address: 'Sector 4, Near Community Center' },
      { id: 2, name: 'Community Hall, Block B', lat: coords.lat - 0.003, lng: coords.lng - 0.002, address: 'MG Road, Opposite Police Station' },
      { id: 3, name: 'St. Xaviers High School, Auditorium', lat: coords.lat + 0.001, lng: coords.lng - 0.004, address: 'Station Road, North Raipur' }
    ];
    setNearbyBooths(simulatedBooths);
    
    // Auto-select the first booth if form.boothId is empty
    setForm(prev => ({ 
      ...prev, 
      boothId: prev.boothId || (simulatedBooths.length > 0 ? simulatedBooths[0].id.toString() : '') 
    }));
  }, [coords]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/booth-status', {
        ...form,
        location: { lat: coords?.lat || 0, lng: coords?.lng || 0 },
        city: locationData?.city,
        state: locationData?.state
      });
      setShowSuccess(true);
      setForm({ boothId: nearbyBooths.length > 0 ? nearbyBooths[0].id.toString() : '', evmStatus: 'working', queueLength: 'moderate', safetyStatus: 'peaceful', reporterName: '', description: '' });
      setTimeout(() => { 
        setShowSuccess(false); 
        setTab('view'); 
        fetchReports(); 
      }, 2500);
    } catch (err) {
      console.error('Submit failed:', err);
    }
    setSubmitting(false);
  };

  const handleUpvote = async (id) => {
    try {
      await axios.patch(`/api/booth-status/${id}/upvote`);
      setReports(prev => prev.map(r => r._id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const statusColors = { working: 'status-green', glitch: 'status-yellow', down: 'status-red' };
  const safetyLabels = { peaceful: 'badge-safe', tense: 'badge-caution', disrupted: 'badge-danger' };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-india-green/20 flex items-center justify-center shadow-sm shadow-india-green/10">
            <FiActivity className="w-4 h-4 text-india-green-light" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Booth Pulse</h2>
            <p className="text-[10px] text-text-muted">Crowdsourced Verification</p>
          </div>
        </div>
        <div className="flex p-1 bg-slate-100 rounded-lg">
          <button onClick={() => setTab('view')} className={`text-[10px] px-4 py-1.5 rounded-md font-bold transition-all cursor-pointer ${tab === 'view' ? 'bg-white text-india-green-light shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            EXPLORE
          </button>
          <button onClick={() => setTab('report')} className={`text-[10px] px-4 py-1.5 rounded-md font-bold transition-all cursor-pointer ${tab === 'report' ? 'bg-saffron text-white shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}>
            REPORT
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full flex flex-col items-center justify-center text-center p-6"
            >
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                <FiCheckCircle className="w-8 h-8 text-success animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-text-primary">Thank You!</h3>
              <p className="text-xs text-text-secondary mt-2">Your report helps millions of voters stay informed. Jai Hind! 🇮🇳</p>
            </motion.div>
          ) : tab === 'view' ? (
            <motion.div 
              key="view"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {summary && summary.total > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Local Summary</p>
                    <span className="text-[10px] font-bold text-india-blue bg-india-blue/10 px-2 py-0.5 rounded-full">{summary.total} Reports</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="text-xs font-bold text-success">{Math.round((summary.evm.working / summary.total) * 100)}%</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-success" style={{ width: `${(summary.evm.working / summary.total) * 100}%` }} />
                      </div>
                      <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">EVM OK</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-warning">{Math.round((summary.evm.glitch / summary.total) * 100)}%</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-warning" style={{ width: `${(summary.evm.glitch / summary.total) * 100}%` }} />
                      </div>
                      <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">GLITCH</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-danger">{Math.round((summary.evm.down / summary.total) * 100)}%</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-danger" style={{ width: `${(summary.evm.down / summary.total) * 100}%` }} />
                      </div>
                      <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">DOWN</p>
                    </div>
                  </div>
                </div>
              )}

              {loading && !reports.length ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full" />)}
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <FiActivity className="w-6 h-6 text-text-muted" />
                  </div>
                  <p className="text-text-muted text-xs font-medium">No reports from this area yet.</p>
                  <button onClick={() => setTab('report')} className="mt-4 text-xs font-bold text-saffron hover:underline">BE THE FIRST TO REPORT</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r._id} className="group p-4 rounded-2xl bg-white border border-slate-100 hover:border-india-green/30 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${statusColors[r.evmStatus]} shadow-sm`} />
                          <span className="text-xs font-black text-text-primary">BOOTH #{r.boothId}</span>
                        </div>
                        <span className={`badge ${safetyLabels[r.safetyStatus]} text-[8px] font-black`}>{r.safetyStatus}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Est. Wait Time</p>
                          <p className={`text-xs font-bold ${QUEUE_MAP[r.queueLength]?.color}`}>
                            {QUEUE_MAP[r.queueLength]?.time || '5-15 min'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <p className="text-[8px] text-text-muted uppercase font-bold mb-0.5">Queue Status</p>
                          <p className="text-xs font-bold text-text-primary capitalize">{r.queueLength}</p>
                        </div>
                      </div>

                      {r.description && <p className="text-[10px] text-text-secondary mb-3 leading-relaxed bg-slate-50/50 p-2 rounded-lg">{r.description}</p>}
                      
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] text-text-muted flex items-center gap-1">
                            <FiClock className="w-3 h-3" /> {timeAgo(r.timestamp)}
                          </span>
                          <span className="text-[9px] text-text-muted flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" /> {r.city || 'Local'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleUpvote(r._id)} 
                          className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-saffron transition-colors cursor-pointer"
                        >
                          <FiThumbsUp className="w-3.5 h-3.5" /> {r.upvotes || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form 
              key="report"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleSubmit} 
              className="space-y-4 py-2"
            >
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3 mb-2">
                <FiAlertCircle className="w-5 h-5 text-india-blue shrink-0 mt-0.5" />
                <p className="text-[10px] text-india-blue leading-relaxed font-medium">
                  Please provide accurate information. Your crowdsourced data helps fellow citizens plan their voting day efficiently.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Booth Identification</label>
                {nearbyBooths.length > 0 ? (
                  <select 
                    value={form.boothId} 
                    onChange={e => setForm({...form, boothId: e.target.value})} 
                    className="select-glass" 
                    required
                  >
                    <option value="" disabled>Select Nearby Booth</option>
                    {nearbyBooths.map(booth => (
                      <option key={booth.id} value={booth.id.toString()}>
                        {booth.name} (Booth #{booth.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="input-glass bg-slate-50 text-text-muted italic flex items-center h-[38px] text-xs">
                    No booths found nearby. Please enable location.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">EVM Status</label>
                  <select value={form.evmStatus} onChange={e => setForm({...form, evmStatus: e.target.value})} className="select-glass">
                    <option value="working">✅ Working Smoothly</option>
                    <option value="glitch">⚠️ Minor Glitches</option>
                    <option value="down">❌ Completely Down</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Queue Density</label>
                  <select value={form.queueLength} onChange={e => setForm({...form, queueLength: e.target.value})} className="select-glass">
                    <option value="empty">Empty</option>
                    <option value="short">Short (Fast)</option>
                    <option value="moderate">Moderate</option>
                    <option value="long">Long (Slow)</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Safety & Security</label>
                <select value={form.safetyStatus} onChange={e => setForm({...form, safetyStatus: e.target.value})} className="select-glass">
                  <option value="peaceful">🟢 Peaceful Environment</option>
                  <option value="tense">🟡 Tense / Arguments</option>
                  <option value="disrupted">🔴 Disrupted / Policed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest px-1">Observations</label>
                <textarea 
                  placeholder="Mention anything unusual or helpful for other voters..." 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="input-glass min-h-[80px] resize-none" 
                  rows={2} 
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <button type="submit" disabled={submitting || nearbyBooths.length === 0} className={`btn-primary w-full py-4 text-xs font-black uppercase tracking-widest ${nearbyBooths.length === 0 ? 'opacity-50 cursor-not-allowed' : 'shadow-saffron/40'}`}>
                    <FiSend className="w-4 h-4" /> {submitting ? 'PROCESSING...' : 'TRANSMIT REPORT'}
                  </button>
                </div>
                <button type="button" className="p-4 rounded-xl bg-slate-100 text-text-muted hover:bg-slate-200 transition-colors" title="Attach Photo">
                  <FiCamera className="w-5 h-5" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
