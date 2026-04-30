import { useState, useEffect } from 'react';
import { useLocation } from '../context/LocationContext';
import { FiShield, FiPhone, FiPlus, FiX, FiCheck, FiAlertOctagon, FiClock, FiUsers } from 'react-icons/fi';

export default function SOSPanel() {
  const { locationData } = useLocation();
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('vp_trusted_contacts');
    return saved ? JSON.parse(saved) : [];
  });
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    localStorage.setItem('vp_trusted_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (!checkedIn || !checkInTime) return;
    const timer = setTimeout(() => {
      if (checkedIn) {
        triggerSOS();
      }
    }, 1800000);
    return () => clearTimeout(timer);
  }, [checkedIn, checkInTime]);

  const handleCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(new Date().toISOString());
    setSosTriggered(false);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('VOTE-पथ Safety', { body: 'You are checked in at the polling station. We will alert contacts if no safe confirmation in 30 mins.' });
    } else if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  const handleSafe = () => {
    setCheckedIn(false);
    setCheckInTime(null);
    setSosTriggered(false);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('VOTE-पथ Safety', { body: 'You have confirmed safe. Trusted contacts have been notified.' });
    }
  };

  const triggerSOS = () => {
    setSosTriggered(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 VOTE-पथ SOS ALERT', { body: `SOS triggered from ${locationData?.city || 'polling station'}. Trusted contacts are being alerted.` });
    }
  };

  const addContact = (e) => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      setContacts([...contacts, { ...newContact, id: Date.now() }]);
      setNewContact({ name: '', phone: '' });
      setShowAdd(false);
    }
  };

  const removeContact = (id) => setContacts(contacts.filter(c => c.id !== id));

  const elapsed = checkInTime ? Math.floor((Date.now() - new Date(checkInTime).getTime()) / 60000) : 0;

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sosTriggered ? 'bg-danger/20' : 'bg-saffron/20'}`}>
          <FiShield className={`w-4 h-4 ${sosTriggered ? 'text-danger' : 'text-saffron'}`} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary">Community Safety SOS</h2>
          <p className="text-[10px] text-text-muted">Polling Station Check-In</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          {sosTriggered ? (
            <div className="text-center p-4 rounded-xl bg-danger/10 border border-danger/20 mb-3">
              <FiAlertOctagon className="w-10 h-10 text-danger mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-bold text-danger">SOS ACTIVE</p>
              <p className="text-[10px] text-text-muted mt-1">Trusted contacts have been notified</p>
              <button onClick={handleSafe} className="btn-primary mt-3 text-xs w-full">
                <FiCheck className="w-3 h-3 inline mr-1" /> I'm Safe Now
              </button>
            </div>
          ) : checkedIn ? (
            <div className="text-center p-4 rounded-xl bg-india-green/10 border border-india-green/20 mb-3">
              <FiCheck className="w-8 h-8 text-india-green-light mx-auto mb-2" />
              <p className="text-sm font-bold text-india-green-light">Checked In</p>
              <p className="text-[10px] text-text-muted mt-1 flex items-center justify-center gap-1">
                <FiClock className="w-3 h-3" /> {elapsed} min at station
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={handleSafe} className="btn-primary text-xs flex-1">
                  <FiCheck className="w-3 h-3 inline mr-1" /> I'm Safe
                </button>
                <button onClick={triggerSOS} className="sos-button text-xs flex-1 py-2">SOS</button>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 rounded-xl bg-component-subtle mb-3">
              <FiShield className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-xs text-text-secondary mb-1">Heading to vote?</p>
              <p className="text-[10px] text-text-muted mb-3">Check in to start safety monitoring</p>
              <button onClick={handleCheckIn} className="btn-primary w-full text-xs">Check In at Booth</button>
            </div>
          )}

          <div className="p-3 rounded-lg bg-component-subtle">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Emergency Helplines</p>
            <div className="space-y-1">
              <a href="tel:112" className="flex items-center gap-2 text-xs text-text-secondary hover:text-saffron transition-colors">
                <FiPhone className="w-3 h-3" /> 112 — Emergency
              </a>
              <a href="tel:1950" className="flex items-center gap-2 text-xs text-text-secondary hover:text-saffron transition-colors">
                <FiPhone className="w-3 h-3" /> 1950 — Election Commission
              </a>
              <a href="tel:100" className="flex items-center gap-2 text-xs text-text-secondary hover:text-saffron transition-colors">
                <FiPhone className="w-3 h-3" /> 100 — Police
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-text-primary flex items-center gap-1">
              <FiUsers className="w-3 h-3" /> Trusted Contacts
            </p>
            <button onClick={() => setShowAdd(!showAdd)} className="p-1 rounded-full hover:bg-component-hover cursor-pointer transition-colors">
              {showAdd ? <FiX className="w-3.5 h-3.5 text-text-muted" /> : <FiPlus className="w-3.5 h-3.5 text-text-muted" />}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addContact} className="space-y-2 mb-3">
              <input type="text" placeholder="Contact Name" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} className="input-glass text-xs" required />
              <input type="tel" placeholder="Phone Number" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} className="input-glass text-xs" required />
              <button type="submit" className="btn-primary w-full text-xs">Add Contact</button>
            </form>
          )}

          {contacts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[10px] text-text-muted">No trusted contacts added yet</p>
              <button onClick={() => setShowAdd(true)} className="text-[10px] text-saffron hover:underline mt-1 cursor-pointer">Add your first contact</button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {contacts.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-component-subtle">
                  <div>
                    <p className="text-xs font-medium text-text-primary">{c.name}</p>
                    <p className="text-[10px] text-text-muted">{c.phone}</p>
                  </div>
                  <button onClick={() => removeContact(c.id)} className="p-1 rounded-full hover:bg-danger/20 cursor-pointer transition-colors">
                    <FiX className="w-3 h-3 text-text-muted hover:text-danger" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
