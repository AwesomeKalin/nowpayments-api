const Joi = require('joi');

/**
 * Validation schemas for API requests
 * @module validation
 */

const schemas = {
  /**
   * Payment creation validation schema
   */
  createPayment: Joi.object({
    price_amount: Joi.number().required().positive(),
    price_currency: Joi.string().required().uppercase().min(2).max(10),
    pay_currency: Joi.string().required().uppercase().min(2).max(10),
    ipn_callback_url: Joi.string().uri().optional(),
    order_id: Joi.string().max(256).optional(),
    order_description: Joi.string().max(1024).optional(),
    is_fixed_rate: Joi.boolean().optional(),
    is_fee_paid_by_user: Joi.boolean().optional(),
    purchase_id: Joi.string().max(256).optional(),
    payout_address: Joi.string().max(256).optional(),
    payout_currency: Joi.string().uppercase().min(2).max(10).optional(),
    payout_extra_id: Joi.string().max(256).optional(),
    fixed_rate: Joi.boolean().optional()
  }).required(),

  /**
   * Invoice creation validation schema
   */
  createInvoice: Joi.object({
    price_amount: Joi.number().required().positive(),
    price_currency: Joi.string().required().uppercase().min(2).max(10),
    order_id: Joi.string().max(256).optional(),
    order_description: Joi.string().max(1024).optional(),
    ipn_callback_url: Joi.string().uri().optional(),
    success_url: Joi.string().uri().optional(),
    cancel_url: Joi.string().uri().optional(),
    is_fixed_rate: Joi.boolean().optional(),
    is_fee_paid_by_user: Joi.boolean().optional(),
    payment_currency: Joi.string().uppercase().min(2).max(10).optional()
  }).required(),

  /**
   * Payout creation validation schema
   */
  createPayout: Joi.object({
    address: Joi.string().required().max(256),
    amount: Joi.number().required().positive(),
    currency: Joi.string().required().uppercase().min(2).max(10),
    ipn_callback_url: Joi.string().uri().optional(),
    extra_id: Joi.string().max(256).optional(),
    fee_payer: Joi.string().valid('sender', 'receiver').optional()
  }).required(),

  /**
   * Batch payout validation schema
   */
  createBatchPayout: Joi.object({
    payouts: Joi.array()
      .items(
        Joi.object({
          address: Joi.string().required().max(256),
          amount: Joi.number().required().positive(),
          currency: Joi.string().required().uppercase().min(2).max(10),
          extra_id: Joi.string().max(256).optional()
        })
      )
      .min(1)
      .max(100)
      .required(),
    processingMode: Joi.string().valid('sequential', 'parallel').default('sequential'),
    failureMode: Joi.string().valid('continue', 'stop').default('stop')
  }).required(),

  /**
   * Payment list query parameters validation schema
   */
  getPayments: Joi.object({
    limit: Joi.number().integer().min(1).max(500).optional(),
    page: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().valid('created_at', 'payment_status').optional(),
    orderBy: Joi.string().valid('asc', 'desc').optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().optional(),
    status: Joi.string()
      .valid(
        'waiting',
        'confirming',
        'confirmed',
        'sending',
        'partially_paid',
        'finished',
        'failed',
        'refunded',
        'expired'
      )
      .optional()
  }).optional(),

  /**
   * Estimate price validation schema
   */
  estimatePrice: Joi.object({
    amount: Joi.number().required().positive(),
    currency_from: Joi.string().required().uppercase().min(2).max(10),
    currency_to: Joi.string().required().uppercase().min(2).max(10),
    from_network: Joi.string().optional(),
    to_network: Joi.string().optional()
  }).required(),

  /**
   * IPN callback data validation schema
   */
  ipnCallback: Joi.object({
    payment_id: Joi.string().required(),
    payment_status: Joi.string().required(),
    pay_address: Joi.string().required(),
    price_amount: Joi.number().required(),
    price_currency: Joi.string().required(),
    pay_amount: Joi.number().required(),
    actually_paid: Joi.number().required(),
    pay_currency: Joi.string().required(),
    order_id: Joi.string().allow('').optional(),
    order_description: Joi.string().allow('').optional(),
    purchase_id: Joi.string().allow('').optional(),
    created_at: Joi.date().iso().required(),
    updated_at: Joi.date().iso().required(),
    outcome_amount: Joi.number().optional(),
    outcome_currency: Joi.string().optional()
  }).required()
};

module.exports = schemas;
