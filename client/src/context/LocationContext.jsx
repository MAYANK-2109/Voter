import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please use a modern browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await axios.get(`/api/location?lat=${latitude}&lng=${longitude}`);
          setLocationData(res.data);
        } catch (err) {
          setLocationData({
            city: 'Unknown',
            state: 'Unknown',
            district: 'Unknown',
            country: 'India'
          });
        }

        setLoading(false);
      },
      (err) => {
        let message = 'Location access denied.';
        if (err.code === 1) message = 'You denied location access. VoterPath needs your location to personalize data for your area.';
        else if (err.code === 2) message = 'Location unavailable. Please check your device settings.';
        else if (err.code === 3) message = 'Location request timed out. Please try again.';
        setError(message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const setManualLocation = async (city, state) => {
    setError(null);
    setLoading(true);
    setLocationData({ city, state, district: city, country: 'India' });
    setCoords({ lat: 0, lng: 0 });
    setLoading(false);
  };

  return (
    <LocationContext.Provider value={{ coords, locationData, loading, error, setManualLocation, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
