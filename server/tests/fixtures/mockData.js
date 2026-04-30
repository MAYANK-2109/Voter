/**
 * Test Fixtures - VOTE-पथ 2.0
 * 
 * Centralized mock data for testing
 * Provides realistic test scenarios including edge cases
 */

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Valid booth report for testing
const validBoothReport = {
  boothId: 'BP001',
  location: { lat: 28.6139, lng: 77.2090 }, // Delhi
  city: 'New Delhi',
  state: 'Delhi',
  evmStatus: 'working',
  queueLength: 'moderate',
  safetyStatus: 'peaceful',
  reporterName: 'Test User',
  description: 'Testing the reporting system'
};

// Invalid booth reports for validation testing
const invalidBoothReports = [
  {
    name: 'Empty booth ID',
    data: { ...validBoothReport, boothId: '' },
    error: 'boothId'
  },
  {
    name: 'Invalid coordinates - lat too high',
    data: { ...validBoothReport, location: { lat: 100, lng: 77 } },
    error: 'location.lat'
  },
  {
    name: 'Invalid coordinates - lng too low',
    data: { ...validBoothReport, location: { lat: 28, lng: -200 } },
    error: 'location.lng'
  },
  {
    name: 'Invalid EVM status',
    data: { ...validBoothReport, evmStatus: 'invalid_status' },
    error: 'evmStatus'
  },
  {
    name: 'Message too long (XSS attempt)',
    data: { ...validBoothReport, description: '<script>alert("xss")</script>' },
    error: 'sanitization'
  }
];

// Boundary value test cases
const boundaryTestCases = {
  boothId: {
    min: '', // Empty - should fail
    max: 'A'.repeat(51), // Too long - should fail
    valid: 'A'.repeat(50) // Exactly max - should pass
  },
  description: {
    empty: '', // Empty - should pass (optional)
    max: 'A'.repeat(501), // Too long - should fail
    valid: 'A'.repeat(500) // Exactly max - should pass
  }
};

// Valid chat messages
const validChatMessages = [
  { name: 'Voter ID query', message: 'How do I check if my Voter ID is valid?' },
  { name: 'Polling process', message: 'Explain the voting process step by step' },
  { name: 'EVM question', message: 'How does the EVM machine work?' },
  { name: 'Rights query', message: 'What are my rights as a voter?' }
];

// Invalid chat messages for validation
const invalidChatMessages = [
  { name: 'Empty message', data: {}, error: 'message' },
  { name: 'Message too long', data: { message: 'A'.repeat(1001) }, error: 'message' },
  { name: 'Non-string message', data: { message: 12345 }, error: 'message' }
];

// XSS attempt test cases
const xssTestCases = [
  { name: 'Script tag', input: '<script>alert("xss")</script>' },
  { name: 'JavaScript URI', input: 'javascript:alert("xss")' },
  { name: 'Img onerror', input: '<img src=x onerror=alert(1)>' },
  { name: 'SVG payload', input: '<svg/onload=alert(1)>' },
  { name: 'Nested script', input: '<div><script>alert(1)</script></div>' },
  { name: 'Event handler', input: 'onmouseover=alert(1)' }
];

// SQL injection attempt test cases
const sqlInjectionCases = [
  { name: "OR '1'='1'", input: "'; OR '1'='1'--" },
  { name: 'UNION attack', input: "'; UNION SELECT * FROM users--" },
  { name: 'DROP table', input: "'; DROP TABLE booths;--" }
];

// Location test cases
const validLocations = [
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, city: 'New Delhi', state: 'Delhi' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, city: 'Mumbai', state: 'Maharashtra' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, city: 'Bangalore', state: 'Karnataka' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, city: 'Chennai', state: 'Tamil Nadu' }
];

const invalidLocations = [
  { name: 'Out of bounds lat', lat: 100, lng: 77 },
  { name: 'Out of bounds lng', lat: 28, lng: 200 },
  { name: 'Negative lat', lat: -100, lng: 77 },
  { name: 'Negative lng', lat: 28, lng: -200 }
];

module.exports = {
  INDIAN_STATES,
  validBoothReport,
  invalidBoothReports,
  boundaryTestCases,
  validChatMessages,
  invalidChatMessages,
  xssTestCases,
  sqlInjectionCases,
  validLocations,
  invalidLocations
};
