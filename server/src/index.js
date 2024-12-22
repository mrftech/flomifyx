import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { itemController } from './controllers/itemController.js';
import { subscriptionController } from './controllers/subscriptionController.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Item routes
app.get('/api/items', itemController.getItems);
app.post('/api/items', itemController.createItem);

// Subscription routes
app.post('/api/create-checkout', subscriptionController.createCheckout);
app.post('/api/cancel-subscription', subscriptionController.cancelSubscription);
app.post('/api/webhooks/lemonsqueezy', subscriptionController.handleWebhook);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 