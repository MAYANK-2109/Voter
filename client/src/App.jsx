import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LocationProvider, useLocation } from './context/LocationContext'
import Dashboard from './components/Dashboard'
import Landing from './components/Landing'
import LocationError from './components/LocationError'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

/**
 * DashboardGuard Component
 * Quality: Extracted from AppContent to separate routing from conditional dashboard logic.
 * Accessibility: Added aria-label to the loading state.
 */
function DashboardGuard() {
  const { loading, error, locationData, setManualLocation, requestLocation } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full gradient-saffron flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" aria-label="Locating you, please wait" role="img">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Locating You...</h2>
          <p className="text-text-secondary text-sm mb-6">VOTE-पथ needs your location to personalize your experience</p>
          <button 
            type="button"
            onClick={() => setManualLocation('Raipur', 'Chhattisgarh')}
            className="text-xs font-bold text-india-blue hover:underline cursor-pointer"
          >
            Skip and use default location (Raipur)
          </button>
        </div>
      </div>
    );
  }

  if (error && !locationData) {
    return <LocationError error={error} onManualLocation={setManualLocation} onRetry={requestLocation} />;
  }

  return <Dashboard />;
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<DashboardGuard />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App
