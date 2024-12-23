import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemController } from './controllers/itemController.js';
import { subscriptionController } from './controllers/subscriptionController.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Detailed request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', req.body);
  console.log('IP:', req.ip);
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://beta.flomify.com',
  credentials: true
}));

// Basic routes for testing server availability
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Parse raw body for webhook endpoints
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Parse JSON for other routes
app.use(express.json());

// Test webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Test webhook received`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', req.body);
  res.status(200).json({ 
    received: true,
    timestamp,
    headers: req.headers,
    body: req.body
  });
});

// LemonSqueezy webhook endpoint
app.post('/api/webhooks/lemonsqueezy', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] LemonSqueezy webhook received`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    
    // Convert raw body to string
    const rawBody = req.body.toString('utf8');
    console.log('Raw body:', rawBody);
    
    // Parse the body
    const payload = JSON.parse(rawBody);
    console.log('Parsed payload:', JSON.stringify(payload, null, 2));
    
    // Send immediate response
    res.status(200).json({ 
      received: true,
      timestamp,
      event: payload?.meta?.event_name
    });
    
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
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
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
  res.status(404).json({ 
    error: 'Not Found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Client URL:', process.env.CLIENT_URL);
  console.log('LemonSqueezy variables:');
  console.log('- API Key:', process.env.LEMONSQUEEZY_API_KEY ? 'Set' : 'Not set');
  console.log('- Store ID:', process.env.LEMONSQUEEZY_STORE_ID);
  console.log('- Variant ID:', process.env.LEMONSQUEEZY_VARIANT_ID);
  console.log('- Webhook Secret:', process.env.LEMONSQUEEZY_WEBHOOK_SECRET ? 'Set' : 'Not set');
}); 