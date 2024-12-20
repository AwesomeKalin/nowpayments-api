const crypto = require('crypto');
const { ERROR_CODES, PAYMENT_STATUSES } = require('./constants');

/**
 * Utility functions for NOWPayments API
 * @module utils
 */

/**
 * @typedef {import('../types').PaymentStatus} PaymentStatus
 * @typedef {import('../types/advanced').PaymentStatusExtended} PaymentStatusExtended
 */

const utils = {
  /**
   * Generate HMAC signature for data verification
   * @param {Object} data - Data to sign
   * @param {string} secret - Secret key
   * @returns {string} HMAC signature
   */
  generateSignature(data, secret) {
    const sortedData = this.sortObject(data);
    const dataString = JSON.stringify(sortedData);
    return crypto.createHmac('sha512', secret).update(dataString).digest('hex');
  },

  /**
   * Sort object keys recursively
   * @param {Object} obj - Object to sort
   * @returns {Object} Sorted object
   */
  sortObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = this.sortObject(obj[key]);
        return result;
      }, {});
  },

  /**
   * Format currency amount with proper decimals
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatCurrencyAmount(amount, currency) {
    const decimals = this.getCurrencyDecimals(currency);
    return amount.toFixed(decimals);
  },

  /**
   * Get currency decimals
   * @param {string} currency - Currency code
   * @returns {number} Number of decimal places
   */
  getCurrencyDecimals(currency) {
    const currencyDecimals = {
      BTC: 8,
      ETH: 18,
      USDT: 6,
      USDC: 6,
      default: 8
    };
    return currencyDecimals[currency] || currencyDecimals.default;
  },

  /**
   * Check if payment status is final
   * @param {PaymentStatus} payment - Payment object
   * @returns {boolean} Is status final
   */
  isPaymentStatusFinal(payment) {
    const finalStatuses = [
      PAYMENT_STATUSES.FINISHED,
      PAYMENT_STATUSES.FAILED,
      PAYMENT_STATUSES.REFUNDED,
      PAYMENT_STATUSES.EXPIRED
    ];
    return finalStatuses.includes(payment.payment_status);
  },

  /**
   * Parse API error response
   * @param {Object} error - Error object
   * @returns {Object} Parsed error details
   */
  parseAPIError(error) {
    return {
      code: error.response?.status || ERROR_CODES.API_ERROR,
      message: error.response?.data?.message || error.message,
      details: error.response?.data || null
    };
  },

  /**
   * Validate cryptocurrency address format
   * @param {string} address - Cryptocurrency address
   * @param {string} currency - Currency code
   * @returns {boolean} Is address valid
   */
  isValidCryptoAddress(address, currency) {
    const addressPatterns = {
      BTC: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{11,71}$/,
      ETH: /^0x[a-fA-F0-9]{40}$/,
      default: /.+/
    };
    const pattern = addressPatterns[currency] || addressPatterns.default;
    return pattern.test(address);
  },

  /**
   * Calculate payment expiration timestamp
   * @param {Date} createdAt - Payment creation date
   * @param {number} [expirationMinutes=60] - Expiration time in minutes
   * @returns {Date} Expiration date
   */
  calculatePaymentExpiration(createdAt, expirationMinutes = 60) {
    const expirationDate = new Date(createdAt);
    expirationDate.setMinutes(expirationDate.getMinutes() + expirationMinutes);
    return expirationDate;
  },

  /**
   * Generate unique order identifier
   * @param {string} [prefix='ORDER'] - Order ID prefix
   * @returns {string} Unique order ID
   */
  generateOrderId(prefix = 'ORDER') {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}_${timestamp}_${random}`;
  },

  /**
   * Convert payment status to extended format
   * @param {PaymentStatus} payment - Basic payment status
   * @returns {PaymentStatusExtended} Extended payment status
   */
  toExtendedPaymentStatus(payment) {
    return {
      ...payment,
      network: payment.pay_currency.toLowerCase(),
      riskScore: this.calculatePaymentRiskScore(payment),
      paymentExtraData: {
        processingTime: this.calculateProcessingTime(payment),
        isExpired: this.isPaymentExpired(payment),
        remainingTime: this.calculateRemainingTime(payment)
      }
    };
  },

  /**
   * Calculate payment risk score
   * @private
   * @param {PaymentStatus} payment - Payment object
   * @returns {number} Risk score (0-100)
   */
  calculatePaymentRiskScore(payment) {
    let score = 0;

    if (payment.actually_paid >= payment.pay_amount) {
      score += 50;
    }

    if (this.isPaymentStatusFinal(payment)) {
      score += 30;
    }

    if (!this.isPaymentExpired(payment)) {
      score += 20;
    }

    return score;
  },

  /**
   * Calculate payment processing time
   * @private
   * @param {PaymentStatus} payment - Payment object
   * @returns {number} Processing time in milliseconds
   */
  calculateProcessingTime(payment) {
    const created = new Date(payment.created_at);
    const updated = new Date(payment.updated_at);
    return updated.getTime() - created.getTime();
  },

  /**
   * Check if payment is expired
   * @private
   * @param {PaymentStatus} payment - Payment object
   * @returns {boolean} Is payment expired
   */
  isPaymentExpired(payment) {
    const expirationDate = this.calculatePaymentExpiration(payment.created_at);
    return new Date() > expirationDate;
  },

  /**
   * Calculate remaining payment time
   * @private
   * @param {PaymentStatus} payment - Payment object
   * @returns {number} Remaining time in milliseconds
   */
  calculateRemainingTime(payment) {
    const expirationDate = this.calculatePaymentExpiration(payment.created_at);
    const remaining = expirationDate.getTime() - Date.now();
    return Math.max(0, remaining);
  }
};

module.exports = utils;
