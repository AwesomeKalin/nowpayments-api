const axios = require('axios');
const crypto = require('crypto');
const { RateLimiter } = require('limiter');
const { ValidationError, APIError } = require('./errors');
const schemas = require('./validation');
const constants = require('./constants');
const utils = require('./utils');

/**
 * NOWPayments API Client for cryptocurrency payment processing
 * @see {@link https://documenter.getpostman.com/view/7907941/2s93JusNJt API Documentation}
 *
 * @class NowPaymentsAPI
 * @typedef {import('../types').APIConfig} APIConfig
 * @typedef {import('../types').PaymentStatus} PaymentStatus
 * @typedef {import('../types').Currency} Currency
 * @typedef {import('../types').EstimatePrice} EstimatePrice
 * @typedef {import('../types').Invoice} Invoice
 * @typedef {import('../types').Payout} Payout
 * @typedef {import('../types').CreatePaymentParams} CreatePaymentParams
 * @typedef {import('../types').CreateInvoiceParams} CreateInvoiceParams
 * @typedef {import('../types').CreatePayoutParams} CreatePayoutParams
 * @typedef {import('../types').GetPaymentsParams} GetPaymentsParams
 * @typedef {import('../types').PaginationResponse} PaginationResponse
 * @typedef {import('../types').MinimumPaymentAmount} MinimumPaymentAmount
 * @typedef {import('../types/advanced').PaymentStatusExtended} PaymentStatusExtended
 * @typedef {import('../types/advanced').BatchPayoutParams} BatchPayoutParams
 * @typedef {import('../types/advanced').PaymentFlow} PaymentFlow
 */
class NowPaymentsAPI {
  /**
   * Creates a new NOWPayments API client instance
   * @param {APIConfig} config - API configuration options
   * @throws {ValidationError} When API key is missing
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new ValidationError('API key is required');
    }

    this.apiKey = config.apiKey;
    this.ipnSecret = config.ipnSecret;
    this.baseURL = config.sandbox
      ? constants.API_ENDPOINTS.SANDBOX
      : constants.API_ENDPOINTS.PRODUCTION;

    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute',
    });

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: constants.DEFAULT_CONFIG.TIMEOUT,
    });

    this._setupInterceptors();
  }

  /**
   * Setup axios interceptors for request/response handling
   * @private
   */
  _setupInterceptors() {
    this.client.interceptors.request.use(async config => {
      await this.rateLimiter.removeTokens(1);
      config.metadata = { startTime: Date.now() };
      return config;
    });

    this.client.interceptors.response.use(
      response => {
        const duration = Date.now() - response.config.metadata.startTime;
        this._logRequest(response.config, duration);
        return response;
      },
      error => {
        if (error.response) {
          throw new APIError(
            error.response.data.message,
            error.response.status,
            error.response.data
          );
        }
        throw error;
      }
    );
  }

  /**
   * Log API request details
   * @private
   * @param {Object} config - Request configuration
   * @param {number} duration - Request duration in ms
   */
  _logRequest(config, duration) {
    const { method, url } = config;
    console.log(`${method.toUpperCase()} ${url} - ${duration}ms`);
  }

  /**
   * Makes an API request with rate limiting
   * @private
   * @param {Object} config - Axios request configuration
   * @returns {Promise<any>} API response data
   * @throws {APIError} When request fails
   */
  async _makeRequest(config) {
    try {
      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new APIError(error.response.data.message, error.response.status, error.response.data);
      }
      throw error;
    }
  }

  /**
   * Retries failed requests with exponential backoff
   * @private
   * @param {Object} config - Request configuration
   * @param {number} [retries=3] - Maximum retry attempts
   * @returns {Promise<any>} API response data
   */
  async _retryRequest(config, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this._makeRequest(config);
      } catch (error) {
        if (attempt === retries || !this._isRetryable(error)) {
          throw error;
        }
        await this._sleep(
          constants.RETRY_CONFIG.INITIAL_DELAY *
            Math.pow(constants.RETRY_CONFIG.BACKOFF_FACTOR, attempt - 1)
        );
      }
    }
  }

  /**
   * Get API status
   * @returns {Promise<{message: string}>} API status response
   * @throws {APIError} When API request fails
   */
  async getStatus() {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: '/status',
    });
  }

  /**
   * Get list of available cryptocurrencies
   * @returns {Promise<Currency[]>} List of available currencies
   * @throws {APIError} When API request fails
   */
  async getCurrencies() {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: '/currencies',
    });
  }

  /**
   * Get estimated price for currency conversion
   * @param {Object} params - Estimation parameters
   * @param {number} params.amount - Amount to convert
   * @param {string} params.currency_from - Source currency code
   * @param {string} params.currency_to - Target currency code
   * @returns {Promise<EstimatePrice>} Price estimation
   * @throws {APIError} When API request fails
   */
  async getEstimatePrice(params) {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: '/estimate',
      params,
    });
  }

  /**
   * Create new cryptocurrency payment
   * @param {CreatePaymentParams} payment - Payment creation parameters
   * @returns {Promise<PaymentStatus>} Created payment details
   * @throws {ValidationError} When parameters are invalid
   * @throws {APIError} When API request fails
   */
  async createPayment(payment) {
    await this._validateSchema(payment, schemas.createPayment);
    return this._retryRequest({
      method: constants.HTTP_METHODS.POST,
      url: '/payment',
      data: payment,
    });
  }

  /**
   * Get payment status by ID
   * @param {string} paymentId - Payment identifier
   * @returns {Promise<PaymentStatus>} Payment status details
   * @throws {APIError} When payment not found or API error
   */
  async getPaymentStatus(paymentId) {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: `/payment/${paymentId}`,
    });
  }

  /**
   * Get minimum payment amount for currency
   * @param {string} currency - Currency code
   * @returns {Promise<MinimumPaymentAmount>} Minimum amount info
   * @throws {APIError} When API request fails
   */
  async getMinimumPaymentAmount(currency) {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: '/min-amount',
      params: { currency },
    });
  }

  /**
   * Create payment invoice
   * @param {CreateInvoiceParams} invoice - Invoice creation parameters
   * @returns {Promise<Invoice>} Created invoice details
   * @throws {ValidationError} When parameters are invalid
   * @throws {APIError} When API request fails
   */
  async createInvoice(invoice) {
    await this._validateSchema(invoice, schemas.createInvoice);
    return this._retryRequest({
      method: constants.HTTP_METHODS.POST,
      url: '/invoice',
      data: invoice,
    });
  }

  /**
   * Get payments list with pagination
   * @param {GetPaymentsParams} [params] - Query parameters
   * @returns {Promise<PaginationResponse<PaymentStatus>>} Paginated payments list
   * @throws {APIError} When API request fails
   */
  async getPayments(params = {}) {
    await this._validateSchema(params, schemas.getPayments);
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: '/payment',
      params,
    });
  }

  /**
   * Create cryptocurrency payout
   * @param {CreatePayoutParams} payout - Payout creation parameters
   * @returns {Promise<Payout>} Created payout details
   * @throws {ValidationError} When parameters are invalid
   * @throws {APIError} When API request fails
   */
  async createPayout(payout) {
    await this._validateSchema(payout, schemas.createPayout);
    return this._retryRequest({
      method: constants.HTTP_METHODS.POST,
      url: '/payout',
      data: payout,
    });
  }

  /**
   * Create batch cryptocurrency payout
   * @param {BatchPayoutParams} params - Batch payout parameters
   * @returns {Promise<Payout[]>} Created payouts details
   * @throws {ValidationError} When parameters are invalid
   * @throws {APIError} When API request fails
   */
  async createBatchPayout(params) {
    await this._validateSchema(params, schemas.createBatchPayout);
    return this._retryRequest({
      method: constants.HTTP_METHODS.POST,
      url: '/batch-payout',
      data: params,
    });
  }

  /**
   * Get detailed payment flow
   * @param {string} paymentId - Payment identifier
   * @returns {Promise<PaymentFlow>} Payment flow details
   * @throws {APIError} When payment not found or API error
   */
  async getPaymentFlow(paymentId) {
    return this._retryRequest({
      method: constants.HTTP_METHODS.GET,
      url: `/payment/${paymentId}/flow`,
    });
  }

  /**
   * Verify IPN callback signature
   * @param {Object} ipnData - IPN payload
   * @param {string} signature - X-NOWPayments-Sig header
   * @returns {boolean} Signature validity
   * @throws {Error} When IPN secret not configured
   */
  verifyIPN(ipnData, signature) {
    if (!this.ipnSecret) {
      throw new Error('IPN secret key is not configured');
    }
    return utils.generateSignature(ipnData, this.ipnSecret) === signature;
  }

  /**
   * Sleep utility for retry delay
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks if error is retryable
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} Whether error is retryable
   */
  _isRetryable(error) {
    return error.code === 429 || (error.code >= 500 && error.code <= 599);
  }

  /**
   * Validates request data against schema
   * @private
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @throws {ValidationError} When validation fails
   */
  async _validateSchema(data, schema) {
    try {
      await schema.validateAsync(data);
    } catch (error) {
      throw new ValidationError(error.message, error.details);
    }
  }
}

module.exports = NowPaymentsAPI;
