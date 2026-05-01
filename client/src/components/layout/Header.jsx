import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiChevronDown, FiX, FiCheck } from 'react-icons/fi';
import { INDIAN_STATES } from '../../utils/constants';

/**
 * Header Component
 * Quality: locationState object simplifies props from 8 down to 4.
 * Accessibility: Semantic landmarks, aria-expanded, and screen-reader labels.
 */
export default function Header({ 
  locationData, 
  locationState, 
  setLocationState, 
  handleLocationSubmit 
}) {
  const { isOpen, city, state } = locationState;

  const setCity = (newCity) => setLocationState(prev => ({ ...prev, city: newCity }));
  const setState = (newState) => setLocationState(prev => ({ ...prev, state: newState }));
  const setIsOpen = (newOpen) => setLocationState(prev => ({ ...prev, isOpen: newOpen }));

  return (
    <header className="sticky top-1 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex flex-col overflow-hidden shadow-sm" aria-hidden="true">
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
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Change location"
            aria-expanded={isOpen}
            className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-saffron transition-colors cursor-pointer shadow-sm"
          >
            <FiMapPin className="w-3.5 h-3.5 text-saffron" aria-hidden="true" />
            <span className="text-xs font-medium text-text-secondary truncate max-w-[120px] sm:max-w-none">
              {locationData?.city || 'Unknown'}, {locationData?.state || 'Unknown'}
            </span>
            <FiChevronDown className={`w-3 h-3 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </motion.button>

          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50"
                role="dialog"
                aria-labelledby="location-picker-title"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 id="location-picker-title" className="text-xs font-bold text-text-primary">Change Location</h3>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)} 
                    className="text-text-muted hover:text-danger p-1"
                    aria-label="Close location picker"
                  >
                    <FiX className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
                <form onSubmit={handleLocationSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="city-input" className="sr-only">City Name</label>
                    <input 
                      id="city-input"
                      type="text" 
                      placeholder="City Name" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                      className="input-glass text-xs py-2 w-full" 
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="state-select" className="sr-only">Select State</label>
                    <select 
                      id="state-select"
                      value={state} 
                      onChange={e => setState(e.target.value)} 
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
  );
}
