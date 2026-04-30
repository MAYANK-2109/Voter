import { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { FiMapPin, FiMessageCircle, FiX, FiCheck, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import PulseNews from './PulseNews';
import BoothReporter from './BoothReporter';
import ClimateWatch from './ClimateWatch';
import MyLeaders from './MyLeaders';
import SOSPanel from './SOSPanel';
import ChatBot from './ChatBot';
import BoothFinder from './BoothFinder';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const { locationData, setManualLocation } = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newCity, setNewCity] = useState(locationData?.city || '');
  const [newState, setNewState] = useState(locationData?.state || '');

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (newCity.trim() && newState) {
      setManualLocation(newCity.trim(), newState);
      setShowLocationPicker(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      <div className="tricolor-stripe" />
      
      <header className="sticky top-1 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex flex-col overflow-hidden shadow-sm">
              <div className="flex-1 bg-saffron" />
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="w-2 h-2 rounded-full border border-india-blue flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-india-blue rounded-full" />
                </div>
              </div>
              <div className="flex-1 bg-india-green" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary leading-tight">VOTE-पथ<span className="text-saffron">2.0</span></h1>
              <p className="text-[10px] text-text-muted font-medium tracking-wider uppercase flex items-center gap-1">
                Election Resilience Engine <span className="text-india-blue">●</span> India
              </p>
            </div>
          </motion.div>

          <div className="relative">
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setShowLocationPicker(!showLocationPicker)}
              aria-label="Change location"
              aria-expanded={showLocationPicker}
              className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-saffron transition-colors cursor-pointer shadow-sm"
            >
              <FiMapPin className="w-3.5 h-3.5 text-saffron" aria-hidden="true" />
              <span className="text-xs font-medium text-text-secondary truncate max-w-[120px] sm:max-w-none">
                {locationData?.city || 'Unknown'}, {locationData?.state || 'Unknown'}
              </span>
              <FiChevronDown className={`w-3 h-3 text-text-muted transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} aria-hidden="true" />
            </motion.button>

            <AnimatePresence>
              {showLocationPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-text-primary">Change Location</h3>
                    <button onClick={() => setShowLocationPicker(false)} className="text-text-muted hover:text-danger"><FiX className="w-3.5 h-3.5" /></button>
                  </div>
                  <form onSubmit={handleLocationSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label htmlFor="city-input" className="sr-only">City Name</label>
                      <input 
                        id="city-input"
                        type="text" 
                        placeholder="City Name" 
                        value={newCity} 
                        onChange={e => setNewCity(e.target.value)} 
                        className="input-glass text-xs py-2 w-full" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="state-select" className="sr-only">Select State</label>
                      <select 
                        id="state-select"
                        value={newState} 
                        onChange={e => setNewState(e.target.value)} 
                        className="select-glass text-xs py-2 w-full" 
                        required
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary w-full text-[10px] py-2 flex items-center justify-center gap-1">
                      <FiCheck className="w-3 h-3" aria-hidden="true" /> Update Location
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 relative">
        <div className="absolute inset-0 mandala-pattern -z-10 pointer-events-none" />
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto"
        >
          <motion.div variants={item} className="lg:col-span-2">
            <PulseNews />
          </motion.div>

          <motion.div variants={item}>
            <ClimateWatch />
          </motion.div>

          <motion.div variants={item}>
            <MyLeaders />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-2">
            <BoothFinder />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-2">
            <BoothReporter />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-4">
            <SOSPanel />
          </motion.div>
        </motion.div>
      </main>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      >
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="bg-white text-saffron text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-saffron/20"
        >
          Ask VOTE-पथ AI 👋
        </motion.div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-saffron rounded-full animate-ping opacity-30 group-hover:opacity-0 transition-opacity duration-300"></div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setChatOpen(true)}
            aria-label="Open AI Assistant"
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-saffron to-orange-500 shadow-xl flex items-center justify-center shadow-saffron/40 cursor-pointer border-2 border-white"
            id="chatbot-fab"
          >
            <FiMessageCircle className="w-6 h-6 text-white" aria-hidden="true" />
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {chatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setChatOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full shadow-2xl"
            >
              <ChatBot onClose={() => setChatOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="text-center py-12 text-xs text-text-muted flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span>Made with ❤️ for Indian Democracy</span>
        </div>
        <p>VOTE-पथ 2.0 — Satyamev Jayate</p>
      </footer>
    </div>
  );
}
