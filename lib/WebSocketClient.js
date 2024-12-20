const WebSocket = require('ws');
const EventEmitter = require('events');
const constants = require('./constants');

/**
 * NOWPayments WebSocket client for real-time payment updates
 * @class NOWPaymentsWebSocket
 * @extends EventEmitter
 * @typedef {import('../types/websocket').WebSocketOptions} WebSocketOptions
 * @typedef {import('../types/websocket').PaymentUpdateEvent} PaymentUpdateEvent
 * @typedef {import('../types/websocket').WebSocketError} WebSocketError
 * @typedef {import('../types/websocket').ConnectionState} ConnectionState
 */
class NOWPaymentsWebSocket extends EventEmitter {
  /**
   * Creates WebSocket client instance
   * @param {string} apiKey - NOWPayments API key
   * @param {WebSocketOptions} [options] - Client configuration options
   */
  constructor(apiKey, options = {}) {
    super();
    this.apiKey = apiKey;
    this.options = {
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      pingInterval: options.pingInterval || 30000,
      pongTimeout: options.pongTimeout || 5000,
      endpoint: options.endpoint || constants.WEBSOCKET_ENDPOINTS.PRODUCTION
    };

    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.lastPing = null;
    this.pongTimeout = null;
    this.pingInterval = null;
    this.reconnectTimer = null;
  }

  /**
   * Establishes WebSocket connection
   * @fires NOWPaymentsWebSocket#connected
   * @fires NOWPaymentsWebSocket#disconnected
   * @fires NOWPaymentsWebSocket#payment_update
   * @fires NOWPaymentsWebSocket#error
   */
  connect() {
    if (this.ws) {
      this.close();
    }

    this.ws = new WebSocket(this.options.endpoint, {
      headers: {
        'x-api-key': this.apiKey
      },
      handshakeTimeout: 10000
    });

    this._setupEventHandlers();
    this._startPingPong();
  }

  /**
   * Setup WebSocket event handlers
   * @private
   */
  _setupEventHandlers() {
    this.ws.on('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.ws.on('message', data => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'payment_update') {
          this.emit('payment_update', message);
        }
      } catch (error) {
        this.emit('error', this._createError('MessageParseError', error.message));
      }
    });

    this.ws.on('pong', () => {
      clearTimeout(this.pongTimeout);
      const latency = Date.now() - this.lastPing;
      this.emit('pong', latency);
    });

    this.ws.on('close', (code, reason) => {
      this._handleDisconnect(code, reason.toString());
    });

    this.ws.on('error', error => {
      this.emit('error', this._createError('WebSocketError', error.message));
    });
  }

  /**
   * Starts ping/pong heartbeat
   * @private
   */
  _startPingPong() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.lastPing = Date.now();
        this.ws.ping();

        this.pongTimeout = setTimeout(() => {
          this._handleDisconnect(1001, 'Pong timeout');
        }, this.options.pongTimeout);
      }
    }, this.options.pingInterval);
  }

  /**
   * Handles WebSocket disconnection
   * @private
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  _handleDisconnect(code, reason) {
    this.isConnected = false;
    clearInterval(this.pingInterval);
    clearTimeout(this.pongTimeout);

    this.emit('disconnected', reason);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      this.emit('reconnecting', this.reconnectAttempts);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.emit(
        'error',
        this._createError('MaxReconnectError', 'Maximum reconnection attempts reached')
      );
    }
  }

  /**
   * Creates WebSocket error object
   * @private
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @returns {WebSocketError} WebSocket error
   */
  _createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  /**
   * Closes WebSocket connection
   */
  close() {
    clearInterval(this.pingInterval);
    clearTimeout(this.pongTimeout);
    clearTimeout(this.reconnectTimer);

    if (this.ws) {
      this.ws.removeAllListeners();
      if ([WebSocket.OPEN, WebSocket.CONNECTING].includes(this.ws.readyState)) {
        this.ws.close(1000, 'Client closed connection');
      }
      this.ws = null;
    }

    this.isConnected = false;
  }

  /**
   * Gets current connection state
   * @returns {ConnectionState} Connection state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      lastConnected: this.lastPing ? new Date(this.lastPing) : undefined,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

module.exports = NOWPaymentsWebSocket;
