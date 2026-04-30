import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../context/LocationContext';
import { FiMap, FiNavigation, FiInfo, FiExternalLink, FiMapPin } from 'react-icons/fi';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (!coords?.lat) return;

    // Simulate nearby booths based on user location
    const simulatedBooths = [
      {
        id: 1,
        name: 'Government Primary School, East Wing',
        lat: coords.lat + 0.002,
        lng: coords.lng + 0.001,
        distance: '450m',
        crowd: 'Moderate',
        address: 'Sector 4, Near Community Center'
      },
      {
        id: 2,
        name: 'Community Hall, Block B',
        lat: coords.lat - 0.003,
        lng: coords.lng - 0.002,
        distance: '850m',
        crowd: 'High',
        address: 'MG Road, Opposite Police Station'
      },
      {
        id: 3,
        name: 'St. Xaviers High School, Auditorium',
        lat: coords.lat + 0.001,
        lng: coords.lng - 0.004,
        distance: '1.2km',
        crowd: 'Low',
        address: 'Station Road, North Raipur'
      }
    ];
    setBooths(simulatedBooths);
  }, [coords]);

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
              eventHandlers={{
                click: () => setSelectedBooth(booth)
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold">{booth.name}</p>
                  <button 
                    onClick={() => openInGoogleMaps(booth.lat, booth.lng)}
                    className="mt-2 text-[10px] text-india-blue font-bold flex items-center gap-1"
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
    </div>
  );
}
