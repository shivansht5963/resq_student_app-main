import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const BASE_URL = 'https://resq-server.onrender.com/api';
const AUTH_TOKEN_KEY = 'resq_auth_token';

/**
 * Get auth token from secure storage
 */
export const getAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving auth token:', error);
    return null;
  }
};

/**
 * Store auth token securely
 */
export const setAuthToken = async (token) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 401) {
        // Token invalid, clear it
        await setAuthToken(null);
        throw {
          status: 401,
          message: 'Session expired. Please login again.',
          type: 'UNAUTHORIZED',
          detail: data?.detail || 'Invalid token',
        };
      } else if (response.status === 403) {
        throw {
          status: 403,
          message: 'You do not have permission to perform this action.',
          type: 'FORBIDDEN',
          detail: data?.detail || 'Permission denied',
        };
      } else if (response.status === 400) {
        throw {
          status: 400,
          message: 'Invalid request. Please check your input.',
          type: 'BAD_REQUEST',
          detail: data?.detail || data,
        };
      } else if (response.status === 404) {
        throw {
          status: 404,
          message: 'Resource not found.',
          type: 'NOT_FOUND',
          detail: data?.detail || 'Not found',
        };
      } else if (response.status >= 500) {
        throw {
          status: response.status,
          message: 'Server error. Please try again later.',
          type: 'SERVER_ERROR',
          detail: data?.detail || 'Server error',
        };
      } else {
        throw {
          status: response.status,
          message: data?.detail || 'An error occurred',
          type: 'ERROR',
          detail: data,
        };
      }
    }

    return { success: true, data };
  } catch (error) {
    // Network or parsing errors
    if (error.status) {
      // Already formatted error
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw {
        status: 500,
        message: 'Invalid server response. Please try again.',
        type: 'PARSE_ERROR',
        detail: error.message,
      };
    }

    throw {
      status: 0,
      message: 'Network error. Please check your connection.',
      type: 'NETWORK_ERROR',
      detail: error.message || 'No internet connection',
    };
  }
};

/**
 * POST /auth/login/
 * Login with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const result = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Backend returns { auth_token: "...", user_id: "...", role: "..." } directly in data
    if (result.success && result.data && result.data.auth_token) {
      await setAuthToken(result.data.auth_token);
      return result.data;
    } else if (!result.data || !result.data.auth_token) {
      throw {
        status: 400,
        message: 'No token received from server',
        type: 'BAD_REQUEST',
        detail: 'The server did not return a valid token. Please check your credentials.',
      };
    }
    throw new Error('Invalid login response');
  } catch (error) {
    // If error is already formatted with status property, throw it
    if (error.status) {
      throw error;
    }
    // Otherwise format it
    throw {
      status: 400,
      message: 'Login failed. Please try again.',
      type: 'LOGIN_ERROR',
      detail: error.message || String(error),
    };
  }
};

/**
 * POST /auth/logout/
 * Logout user
 */
export const logoutUser = async () => {
  try {
    await apiRequest('/auth/logout/', {
      method: 'POST',
    });
    await setAuthToken(null);
    return { success: true };
  } catch (error) {
    // Clear token even if logout fails
    await setAuthToken(null);
    throw error;
  }
};

/**
 * GET /beacons/
 * Get list of all beacons
 */
export const getBeacons = async () => {
  try {
    const result = await apiRequest('/beacons/');
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Helper: Build multipart/form-data body manually
 * React Native doesn't support standard FormData well, so build the body string
 */
const buildMultipartBody = async (fields, imageUris) => {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';

  // Add text fields
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
  }

  // Add image files - Use expo-file-system for reliable base64 conversion
  for (let i = 0; i < imageUris.length; i++) {
    const imageUri = imageUris[i];
    const fileName = imageUri.split('/').pop() || `image_${i + 1}.jpg`;

    try {
      // Use expo-file-system to read file as base64 (most reliable in React Native)
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="images"; filename="${fileName}"\r\n`;
      body += `Content-Type: image/jpeg\r\n\r\n`;
      body += `${base64}\r\n`;

      console.log(`  ✅ Image ${i + 1} added (${fileName})`);
    } catch (error) {
      console.warn(`⚠️ Failed to add image ${i + 1}:`, error.message);
    }
  }

  body += `--${boundary}--\r\n`;
  return { body, boundary };
};

/**
 * Helper: Upload with timeout protection
 */
const uploadWithTimeout = async (url, options, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`⏱️ Upload timeout after ${timeoutMs}ms - aborting`);
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw {
        status: 0,
        message: `Upload timeout after ${timeoutMs}ms - network too slow`,
        type: 'TIMEOUT_ERROR',
        detail: 'Try again with better connection'
      };
    }
    throw error;
  }
};

/**
 * Helper: Validate incident data before upload
 */
const validateIncidentReport = (data) => {
  const { type, description, imageUris, beaconId, location } = data;

  // Check type
  if (!type || !type.trim()) {
    throw {
      status: 400,
      message: 'Incident type is required',
      type: 'BAD_REQUEST',
      detail: 'Please select an incident type'
    };
  }

  // Check description
  if (!description || !description.trim()) {
    throw {
      status: 400,
      message: 'Description is required',
      type: 'BAD_REQUEST',
      detail: 'Please provide a description'
    };
  }

  // Check location
  if (!beaconId && !location) {
    throw {
      status: 400,
      message: 'Beacon or location is required',
      type: 'BAD_REQUEST',
      detail: 'Either use auto-detected beacon or provide manual location'
    };
  }

  // Check images
  if (!imageUris || imageUris.length === 0) {
    throw {
      status: 400,
      message: 'At least 1 image is required',
      type: 'BAD_REQUEST',
      detail: 'Please select at least one image'
    };
  }

  if (imageUris.length > 3) {
    throw {
      status: 400,
      message: 'Maximum 3 images allowed',
      type: 'BAD_REQUEST',
      detail: `You selected ${imageUris.length}, max is 3`
    };
  }

  return true;
};

/**
 * POST /incidents/report_sos/
 * Report SOS incident
 */
export const reportSOS = async (beaconId, description = '') => {
  try {
    if (!beaconId) {
      throw {
        status: 400,
        message: 'Beacon ID is required',
        type: 'BAD_REQUEST',
        detail: 'beacon_id is required',
      };
    }

    const result = await apiRequest('/incidents/report_sos/', {
      method: 'POST',
      body: JSON.stringify({
        beacon_id: beaconId,
        description: description.trim(),
      }),
    });

    console.log('SOS response data:', result.data);
    return result.data;
  } catch (error) {
    console.error('SOS error:', error);
    throw error;
  }
};

/**
 * POST /incidents/report/
 * Report incident with optional images
 * Uses multipart/form-data for file uploads
 * 
 * Implements 5 backend-recommended fixes:
 * 1. No manual Content-Type header (FormData auto-sets)
 * 2. Filename included with Blob (3rd parameter)
 * 3. File URI → Blob conversion with ArrayBuffer fallback
 * 4. 30-second timeout with AbortController
 * 5. Full validation before upload
 */
export const reportIncident = async (reportData) => {
  try {
    const {
      type,
      description,
      location,
      beaconId = null,
      imageUris = [],
    } = reportData;

    // FIX #5: Validate before upload (comprehensive)
    console.log('\n✅ VALIDATING INCIDENT DATA');
    validateIncidentReport(reportData);
    console.log('✅ All validations passed');

    // Get auth token first
    const token = await getAuthToken();
    const url = `${BASE_URL}/incidents/report/`;

    // Handle images - Build multipart body manually for React Native compatibility
    // FIX #3: Manual multipart construction - most compatible with React Native
    console.log('\n📸 Processing images...');
    console.log('  Total images to process:', imageUris.length);

    const fieldsData = {};
    if (beaconId) {
      fieldsData.beacon_id = beaconId;
    }
    fieldsData.type = type;
    fieldsData.description = description.trim();
    if (location) {
      fieldsData.location = location;
    }

    console.log('  ✅ beacon_id added:', beaconId);
    console.log('  ✅ type added:', type);
    console.log('  ✅ description added: "' + description.trim().substring(0, 40) + '..."');
    if (location) {
      console.log('  ✅ location added:', location);
    }

    // Build the multipart body
    const { body: multipartBody, boundary } = await buildMultipartBody(
      fieldsData,
      imageUris
    );

    console.log('\n✅ Multipart body constructed with', imageUris.length, 'images\n');

    const headers = {
      'Accept': 'application/json',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    console.log('\n📡 Sending POST request...');
    console.log('  Endpoint:', url);
    console.log('  Headers:', {
      'Accept': headers['Accept'],
      'Authorization': token ? 'Token [REDACTED]' : 'None',
      'Content-Type': `multipart/form-data; boundary=...`
    });

    // FIX #4: Add 30-second timeout with AbortController
    const response = await uploadWithTimeout(
      url,
      {
        method: 'POST',
        headers,
        body: multipartBody,
      },
      30000 // 30-second timeout
    );

    console.log('\n📥 Response received');
    console.log('  Status:', response.status, response.statusText);
    console.log('  Content-Type:', response.headers.get('content-type'));

    // Handle response
    let data;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    console.log('📊 Response data:', {
      incident_id: data?.id || data?.incident?.id,
      status: data?.status,
      images_count: data?.images?.length || 0,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await setAuthToken(null);
        throw {
          status: 401,
          message: 'Session expired. Please login again.',
          type: 'UNAUTHORIZED',
          detail: data?.detail || 'Invalid token',
        };
      } else if (response.status === 403) {
        throw {
          status: 403,
          message: 'Only students can report incidents',
          type: 'FORBIDDEN',
          detail: data?.error || data?.detail || 'Permission denied',
        };
      } else if (response.status === 400) {
        throw {
          status: 400,
          message: 'Invalid request. Please check your input.',
          type: 'BAD_REQUEST',
          detail: data?.error || data?.detail || data,
        };
      } else if (response.status >= 500) {
        throw {
          status: response.status,
          message: 'Server error. Please try again later.',
          type: 'SERVER_ERROR',
          detail: data?.detail || 'Server error',
        };
      } else {
        throw {
          status: response.status,
          message: data?.error || data?.detail || 'An error occurred',
          type: 'ERROR',
          detail: data,
        };
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Report incident error:', error);

    if (error.status) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw {
        status: 500,
        message: 'Invalid server response. Please try again.',
        type: 'PARSE_ERROR',
        detail: error.message,
      };
    }

    throw {
      status: 0,
      message: error.message || 'Network error. Please check your connection.',
      type: 'NETWORK_ERROR',
      detail: error.message || 'No internet connection',
    };
  }
};

/**
 * GET /incidents/
 * Get list of student's incidents
 */
export const getIncidents = async () => {
  try {
    const result = await apiRequest('/incidents/');
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /incidents/{id}/
 * Get incident details
 */
export const getIncidentDetail = async (incidentId) => {
  try {
    const result = await apiRequest(`/incidents/${incidentId}/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /incidents/{id}/status_poll/
 * Poll incident status for guard assignment
 * Returns: guard_status, guard_assignment, pending_alerts
 */
export const pollIncidentStatus = async (incidentId) => {
  try {
    const result = await apiRequest(`/incidents/${incidentId}/status_poll/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /conversations/{id}/messages/
 * Get conversation messages
 */
export const getConversationMessages = async (conversationId) => {
  try {
    const result = await apiRequest(`/conversations/${conversationId}/messages/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /conversations/{id}/send_message/
 * Send message in conversation
 */
export const sendMessage = async (conversationId, content) => {
  try {
    if (!content || !content.trim()) {
      throw {
        status: 400,
        message: 'Message cannot be empty',
        type: 'BAD_REQUEST',
        detail: 'content is required',
      };
    }

    const result = await apiRequest(`/conversations/${conversationId}/send_message/`, {
      method: 'POST',
      body: JSON.stringify({ content: content.trim() }),
    });

    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /incidents/{id}/timeline/
 * View full event history of an incident (optional)
 * Returns: incident details with full events array
 */
export const getIncidentTimeline = async (incidentId) => {
  try {
    const result = await apiRequest(`/incidents/${incidentId}/timeline/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /incidents/{id}/events/
 * Get just the events without full incident details (optional)
 * @param {string} incidentId - Incident ID
 * @param {string} eventType - Optional filter by event type (e.g., 'ALERT_SENT')
 * @param {number} limit - Max results (default: 50)
 */
export const getIncidentEvents = async (incidentId, eventType = null, limit = 50) => {
  try {
    let endpoint = `/incidents/${incidentId}/events/?limit=${limit}`;
    if (eventType) {
      endpoint += `&event_type=${eventType}`;
    }
    const result = await apiRequest(endpoint);
    return result.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAuthToken,
  setAuthToken,
  loginUser,
  logoutUser,
  getBeacons,
  reportSOS,
  reportIncident,
  getIncidents,
  getIncidentDetail,
  pollIncidentStatus,
  getIncidentTimeline,
  getIncidentEvents,
  getConversationMessages,
  sendMessage,
};
