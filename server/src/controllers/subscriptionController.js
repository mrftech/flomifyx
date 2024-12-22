import { supabase } from '../config/supabase';
import crypto from 'crypto';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID;
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

const verifyWebhookSignature = (payload, signature) => {
  if (!LEMONSQUEEZY_WEBHOOK_SECRET) {
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
  }

  const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

export const subscriptionController = {
  async createCheckout(req, res) {
    const { user_id, email } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            type: 'checkouts',
            attributes: {
              store_id: LEMONSQUEEZY_STORE_ID,
              variant_id: LEMONSQUEEZY_VARIANT_ID,
              custom_price: null,
              product_options: {
                enabled_variants: [LEMONSQUEEZY_VARIANT_ID],
              },
              checkout_data: {
                email,
                custom: {
                  user_id,
                },
              },
              success_url: `${process.env.CLIENT_URL}/subscription/success`,
              cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      res.json({ url: data.data.attributes.url });
    } catch (error) {
      console.error('Error creating checkout:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  },

  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-signature'];
      if (!signature) {
        return res.status(400).json({ error: 'No signature provided' });
      }

      const rawBody = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const event = req.body;
      const eventName = event.meta.event_name;

      console.log('Received webhook event:', eventName);

      switch (eventName) {
        case 'order_created': {
          const { user_id } = event.meta.custom_data;
          const order = event.data;
          console.log('Processing order:', order.id);
          break;
        }

        case 'order_refunded': {
          const order = event.data;
          await supabase
            .from('subscriptions')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('order_id', order.id);
          break;
        }

        case 'subscription_created':
        case 'subscription_updated': {
          const { user_id } = event.meta.custom_data;
          const subscription = event.data;
          const attrs = subscription.attributes;

          await supabase
            .from('subscriptions')
            .upsert({
              user_id,
              lemon_squeezy_id: subscription.id,
              order_id: attrs.order_id,
              status: attrs.status,
              plan_id: attrs.variant_id,
              current_period_start: attrs.current_period_start,
              current_period_end: attrs.renews_at,
              cancel_at_period_end: attrs.cancelled,
              trial_ends_at: attrs.trial_ends_at,
              payment_status: 'paid',
              last_payment_date: new Date().toISOString(),
              next_payment_date: attrs.renews_at,
              created_at: attrs.created_at,
              updated_at: attrs.updated_at
            });
          break;
        }

        case 'subscription_cancelled': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              status: 'cancelled',
              cancel_at_period_end: true,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_resumed': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              cancel_at_period_end: false,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_expired': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_paused': {
          const subscription = event.data;
          const attrs = subscription.attributes;
          await supabase
            .from('subscriptions')
            .update({
              status: 'paused',
              pause_starts_at: attrs.pause_starts_at,
              pause_resumes_at: attrs.pause_resumes_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_unpaused': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              pause_starts_at: null,
              pause_resumes_at: null,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_payment_failed': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              payment_status: 'failed',
              renewal_attempts: supabase.raw('renewal_attempts + 1'),
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_payment_success': {
          const subscription = event.data;
          const attrs = subscription.attributes;
          await supabase
            .from('subscriptions')
            .update({
              payment_status: 'paid',
              last_payment_date: new Date().toISOString(),
              next_payment_date: attrs.renews_at,
              renewal_attempts: 0,
              current_period_start: attrs.current_period_start,
              current_period_end: attrs.renews_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_payment_recovered': {
          const subscription = event.data;
          const attrs = subscription.attributes;
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              payment_status: 'paid',
              last_payment_date: new Date().toISOString(),
              next_payment_date: attrs.renews_at,
              renewal_attempts: 0,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_payment_refunded': {
          const subscription = event.data;
          await supabase
            .from('subscriptions')
            .update({
              payment_status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_plan_changed': {
          const subscription = event.data;
          const attrs = subscription.attributes;
          await supabase
            .from('subscriptions')
            .update({
              plan_id: attrs.variant_id,
              current_period_end: attrs.renews_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'license_key_created':
        case 'license_key_updated': {
          const license = event.data;
          const attrs = license.attributes;
          await supabase
            .from('subscriptions')
            .update({
              license_key: attrs.key,
              license_key_status: attrs.status,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', attrs.subscription_id);
          break;
        }

        default:
          console.log('Unhandled webhook event:', eventName);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  },

  async cancelSubscription(req, res) {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ error: 'Missing subscription_id' });
    }

    try {
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscription_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  },
}; 