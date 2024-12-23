import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemController } from './controllers/itemController.js';
import { subscriptionController } from './controllers/subscriptionController.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// CORS configuration
app.use(cors());

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint (no auth required)
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Parse raw body for webhook endpoints
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Parse JSON for other routes
app.use(express.json());

// Webhook endpoints
app.post('/api/webhooks/lemonsqueezy', async (req, res) => {
  try {
    console.log('LemonSqueezy webhook received');
    console.log('Headers:', req.headers);
    
    // Convert raw body to string
    const rawBody = req.body.toString('utf8');
    console.log('Raw body:', rawBody);
    
    // Parse the body
    const payload = JSON.parse(rawBody);
    console.log('Parsed payload:', payload);
    
    // Send immediate response
    res.status(200).json({ received: true });
    
    // Process webhook asynchronously
    setImmediate(async () => {
      try {
        await subscriptionController.handleWebhook(payload);
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    });
  } catch (error) {
    console.error('Error in webhook route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
  console.log('Test webhook received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.status(200).json({ received: true });
});

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: 'Not Found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('LemonSqueezy variables:');
  console.log('- API Key:', process.env.LEMONSQUEEZY_API_KEY ? 'Set' : 'Not set');
  console.log('- Store ID:', process.env.LEMONSQUEEZY_STORE_ID);
  console.log('- Variant ID:', process.env.LEMONSQUEEZY_VARIANT_ID);
  console.log('- Webhook Secret:', process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'Set' : 'Not set');
  console.log('- Client URL:', process.env.CLIENT_URL);
}); 