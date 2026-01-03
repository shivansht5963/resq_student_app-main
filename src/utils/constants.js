/**
 * API Configuration and Constants
 * Based on STUDENT_APP_FRONTEND_GUIDE.md
 */

export const API_CONFIG = {
  BASE_URL: 'https://resq-server.onrender.com/api',
  TIMEOUT: 30000, // 30 seconds
};

export const POLLING_INTERVALS = {
  INCIDENT: 5000, // 5 seconds - Poll incident status
  MESSAGE: 3000, // 3 seconds - Poll messages during chat
  INCIDENTS_LIST: 30000, // 30 seconds - Poll incidents list
};

export const INCIDENT_STATUS = {
  CREATED: 'CREATED', // Incident reported, waiting for guards
  ASSIGNED: 'ASSIGNED', // Guard accepted the alert
  IN_PROGRESS: 'IN_PROGRESS', // Guard is on the way or with student
  RESOLVED: 'RESOLVED', // Guard completed the incident
};

export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED', // 401
  FORBIDDEN: 'FORBIDDEN', // 403
  BAD_REQUEST: 'BAD_REQUEST', // 400
  NOT_FOUND: 'NOT_FOUND', // 404
  SERVER_ERROR: 'SERVER_ERROR', // 5xx
  PARSE_ERROR: 'PARSE_ERROR',
  ERROR: 'ERROR',
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// BLE Configuration
export const BLE_CONFIG = {
  SCAN_TIMEOUT: 10000, // 10 seconds
  RSSI_THRESHOLD: -85, // Signal strength threshold
  FALLBACK_BEACON_ID: '550e8400-e29b-41d4-a716-446655441111',
};

export const AUTH_TOKEN_KEY = 'resq_auth_token';

// Status descriptions for UI
export const STATUS_DESCRIPTIONS = {
  CREATED: 'Incident reported. Waiting for security response...',
  ASSIGNED: 'Security team assigned to your incident.',
  IN_PROGRESS: 'Security is on the way to your location.',
  RESOLVED: 'Incident has been resolved.',
};

// Status colors for UI
export const STATUS_COLORS = {
  CREATED: '#F59E0B', // Amber
  ASSIGNED: '#3B82F6', // Blue
  IN_PROGRESS: '#EF4444', // Red
  RESOLVED: '#10B981', // Green
};

export default {
  API_CONFIG,
  POLLING_INTERVALS,
  INCIDENT_STATUS,
  ERROR_TYPES,
  HTTP_STATUS_CODES,
  BLE_CONFIG,
  AUTH_TOKEN_KEY,
  STATUS_DESCRIPTIONS,
  STATUS_COLORS,
};
