/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {Promise<any>} - API response
 */
export async function apiRequest(endpoint, options = {}) {
  const apiUrl = (options.uri === 2) ? import.meta.env.VITE_API_URL_2 : import.meta.env.VITE_API_URL;
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
    signal: controller.signal,
    uri: ''
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
 * WebSocket connection manager
 */
class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Connect to WebSocket
   * @param {string} url - WebSocket URL
   * @param {object} options - Connection options
   * @param {Function} onMessage - Message handler
   * @param {Function} onOpen - Open handler
   * @param {Function} onClose - Close handler
   * @param {Function} onError - Error handler
   * @returns {WebSocket} - WebSocket connection
   */
  connect(url, {
    onMessage = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {},
    reconnect = true,
    protocols = []
  } = {}) {
    if (this.connections.has(url)) {
      return this.connections.get(url);
    }

    const ws = new WebSocket(url, protocols);

    ws.onopen = () => {
      this.reconnectAttempts.delete(url);
      onOpen(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data, ws);
      } catch (e) {
        onMessage(event.data, ws);
      }
    };

    ws.onclose = (event) => {
      this.connections.delete(url);
      onClose(event, ws);

      if (reconnect && this.reconnectAttempts.get(url) < this.maxReconnectAttempts) {
        const attempts = this.reconnectAttempts.get(url) || 0;
        this.reconnectAttempts.set(url, attempts + 1);

        setTimeout(() => {
          this.connect(url, {
            onMessage,
            onOpen,
            onClose,
            onError,
            reconnect,
            protocols
          });
        }, this.reconnectDelay * (attempts + 1));
      }
    };

    ws.onerror = (error) => {
      onError(error, ws);
    };

    this.connections.set(url, ws);
    return ws;
  }

  /**
   * Disconnect from WebSocket
   * @param {string} url - WebSocket URL
   */
  disconnect(url) {
    if (this.connections.has(url)) {
      const ws = this.connections.get(url);
      ws.close();
      this.connections.delete(url);
      this.reconnectAttempts.delete(url);
    }
  }

  /**
   * Send message through WebSocket
   * @param {string} url - WebSocket URL
   * @param {any} message - Message to send
   */
  send(url, message) {
    if (this.connections.has(url)) {
      const ws = this.connections.get(url);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        throw new Error('WebSocket is not open');
      }
    } else {
      throw new Error('WebSocket connection not found');
    }
  }

  /**
   * Check if WebSocket is connected
   * @param {string} url - WebSocket URL
   * @returns {boolean} - Connection status
   */
  isConnected(url) {
    if (this.connections.has(url)) {
      const ws = this.connections.get(url);
      return ws.readyState === WebSocket.OPEN;
    }
    return false;
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise<any>} - API response
 */
export async function getRequest(endpoint, params = {}, opts= {}) {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiRequest(url, {
    method: 'GET',
    ...opts
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
