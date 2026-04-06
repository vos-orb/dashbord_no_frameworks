/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<any>} - API response
 */
export async function apiRequest(endpoint, options = {}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiTimeout = import.meta.env.VITE_API_TIMEOUT;
  const apiHeaders = JSON.parse(import.meta.env.VITE_API_HEADERS);
  const debug = (import.meta.env.VITE_DEBUG === 'true' || import.meta.env.VITE_DEBUG === true);
  if (debug) {
    console.log('apiRequest --- API URL:', apiUrl);
    console.log('apiRequest --- API TIMEOUT:', apiTimeout);
    console.log('apiRequest --- API HEADERS:', apiHeaders);
  }
  const url = `${apiUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiTimeout);

  const defaultOptions = {
    method: 'GET',
    headers: apiHeaders,
    signal: controller.signal
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Stringify body if it's an object and method is not GET
  if (mergedOptions.body && typeof mergedOptions.body === 'object' &&
    mergedOptions.method !== 'GET') {
    mergedOptions.body = JSON.stringify(mergedOptions.body);
  }

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse JSON, fall back to text if not JSON
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${apiTimeout}ms`);
    }
    throw error;
  }
}

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise<any>} - API response
 */
export async function getRequest(endpoint, params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiRequest(url, {
    method: 'GET'
  });
}

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<any>} - API response
 */
export async function postRequest(endpoint, data = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data
  });
}

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<any>} - API response
 */
export async function putRequest(endpoint, data = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: data
  });
}

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} - API response
 */
export async function deleteRequest(endpoint) {
  return apiRequest(endpoint, {
    method: 'DELETE'
  });
}
