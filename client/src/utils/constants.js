/**
 * Constants - VOTE-पथ 2.0
 * 
 * Centralized constants to DRY up the codebase
 * Follows Single Source of Truth pattern
 */

// Indian States - Single source for all state-related data
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Queue status mappings
export const QUEUE_STATUS = {
  empty: { label: 'Empty', time: '0-5 min', color: 'text-success' },
  short: { label: 'Short', time: '5-15 min', color: 'text-success' },
  moderate: { label: 'Moderate', time: '15-45 min', color: 'text-warning' },
  long: { label: 'Long', time: '45-90 min', color: 'text-danger' },
  extreme: { label: 'Extreme', time: '90+ min', color: 'text-danger font-black' }
};

// EVM Status configurations
export const EVM_STATUS = {
  working: { label: '✅ Working Smoothly', color: 'status-green' },
  glitch: { label: '⚠️ Minor Glitches', color: 'status-yellow' },
  down: { label: '❌ Completely Down', color: 'status-red' }
};

// Safety Status configurations
export const SAFETY_STATUS = {
  peaceful: { label: 'Peaceful Environment', badge: 'badge-safe' },
  tense: { label: 'Tense / Arguments', badge: 'badge-caution' },
  disrupted: { label: 'Disrupted / Policed', badge: 'badge-danger' }
};

// Chat Quick Actions - Centralized for consistency
export const QUICK_ACTIONS = [
  { label: '🪪 Check Voter ID', message: 'How can I check if my Voter ID (EPIC) is valid and what documents do I need?' },
  { label: '📋 Polling Process', message: 'Explain the step-by-step polling process at an Indian polling booth.' },
  { label: '⚖️ My Rights', message: 'What are my fundamental rights as a voter in India?' },
  { label: '🗳️ EVM Guide', message: 'How does the EVM machine work? How do I use VVPAT to verify my vote?' },
  { label: '📝 File Complaint', message: 'How do I file a complaint about electoral malpractice or booth irregularities?' },
  { label: '📮 Postal Ballot', message: 'Who is eligible for postal ballot voting and how do I apply?' }
];

// Initial Chat Messages
export const INITIAL_CHAT_MESSAGE = {
  role: 'model',
  text: 'Namaste! 🙏 I\'m VOTE-पथ AI, your non-partisan election guide. I can help you with voter ID verification, polling procedures, your rights as a voter, and more.\n\nHow can I assist you today?',
  isTyping: false
};

// AI System Instructions
export const SYSTEM_INSTRUCTION = `You are VoterPath AI, a neutral, non-partisan Indian election guide assistant. Your role is to help Indian citizens navigate the voting process with accurate, up-to-date information.

IMPORTANT RULES:
- NEVER express political opinions or party preferences.
- NEVER recommend candidates.
- Cite ECI (eci.gov.in) as the authority.
- Be concise and factual.`;

// API Endpoints - Single source of truth for routes
export const API_ENDPOINTS = {
  LOCATION: '/api/location',
  PULSE: '/api/pulse',
  BOOTH: '/api/booth-status',
  WEATHER: '/api/weather',
  CHAT: '/api/chat',
  LEADERS: '/api/leaders'
};

// Default locations for fallback
export const FALLBACK_LOCATIONS = [
  { id: 1, name: 'Government Primary School, East Wing', lat: 0.002, lng: 0.001, address: 'Sector 4, Near Community Center' },
  { id: 2, name: 'Community Hall, Block B', lat: -0.003, lng: -0.002, address: 'MG Road, Opposite Police Station' },
  { id: 3, name: 'St. Xaviers High School, Auditorium', lat: 0.001, lng: -0.004, address: 'Station Road, North Raipur' }
];

/**
 * Utility function to generate simulated booth data
 * @param {Object} coords - User coordinates {lat, lng}
 * @returns {Array} - Array of simulated booth objects
 */
export const generateNearbyBooths = (coords) => {
  if (!coords?.lat || !coords?.lng) return [];
  
  return FALLBACK_LOCATIONS.map(booth => ({
    ...booth,
    lat: coords.lat + booth.lat,
    lng: coords.lng + booth.lng,
    crowd: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)]
  }));
};

/**
 * Time ago utility for display
 * @param {string|Date} dateStr - Date string or Date object
 * @returns {string} - Human readable time difference
 */
export const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

// Validation schemas using Zod - Shared for consistency
export const VALIDATION_SCHEMAS = {
  ChatMessage: {
    message: { min: 1, max: 1000 },
    history: { optional: true }
  },
  BoothReport: {
    boothId: { min: 1, max: 50 },
    coordinates: { lat: { min: -90, max: 90 }, lng: { min: -180, max: 180 } },
    evmStatus: ['working', 'glitch', 'down'],
    queueLength: ['empty', 'short', 'moderate', 'long', 'extreme'],
    safetyStatus: ['peaceful', 'tense', 'disrupted'],
    description: { max: 500, optional: true },
    reporterName: { max: 100, optional: true }
  }
};

export default {
  INDIAN_STATES,
  QUEUE_STATUS,
  EVM_STATUS,
  SAFETY_STATUS,
  QUICK_ACTIONS,
  INITIAL_CHAT_MESSAGE,
  SYSTEM_INSTRUCTION,
  API_ENDPOINTS,
  FALLBACK_LOCATIONS,
  generateNearbyBooths,
  timeAgo,
  VALIDATION_SCHEMAS
};
