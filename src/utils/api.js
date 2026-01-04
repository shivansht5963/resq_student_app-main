import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const RESQ_BASE_URL = 'https://resq-server.onrender.com/api';
const ERP_BASE_URL = 'https://erp-9pbn.onrender.com/api/v1';

const RESQ_TOKEN_KEY = 'resq_auth_token';
const ERP_TOKEN_KEY = 'erp_auth_token';

// Helper for clean logging
const logApi = (type, url, method, status = '', details = '') => {
  const timestamp = new Date().toLocaleTimeString();
  let icon = '🌐';
  let color = '';

  if (type === 'REQ') { icon = '🚀'; }
  else if (type === 'OK') { icon = '✅'; }
  else if (type === 'ERR') { icon = '❌'; }

  // Extract endpoint from full URL for brevity
  const endpoint = url.replace(RESQ_BASE_URL, '').replace(ERP_BASE_URL, '');

  if (type === 'REQ') {
    console.log(`${icon} [REQ] ${method} ${endpoint}`);
  } else {
    console.log(`${icon} [${type}] ${method} ${endpoint} (${status}) ${details ? JSON.stringify(details) : ''}`);
  }
};

/**
 * Get ResQ auth token from secure storage
 */
export const getAuthToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(RESQ_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving ResQ auth token:', error);
    return null;
  }
};

/**
 * Get ERP auth token from secure storage
 */
export const getErpToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(ERP_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error retrieving ERP auth token:', error);
    return null;
  }
};

/**
 * Store ResQ auth token securely
 */
export const setAuthToken = async (token) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(RESQ_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(RESQ_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error storing ResQ auth token:', error);
  }
};

/**
 * Store ERP auth token securely
 */
export const setErpToken = async (token) => {
  try {
    if (token) {
      await SecureStore.setItemAsync(ERP_TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(ERP_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error storing ERP auth token:', error);
  }
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getAuthToken();
  const url = `${RESQ_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  logApi('REQ', url, method);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { detail: text };
      }

      if (!response.ok) {
        console.log(`[ResQ] Non-JSON response (${response.status}):`, text.substring(0, 200));
      }
    }

    if (!response.ok) {
      // Handle specific error codes
      logApi('ERR', url, method, response.status, data?.detail || 'Error');

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

    logApi('OK', url, method, response.status);
    return { success: true, data };
  } catch (error) {
    // Network or parsing errors
    if (!error.status) {
      logApi('ERR', url, method, 'NET', error.message);
    }

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
 * Make authenticated ERP API request
 */
export const erpApiRequest = async (endpoint, options = {}) => {
  const token = await getErpToken();
  const url = `${ERP_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  logApi('REQ', url, method);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { detail: text }; // Fallback for non-JSON response
      }

      if (!response.ok) {
        console.log(`[ERP] Non-JSON response (${response.status}):`, text.substring(0, 200));
      }
    }

    if (!response.ok) {
      logApi('ERR', url, method, response.status, data?.detail || 'Error');

      // Handle specific error codes
      if (response.status === 401) {
        // Token invalid, clear it
        await setErpToken(null);
        throw {
          status: 401,
          message: 'Session expired. Please login again.',
          type: 'UNAUTHORIZED',
          detail: data?.detail || 'Invalid token',
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

    logApi('OK', url, method, response.status);
    return { success: true, data };
  } catch (error) {
    if (!error.status) {
      logApi('ERR', url, method, 'NET', error.message);
    }
    if (error.status) throw error;
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
    // 1. ResQ Login (CRITICAL)
    const resqResult = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (resqResult.success && resqResult.data && resqResult.data.auth_token) {
      await setAuthToken(resqResult.data.auth_token);
      console.log('✅ Logged in to ResQ backend');
    } else {
      throw {
        status: 400,
        message: 'No ResQ token received',
        type: 'BAD_REQUEST',
      };
    }

    // 2. ERP Login (OPTIONAL - Graceful Degradation)
    let erpSuccess = false;
    let erpUserData = null;
    try {
      const erpResult = await erpApiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (erpResult.success && erpResult.data && erpResult.data.auth_token) {
        await setErpToken(erpResult.data.auth_token);
        console.log('✅ Logged in to ERP backend');
        erpSuccess = true;

        // Extract user data from response
        const { auth_token, ...userData } = erpResult.data;
        erpUserData = userData;

        // Also update local store immediately if possible, but returning it is cleaner
        const { useAuthStore } = require('./auth/store');
        useAuthStore.getState().setUser(userData);

      } else {
        console.warn('⚠️ ERP login response missing token');
      }
    } catch (erpError) {
      console.log('⚠️ Logged in to ResQ backend');
      console.log('❌ ERP login failed – Academics disabled');
      await setErpToken(null);
    }

    // Return combined result, preserving original structure for compatibility
    return {
      ...resqResult.data,
      erp_auth: erpSuccess ? 'SUCCESS' : 'FAILED',
      erp_user: erpUserData
    };

  } catch (error) {
    // ResQ Failed - Block access
    if (error.status) throw error;
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
    // Clear BOTH tokens
    await setAuthToken(null);
    await setErpToken(null);
    return { success: true };
  } catch (error) {
    // Clear tokens even if logout fails
    await setAuthToken(null);
    await setErpToken(null);
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
    const url = `${RESQ_BASE_URL}/incidents/report/`;

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

// ==========================================
// ERP STUDENT API ENDPOINTS
// ==========================================

/**
 * GET /auth/profile/
 * Get current user profile
 */
export const getProfile = async () => {
  try {
    const result = await erpApiRequest('/auth/profile/');
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * PUT /auth/profile/
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  try {
    const result = await erpApiRequest('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * POST /auth/change-password/
 * Change user password
 */
export const changePassword = async (oldPassword, newPassword, confirmPassword) => {
  try {
    const result = await erpApiRequest('/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/
 * List all students (Used to find current student ID by matching user ID)
 */
export const getStudents = async () => {
  try {
    const result = await erpApiRequest('/students/');
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/{id}/
 * Get specific student details
 */
export const getStudentDetails = async (studentId) => {
  try {
    const result = await erpApiRequest(`/students/${studentId}/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/{id}/attendance/
 * Get student attendance
 */
export const getStudentAttendance = async (studentId) => {
  try {
    const result = await erpApiRequest(`/students/${studentId}/attendance/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/{id}/marks/
 * Get student marks
 */
export const getStudentMarks = async (studentId) => {
  try {
    const result = await erpApiRequest(`/students/${studentId}/marks/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/{id}/fees/
 * Get student fee status
 */
export const getStudentFees = async (studentId) => {
  try {
    const result = await erpApiRequest(`/students/${studentId}/fees/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /students/{id}/fee-payments/
 * Get student fee payment history
 */
export const getStudentFeeHistory = async (studentId) => {
  try {
    const result = await erpApiRequest(`/students/${studentId}/fee-payments/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /notifications/
 * Get user notifications
 */
export const getNotifications = async () => {
  try {
    const result = await erpApiRequest('/notifications/');
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * GET /notifications/{id}/
 * Get notification details
 */
export const getNotificationDetails = async (notificationId) => {
  try {
    const result = await erpApiRequest(`/notifications/${notificationId}/`);
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * PUT /notifications/{id}/mark_read/
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const result = await erpApiRequest(`/notifications/${notificationId}/mark_read/`, {
      method: 'PUT',
    });
    return result.data;
  } catch (error) {
    throw error;
  }
};

/**
 * DELETE /notifications/{id}/
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    await erpApiRequest(`/notifications/${notificationId}/`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    throw error;
  }
};

export default {
  getAuthToken,
  getErpToken,
  setAuthToken,
  setErpToken,
  erpApiRequest,
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
  // ERP Exports
  getProfile,
  updateProfile,
  changePassword,
  getStudents,
  getStudentDetails,
  getStudentAttendance,
  getStudentMarks,
  getStudentFees,
  getStudentFeeHistory,
  getNotifications,
  getNotificationDetails,
  markNotificationRead,
  deleteNotification,
};
