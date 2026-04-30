import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LocationProvider, useLocation } from './context/LocationContext'
import Dashboard from './components/Dashboard'
import Landing from './components/Landing'
import LocationError from './components/LocationError'
import './index.css'

function AppContent() {
  const { loading, error, locationData, setManualLocation, requestLocation } = useLocation();

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-mesh flex items-center justify-center">
          <div className="text-center animate-fade-in-up">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full gradient-saffron flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Locating You...</h2>
            <p className="text-text-secondary text-sm">VoterPath needs your location to personalize your experience</p>
          </div>
        </div>
      );
    }

    if (error && !locationData) {
      return <LocationError error={error} onManualLocation={setManualLocation} onRetry={requestLocation} />;
    }

    return <Dashboard />;
  };

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={renderDashboard()} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <LocationProvider>
        <AppContent />
      </LocationProvider>
    </Router>
  );
}

export default App
