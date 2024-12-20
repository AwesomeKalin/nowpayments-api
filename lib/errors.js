/**
 * Custom error classes for NOWPayments API
 * @module errors
 */

/**
 * Base error class for NOWPayments API errors
 * @class NOWPaymentsError
 * @extends Error
 */
class NOWPaymentsError extends Error {
  /**
   * Creates a base error instance
   * @param {string} message - Error message
   * @param {string|number} code - Error code
   * @param {*} [data] - Additional error data
   */
  constructor(message, code, data) {
    super(message);
    this.name = 'NOWPaymentsError';
    this.code = code;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns string representation of the error
   * @returns {string} Error string representation
   */
  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  /**
   * Returns JSON representation of the error
   * @returns {Object} Error JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
}

/**
 * API error class for HTTP request failures
 * @class APIError
 * @extends NOWPaymentsError
 */
class APIError extends NOWPaymentsError {
  /**
   * Creates an API error instance
   * @param {string} message - API error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [responseData] - API response data
   */
  constructor(message, statusCode, responseData) {
    super(message, statusCode, responseData);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

/**
 * Validation error class for schema validation failures
 * @class ValidationError
 * @extends NOWPaymentsError
 */
class ValidationError extends NOWPaymentsError {
  /**
   * Creates a validation error instance
   * @param {string} message - Validation error message
   * @param {Object} [details] - Validation error details
   */
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * WebSocket error class for connection failures
 * @class WebSocketError
 * @extends NOWPaymentsError
 */
class WebSocketError extends NOWPaymentsError {
  /**
   * Creates a WebSocket error instance
   * @param {string} message - WebSocket error message
   * @param {string} code - WebSocket error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, code, details) {
    super(message, code, details);
    this.name = 'WebSocketError';
  }
}

module.exports = {
  NOWPaymentsError,
  APIError,
  ValidationError,
  WebSocketError
};
