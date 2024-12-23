import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json, raw } from 'express';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS
app.use(cors());

// Raw body parser for webhooks
app.use('/api/webhooks', raw({ type: 'application/json' }));

// JSON parser for other routes
app.use(json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Test webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Webhook test received`);
  
  try {
    // Convert raw body to string and parse it
    const rawBody = req.body.toString('utf8');
    const body = JSON.parse(rawBody);
    
    console.log('Headers:', req.headers);
    console.log('Body:', body);
    
    res.json({ 
      received: true,
      timestamp,
      body
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ 
      error: 'Invalid JSON payload',
      timestamp
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log('Test endpoints:');
  console.log(`- GET  http://localhost:${port}/api/test`);
  console.log(`- POST http://localhost:${port}/api/webhooks/test`);
}); 