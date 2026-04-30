import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from '../context/LocationContext';
import { FiShield, FiPhone, FiPlus, FiX, FiCheck, FiAlertOctagon, FiClock, FiUsers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * UTILITY: Input Validation
 * Pillar: Security & Quality
 */
const validateContact = (name, phone) => {
  const nameValid = name.trim().length >= 2;
  const phoneValid = /^[6-9]\d{9}$/.test(phone.trim()); // Basic Indian mobile number validation
  return { nameValid, phoneValid };
};

/**
 * COMPONENT: EmergencyHelplines
 * Pillar: Code Quality (Modularity)
 */
const EmergencyHelplines = () => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 px-1">Emergency Helplines</p>
    <div className="space-y-2">
      {[
        { label: 'Emergency', num: '112' },
        { label: 'Election Commission', num: '1950' },
        { label: 'Police', num: '100' }
      ].map((link) => (
        <a 
          key={link.num}
          href={`tel:${link.num}`} 
          className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-india-blue transition-colors p-1"
          aria-label={`Call ${link.label} at ${link.num}`}
        >
          <FiPhone className="w-3 h-3 text-india-blue/60" aria-hidden="true" /> 
          <span>{link.num} — {link.label}</span>
        </a>
      ))}
    </div>
  </div>
);

export default function SOSPanel() {
  const { locationData } = useLocation();
  
  // Pillar: Code Quality (State Management)
  const [contacts, setContacts] = useState(() => {
    try {
      const saved = localStorage.getItem('vp_trusted_contacts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse contacts', e);
      return [];
    }
  });

  const [safetyStatus, setSafetyStatus] = useState({
    checkedIn: false,
    checkInTime: null,
    sosTriggered: false
  });

  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Pillar: Security (Persistence)
  useEffect(() => {
    localStorage.setItem('vp_trusted_contacts', JSON.stringify(contacts));
  }, [contacts]);

  // Pillar: Efficiency (Performance - Memoization)
  const elapsedMinutes = useMemo(() => {
    if (!safetyStatus.checkInTime) return 0;
    const diff = Date.now() - new Date(safetyStatus.checkInTime).getTime();
    return Math.floor(diff / 60000);
  }, [safetyStatus.checkInTime]);

  /**
   * ACTION: Trigger SOS
   * Pillar: Accessibility (Aria Announcements)
   */
  const triggerSOS = useCallback(() => {
    setSafetyStatus(prev => ({ ...prev, sosTriggered: true }));
    
    const message = `🚨 SOS triggered from ${locationData?.city || 'polling station'}. Trusted contacts are being alerted.`;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('VOTE-पथ SOS ALERT', { body: message });
    }
    
    // Pillar: Accessibility (Manual focus or announcement could go here)
  }, [locationData]);

  // Pillar: Efficiency (Timer Logic)
  useEffect(() => {
    if (!safetyStatus.checkedIn || !safetyStatus.checkInTime || safetyStatus.sosTriggered) return;

    const CHECK_IN_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins
    const diff = Date.now() - new Date(safetyStatus.checkInTime).getTime();
    const remaining = Math.max(0, CHECK_IN_TIMEOUT_MS - diff);

    const timer = setTimeout(() => {
      triggerSOS();
    }, remaining);

    return () => clearTimeout(timer);
  }, [safetyStatus.checkedIn, safetyStatus.checkInTime, safetyStatus.sosTriggered, triggerSOS]);

  const handleCheckIn = () => {
    setSafetyStatus({
      checkedIn: true,
      checkInTime: new Date().toISOString(),
      sosTriggered: false
    });
    
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleSafe = () => {
    setSafetyStatus({
      checkedIn: false,
      checkInTime: null,
      sosTriggered: false
    });
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    const { nameValid, phoneValid } = validateContact(newContact.name, newContact.phone);

    if (!nameValid) return setValidationError('Name must be at least 2 characters');
    if (!phoneValid) return setValidationError('Enter a valid 10-digit mobile number');

    setContacts(prev => [...prev, { ...newContact, id: Date.now() }]);
    setNewContact({ name: '', phone: '' });
    setShowAddForm(false);
    setValidationError('');
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors ${safetyStatus.sosTriggered ? 'bg-danger text-white' : 'bg-saffron/10 text-saffron'}`}>
          <FiShield className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">Safety SOS Portal</h2>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Resilience Monitoring</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Status Column */}
        <section aria-labelledby="status-heading">
          <h3 id="status-heading" className="sr-only">Safety Status</h3>
          
          <AnimatePresence mode="wait">
            {safetyStatus.sosTriggered ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-danger/5 border border-danger/20 text-center shadow-inner mb-4"
                role="alert"
                aria-live="assertive"
              >
                <FiAlertOctagon className="w-12 h-12 text-danger mx-auto mb-3 animate-pulse" />
                <h4 className="text-lg font-black text-danger uppercase mb-1">SOS Active</h4>
                <p className="text-xs font-medium text-text-secondary mb-4">Your trusted contacts have been alerted with your location.</p>
                <button onClick={handleSafe} className="btn-primary w-full py-4 shadow-danger/20">
                  <FiCheck className="w-4 h-4 mr-2" /> I AM SAFE NOW
                </button>
              </motion.div>
            ) : safetyStatus.checkedIn ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-india-green/5 border border-india-green/20 text-center mb-4"
              >
                <div className="w-12 h-12 rounded-full bg-india-green/10 flex items-center justify-center mx-auto mb-3">
                  <FiCheck className="w-6 h-6 text-india-green-light" />
                </div>
                <h4 className="text-base font-bold text-india-green-light uppercase">Monitoring Active</h4>
                <div className="flex items-center justify-center gap-2 mt-2 mb-4">
                  <FiClock className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs font-bold text-text-secondary">{elapsedMinutes}m at Polling Station</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSafe} className="btn-outline flex-1 py-3 text-xs">MARK SAFE</button>
                  <button onClick={triggerSOS} className="sos-button flex-1 py-3 text-xs font-black">SOS</button>
                </div>
              </motion.div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center mb-4 border-dashed">
                <FiShield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-text-primary mb-1">Safety Check-In</h4>
                <p className="text-[10px] text-text-muted mb-4 uppercase tracking-widest font-black">Start 30-min auto-monitoring</p>
                <button onClick={handleCheckIn} className="btn-primary w-full py-3 text-xs">CHECK IN AT BOOTH</button>
              </div>
            )}
          </AnimatePresence>

          <EmergencyHelplines />
        </section>

        {/* Contacts Column */}
        <section aria-labelledby="contacts-heading" className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 id="contacts-heading" className="text-xs font-bold text-text-primary flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-india-blue" /> Trusted Contacts
            </h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className={`p-1.5 rounded-lg transition-all ${showAddForm ? 'bg-danger/10 text-danger' : 'bg-india-blue/10 text-india-blue'}`}
              aria-label={showAddForm ? 'Cancel add contact' : 'Add trusted contact'}
            >
              {showAddForm ? <FiX className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                onSubmit={handleAddContact} 
                className="space-y-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-hidden"
              >
                <div>
                  <label htmlFor="contact-name" className="sr-only">Contact Name</label>
                  <input 
                    id="contact-name"
                    type="text" 
                    placeholder="Full Name" 
                    value={newContact.name} 
                    onChange={e => setNewContact({...newContact, name: e.target.value})} 
                    className="input-glass text-xs" 
                    required 
                  />
                </div>
                <div>
                  <label htmlFor="contact-phone" className="sr-only">Phone Number</label>
                  <input 
                    id="contact-phone"
                    type="tel" 
                    placeholder="10-Digit Mobile" 
                    value={newContact.phone} 
                    onChange={e => setNewContact({...newContact, phone: e.target.value})} 
                    className="input-glass text-xs" 
                    required 
                  />
                </div>
                {validationError && <p className="text-[10px] text-danger font-bold px-1" role="alert">{validationError}</p>}
                <button type="submit" className="btn-primary w-full py-3 text-xs font-black">SAVE CONTACT</button>
              </motion.form>
            )}
          </AnimatePresence>

          {contacts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-text-muted mb-2 font-medium">No safety contacts added.</p>
              <button onClick={() => setShowAddForm(true)} className="text-[10px] font-black text-india-blue uppercase hover:underline">Add First Contact</button>
            </div>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {contacts.map(contact => (
                <li key={contact.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-india-blue/30 transition-all shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-india-blue/5 flex items-center justify-center text-[10px] font-black text-india-blue">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-primary">{contact.name}</p>
                      <p className="text-[10px] font-medium text-text-muted">{contact.phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setContacts(prev => prev.filter(c => c.id !== contact.id))} 
                    className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/5 transition-all"
                    aria-label={`Remove ${contact.name}`}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
