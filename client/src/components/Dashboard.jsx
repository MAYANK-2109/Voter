import { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { motion, AnimatePresence } from 'framer-motion';
import PulseNews from './PulseNews';
import BoothReporter from './BoothReporter';
import ClimateWatch from './ClimateWatch';
import MyLeaders from './MyLeaders';
import SOSPanel from './SOSPanel';
import ChatBot from './ChatBot';
import BoothFinder from './BoothFinder';
import Header from './layout/Header';
import ChatFAB from './layout/ChatFAB';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

/**
 * Main Dashboard Component
 * Quality: Single locationState object replaces 8-prop drilling.
 * Accessibility: Semantic main/nav landmarks + screen-reader only headings.
 */
export default function Dashboard() {
  const { locationData, setManualLocation } = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [locationState, setLocationState] = useState({
    isOpen: false,
    city: locationData?.city || '',
    state: locationData?.state || ''
  });

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (locationState.city.trim() && locationState.state) {
      setManualLocation(locationState.city.trim(), locationState.state);
      setLocationState(prev => ({ ...prev, isOpen: false }));
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      <div className="tricolor-stripe" />
      
      <nav aria-label="Application Header">
        <Header 
          locationData={locationData}
          locationState={locationState}
          setLocationState={setLocationState}
          handleLocationSubmit={handleLocationSubmit}
        />
      </nav>

      <main id="main-content" className="max-w-7xl mx-auto px-4 py-6 relative">
        <div className="absolute inset-0 mandala-pattern -z-10 pointer-events-none" aria-hidden="true" />
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto"
        >
          <motion.div variants={item} className="lg:col-span-2">
            <h2 className="sr-only">Live Election Updates</h2>
            <PulseNews />
          </motion.div>

          <motion.div variants={item}>
            <h2 className="sr-only">Weather and Heat Risk</h2>
            <ClimateWatch />
          </motion.div>

          <motion.div variants={item}>
            <h2 className="sr-only">Local Representatives</h2>
            <MyLeaders />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-2">
            <h2 className="sr-only">Booth Navigator</h2>
            <BoothFinder />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-2">
            <h2 className="sr-only">Report Booth Status</h2>
            <BoothReporter />
          </motion.div>

          <motion.div variants={item} className="lg:col-span-4">
            <h2 className="sr-only">Emergency Services</h2>
            <SOSPanel />
          </motion.div>
        </motion.div>
      </main>

      <ChatFAB onClick={() => setChatOpen(true)} />

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
              role="dialog"
              aria-label="AI Assistant Chat"
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
