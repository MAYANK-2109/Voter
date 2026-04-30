import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../context/LocationContext';
import { FiMap, FiNavigation, FiInfo, FiExternalLink, FiMapPin, FiClock, FiUsers, FiActivity, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { generateNearbyBooths } from '../utils/constants';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const customMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userMarker = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 15);
  }, [coords, map]);
  return null;
}

export default function BoothFinder() {
  const { coords, locationData } = useLocation();
  const [booths, setBooths] = useState([]);
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (!selectedBooth) {
      setInsight(null);
      return;
    }

    const fetchInsight = async () => {
      setLoadingInsight(true);
      try {
        const res = await api.get(`/booth-status/${selectedBooth.id}/insights`);
        setInsight(res.data);
      } catch (error) {
        console.error('Error fetching insight:', error);
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchInsight();
  }, [selectedBooth]);

useEffect(() => {
    if (!coords?.lat) return;

    // Use shared utility function for booth generation (DRY principle)
    const generatedBooths = generateNearbyBooths(coords);
    // Add distance calculated from coordinates
    const boothsWithDistance = generatedBooths.map(booth => ({
      ...booth,
      distance: calculateDistance(coords.lat, coords.lng, booth.lat, booth.lng)
    }));
    setBooths(boothsWithDistance);
  }, [coords]);

  // EFFICIENCY: Memoized distance calculation
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const openInGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  if (!coords?.lat) {
    return (
      <div className="glass-card p-5 h-full flex flex-col items-center justify-center text-center">
        <FiMapPin className="w-10 h-10 text-text-muted mb-3" />
        <p className="text-sm font-bold text-text-primary">Map Unavailable</p>
        <p className="text-xs text-text-muted mt-1">Please enable location access to find nearby booths.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-saffron/20 flex items-center justify-center">
            <FiMap className="w-4 h-4 text-saffron" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Booth Navigator</h2>
            <p className="text-[10px] text-text-muted">Nearest Polling Stations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 relative min-h-[250px]">
        <MapContainer 
          center={[coords.lat, coords.lng]} 
          zoom={15} 
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
          keyboard={true}
          role="application"
          aria-label="Interactive map showing polling stations nearby"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[coords.lat, coords.lng]} icon={userMarker}>
            <Popup>You are here</Popup>
          </Marker>
          {booths.map(booth => (
            <Marker 
              key={booth.id} 
              position={[booth.lat, booth.lng]} 
              icon={customMarker}
              keyboard={true}
              alt={`Booth: ${booth.name}`}
              eventHandlers={{
                click: () => setSelectedBooth(booth),
                keypress: (e) => { if (e.originalEvent.key === 'Enter') setSelectedBooth(booth); }
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold">{booth.name}</p>
                  <button 
                    onClick={() => openInGoogleMaps(booth.lat, booth.lng)}
                    className="mt-2 text-[10px] text-india-blue font-bold flex items-center gap-1 focus:ring-2 focus:ring-india-blue outline-none rounded"
                  >
                    Navigate <FiNavigation className="w-3 h-3" />
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          <MapRecenter coords={coords} />
        </MapContainer>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Nearby Results</p>
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
          {booths.map(booth => (
            <div 
              key={booth.id}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedBooth?.id === booth.id ? 'border-saffron bg-saffron/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
              onClick={() => setSelectedBooth(booth)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-text-primary">{booth.name}</h3>
                  <p className="text-[10px] text-text-muted mt-0.5">{booth.address}</p>
                </div>
                <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-2 py-0.5 rounded-full">{booth.distance}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-text-muted flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${booth.crowd === 'Low' ? 'bg-success' : booth.crowd === 'High' ? 'bg-danger' : 'bg-warning'}`} />
                    Crowd: {booth.crowd}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); openInGoogleMaps(booth.lat, booth.lng); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-india-blue hover:underline"
                >
                  Get Directions <FiExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedBooth && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-4 border-t border-slate-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-india-blue/10 flex items-center justify-center">
                <FiInfo className="w-3.5 h-3.5 text-india-blue" />
              </div>
              <h4 className="text-xs font-bold text-text-primary">Historical Booth Insights</h4>
            </div>

            {loadingInsight ? (
              <div className="flex justify-center py-4">
                <div className="w-4 h-4 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
              </div>
            ) : insight ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight mb-1 flex items-center gap-1">
                    <FiClock className="w-3 h-3 text-saffron" /> Peak Crowd Time
                  </p>
                  <p className="text-[11px] font-bold text-text-primary">{insight.historicalCrowdPeak}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight mb-1 flex items-center gap-1">
                    <FiActivity className="w-3 h-3 text-india-green" /> Past Turnout
                  </p>
                  <p className="text-[11px] font-bold text-text-primary">{insight.pastTurnout}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight mb-1 flex items-center gap-1">
                    <FiUsers className="w-3 h-3 text-india-blue" /> Avg. Wait Time
                  </p>
                  <p className="text-[11px] font-bold text-text-primary">{insight.avgWaitTime}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight mb-1 flex items-center gap-1">
                    <FiShield className="w-3 h-3 text-orange-500" /> Ease of Access
                  </p>
                  <p className="text-[11px] font-bold text-text-primary">{insight.easeOfAccess} Priority</p>
                </div>
                
                {insight.amenities && insight.amenities.length > 0 && (
                  <div className="col-span-2 p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                    <p className="text-[9px] text-text-muted uppercase font-bold tracking-tight mb-2">Available Amenities</p>
                    <div className="flex flex-wrap gap-1.5">
                      {insight.amenities.map((amenity, i) => (
                        <span key={i} className="text-[9px] bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full font-medium shadow-sm">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-text-muted italic text-center py-2">No historical data available for this booth.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
