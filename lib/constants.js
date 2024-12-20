/**
 * API Constants and Configuration
 * @module constants
 */

const API_ENDPOINTS = {
  PRODUCTION: 'https://api.nowpayments.io/v1',
  SANDBOX: 'https://api-sandbox.nowpayments.io/v1'
};

const WEBSOCKET_ENDPOINTS = {
  PRODUCTION: 'wss://api.nowpayments.io/ws',
  SANDBOX: 'wss://api-sandbox.nowpayments.io/ws'
};

const HTTP_METHODS = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  PATCH: 'patch'
};

const PAYMENT_STATUSES = {
  WAITING: 'waiting',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  SENDING: 'sending',
  PARTIALLY_PAID: 'partially_paid',
  FINISHED: 'finished',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  EXPIRED: 'expired'
};

const PAYOUT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const WEBSOCKET_EVENTS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  PAYMENT_UPDATE: 'payment_update',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
  PONG: 'pong'
};

const DEFAULT_CONFIG = {
  TIMEOUT: 30000,
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    BURST: 20
  },
  RETRY: {
    MAX_RETRIES: 3,
    BACKOFF_FACTOR: 2,
    INITIAL_DELAY: 1000
  },
  WEBSOCKET: {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    PING_INTERVAL: 30000,
    PONG_TIMEOUT: 5000
  },
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 500
  }
};

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  WEBSOCKET_ERROR: 'WEBSOCKET_ERROR',
  MAX_RECONNECT_ERROR: 'MAX_RECONNECT_ERROR',
  MESSAGE_PARSE_ERROR: 'MESSAGE_PARSE_ERROR'
};

const SUPPORTED_CURRENCIES = {
  FIAT: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR'],
  CRYPTO: ['BTC', 'ETH', 'USDT', 'BNB', 'USDC', 'XRP', 'ADA', 'DOGE', 'SOL']
};

const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet'
};

module.exports = {
  API_ENDPOINTS,
  WEBSOCKET_ENDPOINTS,
  HTTP_METHODS,
  PAYMENT_STATUSES,
  PAYOUT_STATUSES,
  WEBSOCKET_EVENTS,
  DEFAULT_CONFIG,
  ERROR_CODES,
  SUPPORTED_CURRENCIES,
  NETWORK_TYPES
};
