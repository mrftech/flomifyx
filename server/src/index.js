import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS
app.use(cors());

// Raw body parser for webhooks
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// JSON parser for other routes
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Test webhook endpoint
app.post('/api/webhooks/test', (req, res) => {
  console.log('Webhook test received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  res.json({ 
    received: true,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
}); 