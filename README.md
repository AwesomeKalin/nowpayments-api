# NOWPayments API Client

Node.js client for the NOWPayments cryptocurrency payment processing API with WebSocket support.

[![npm version](https://badge.fury.io/js/nowpayments-api.svg)](https://badge.fury.io/js/nowpayments-api)

## Features

- Complete TypeScript support
- Real-time payment updates via WebSocket
- Automatic retry mechanism
- Rate limiting
- Comprehensive validation
- IPN verification
- Sandbox environment support

## Installation

```bash
npm install nowpayments-api
```

## Quick Start

```javascript
const NowPaymentsAPI = require('nowpayments-api');

const api = new NowPaymentsAPI({
  apiKey: 'YOUR_API_KEY',
  sandbox: true // Use sandbox environment
});

// Create payment
const payment = await api.createPayment({
  price_amount: 100,
  price_currency: 'USD',
  pay_currency: 'BTC'
});

// Get payment status
const status = await api.getPaymentStatus(payment.payment_id);
```

## WebSocket Usage

```javascript
const { NOWPaymentsWebSocket } = require('nowpayments-api');

const ws = new NOWPaymentsWebSocket('YOUR_API_KEY', {
  maxReconnectAttempts: 5,
  reconnectDelay: 1000
});

ws.on('connected', () => {
  console.log('WebSocket connected');
});

ws.on('payment_update', event => {
  console.log('Payment updated:', event.data);
});

ws.connect();
```

## API Documentation

### Configuration

```javascript
const api = new NowPaymentsAPI({
  apiKey: 'YOUR_API_KEY', // Required
  ipnSecret: 'YOUR_SECRET', // Optional: For IPN verification
  sandbox: false // Optional: Use production environment
});
```

### Available Methods

#### Payments

- `createPayment(params)`: Create new payment
- `getPaymentStatus(id)`: Get payment status
- `getPayments(params)`: List payments
- `getMinimumPaymentAmount(currency)`: Get minimum payment amount

#### Invoices

- `createInvoice(params)`: Create payment invoice

#### Currencies

- `getCurrencies()`: Get available cryptocurrencies
- `getEstimatePrice(params)`: Get estimated price

#### Payouts

- `createPayout(params)`: Create cryptocurrency payout

#### Other

- `getStatus()`: Check API status
- `verifyIPN(data, signature)`: Verify IPN callback

### Error Handling

```javascript
try {
  const payment = await api.createPayment({
    price_amount: 100,
    price_currency: 'USD',
    pay_currency: 'BTC'
  });
} catch (error) {
  if (error instanceof api.ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof api.APIError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.code);
  }
}
```

### TypeScript Support

```typescript
import NowPaymentsAPI, { CreatePaymentParams, PaymentStatus } from 'nowpayments-api';

const api = new NowPaymentsAPI({
  apiKey: 'YOUR_API_KEY'
});

const params: CreatePaymentParams = {
  price_amount: 100,
  price_currency: 'USD',
  pay_currency: 'BTC'
};

const payment: PaymentStatus = await api.createPayment(params);
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Generate documentation
npm run docs

# Build TypeScript definitions
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
