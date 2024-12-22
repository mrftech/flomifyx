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
        console.log('No signature provided in webhook request');
        return res.status(400).json({ error: 'No signature provided' });
      }

      // Get raw body as string
      const rawBody = req.body.toString('utf8');
      console.log('Received webhook payload:', rawBody);

      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.log('Invalid signature in webhook request');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse the raw body
      const event = JSON.parse(rawBody);
      const eventName = event.meta.event_name;
      const eventData = event.data;

      console.log('Processing webhook event:', eventName);
      console.log('Event data:', JSON.stringify(eventData, null, 2));

      switch (eventName) {
        case 'order_created': {
          const { user_id } = event.meta.custom_data || {};
          const order = eventData;
          const attrs = order.attributes;
          
          console.log('Processing order:', order.id, 'for user:', user_id);
          
          // Store order information if needed
          await supabase
            .from('orders')
            .insert({
              order_id: order.id,
              user_id,
              total: attrs.total,
              status: attrs.status,
              created_at: attrs.created_at
            })
            .single();
          break;
        }

        case 'subscription_created':
        case 'subscription_updated': {
          const subscription = eventData;
          const attrs = subscription.attributes;
          
          // Extract user_id from custom_data or try to find from existing subscription
          let userId = event.meta.custom_data?.user_id;
          
          if (!userId) {
            // Try to find existing subscription to get user_id
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('lemon_squeezy_id', subscription.id)
              .single();
            
            userId = existingSub?.user_id;
          }

          if (!userId) {
            console.log('No user_id found for subscription:', subscription.id);
            return res.status(400).json({ error: 'No user_id found' });
          }

          console.log('Processing subscription:', subscription.id, 'for user:', userId);

          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              lemon_squeezy_id: subscription.id,
              order_id: attrs.order_id,
              status: attrs.status,
              plan_id: attrs.variant_id,
              current_period_start: attrs.created_at,
              current_period_end: attrs.renews_at,
              cancel_at_period_end: attrs.cancelled,
              trial_ends_at: attrs.trial_ends_at,
              payment_status: attrs.status === 'active' ? 'paid' : 'pending',
              last_payment_date: new Date().toISOString(),
              next_payment_date: attrs.renews_at,
              customer_id: attrs.customer_id,
              customer_email: attrs.user_email,
              product_id: attrs.product_id,
              product_name: attrs.product_name,
              variant_name: attrs.variant_name,
              card_brand: attrs.card_brand,
              card_last_four: attrs.card_last_four,
              created_at: attrs.created_at,
              updated_at: attrs.updated_at
            });
          break;
        }

        case 'subscription_cancelled': {
          const subscription = eventData;
          console.log('Processing subscription cancellation:', subscription.id);
          
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
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription resume:', subscription.id);
          
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              cancel_at_period_end: false,
              current_period_end: attrs.renews_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_expired': {
          const subscription = eventData;
          console.log('Processing subscription expiration:', subscription.id);
          
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
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription pause:', subscription.id);
          
          await supabase
            .from('subscriptions')
            .update({
              status: 'paused',
              pause_starts_at: attrs.pause?.starts_at,
              pause_resumes_at: attrs.pause?.resumes_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_unpaused': {
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription unpause:', subscription.id);
          
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              pause_starts_at: null,
              pause_resumes_at: null,
              current_period_end: attrs.renews_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        case 'subscription_payment_failed': {
          const subscription = eventData;
          console.log('Processing subscription payment failure:', subscription.id);
          
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
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription payment success:', subscription.id);
          
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
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
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription payment recovery:', subscription.id);
          
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
          const subscription = eventData;
          console.log('Processing subscription payment refund:', subscription.id);
          
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
          const subscription = eventData;
          const attrs = subscription.attributes;
          console.log('Processing subscription plan change:', subscription.id);
          
          await supabase
            .from('subscriptions')
            .update({
              plan_id: attrs.variant_id,
              product_id: attrs.product_id,
              product_name: attrs.product_name,
              variant_name: attrs.variant_name,
              current_period_end: attrs.renews_at,
              updated_at: new Date().toISOString()
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }

        default:
          console.log('Unhandled webhook event:', eventName);
      }

      console.log('Successfully processed webhook event:', eventName);
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