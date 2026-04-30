import { useState } from 'react';
import { FiMapPin, FiAlertTriangle, FiChevronRight, FiRefreshCw } from 'react-icons/fi';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function LocationError({ error, onManualLocation, onRetry }) {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim() && state) {
      onManualLocation(city.trim(), state);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="glass-card-static max-w-md w-full p-8 animate-fade-in-up">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-danger/20 flex items-center justify-center">
          <FiAlertTriangle className="w-8 h-8 text-danger" />
        </div>

        <h1 className="text-2xl font-bold text-center text-text-primary mb-2">Location Required</h1>
        <p className="text-text-secondary text-center text-sm mb-6">{error}</p>

        <button 
          onClick={onRetry}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-6 py-3"
        >
          <FiRefreshCw className="w-4 h-4" /> Grant Permission & Retry
        </button>

        <div className="glass-card-static p-4 mb-6 border-saffron/20">
          <h3 className="text-sm font-semibold text-saffron mb-2 flex items-center gap-2">
            <FiMapPin className="w-4 h-4" /> Why we need your location
          </h3>
          <ul className="text-xs text-text-secondary space-y-1">
            <li>• Show election news for your state</li>
            <li>• Display weather & safe voting hours for your area</li>
            <li>• Show nearby booth reports</li>
            <li>• Identify your elected leaders</li>
          </ul>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-text-muted">or enter manually</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your City (e.g., Raipur, Chennai)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-glass"
            required
          />
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="select-glass"
            required
          >
            <option value="">Select your State</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn-outline w-full flex items-center justify-center gap-2">
            Continue Manually <FiChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
