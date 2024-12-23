import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemController } from './controllers/itemController.js';
import { subscriptionController } from './controllers/subscriptionController.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors());

// Root route for basic testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Parse raw body for webhook
app.post('/api/webhooks/lemonsqueezy', 
  express.raw({ type: 'application/json' }), 
  (req, res) => {
    try {
      console.log('Webhook received');
      console.log('Headers:', req.headers);
      const body = req.body.toString('utf8');
      console.log('Body:', body);
      
      // Send immediate response
      res.status(200).json({ received: true });
      
      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          const parsedBody = JSON.parse(body);
          const fakeRes = {
            status: () => ({ json: () => {} })
          };
          await subscriptionController.handleWebhook({ ...req, body: parsedBody }, fakeRes);
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

// Test webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
  console.log('Test webhook received:', req.body);
  res.status(200).json({ received: true });
});

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Test the server with:');
  console.log('  curl http://localhost:${port}/health');
  console.log('  curl -X POST http://localhost:${port}/api/webhooks/test -H "Content-Type: application/json" -d \'{"test":true}\'');
}); 