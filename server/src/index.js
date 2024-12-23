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
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-signature']
}));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    webhookUrl: `${process.env.CLIENT_URL}/api/webhooks/lemonsqueezy`
  });
});

// Simple test webhook endpoint
app.post('/api/webhooks/test', express.json(), (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({ received: true });
});

// Webhook route - keep it simple first
app.post('/api/webhooks/lemonsqueezy', 
  express.raw({ type: 'application/json' }), 
  (req, res) => {
    try {
      console.log('Webhook received');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body.toString());
      
      // Send immediate response
      res.status(200).json({ received: true });
      
      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          await subscriptionController.handleWebhook(req, res);
        } catch (error) {
          console.error('Error processing webhook:', error);
        }
      });
    } catch (error) {
      console.error('Error in webhook route:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Parse JSON for other routes
app.use(express.json());

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Other subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Catch-all route for debugging
app.use((req, res) => {
  console.log('404 for:', req.method, req.url);
  res.status(404).json({ error: 'Not found' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('Webhook URL:', `${process.env.CLIENT_URL}/api/webhooks/lemonsqueezy`);
}); 