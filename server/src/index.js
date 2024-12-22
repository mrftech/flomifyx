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

// Configure CORS
app.use(cors({
  origin: [process.env.CLIENT_URL, 'https://app.lemonsqueezy.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-signature']
}));

// Apply production middleware
app.use(productionMiddleware);

// Webhook route must be defined before body parsers
app.post('/api/webhooks/lemonsqueezy', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Parse JSON for other routes
app.use(express.json());

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Other subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 