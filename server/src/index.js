import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemController } from './controllers/itemController.js';
import { subscriptionController } from './controllers/subscriptionController.js';
import { productionMiddleware } from './middleware/production.js';

dotenv.config();

// Verify environment variables
console.log('Environment Check:', {
  hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
  hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
  hasVariantId: !!process.env.LEMONSQUEEZY_VARIANT_ID,
  hasWebhookSecret: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  clientUrl: process.env.CLIENT_URL
});

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS to allow LemonSqueezy webhooks
app.use(cors({
  origin: ['https://app.lemonsqueezy.com', process.env.CLIENT_URL],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-signature']
}));

// Apply production middleware
app.use(productionMiddleware);

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Add test endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhookUrl: `${process.env.CLIENT_URL}/api/webhooks/lemonsqueezy`
  });
});

// Webhook route must be defined before body parsers
app.post('/api/webhooks/lemonsqueezy', 
  express.raw({ type: 'application/json' }), 
  (req, res, next) => {
    console.log('Webhook headers:', req.headers);
    console.log('Webhook body type:', typeof req.body);
    next();
  },
  subscriptionController.handleWebhook
);

// Parse JSON for other routes
app.use(express.json());

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Other subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Webhook URL:', `${process.env.CLIENT_URL}/api/webhooks/lemonsqueezy`);
}); 