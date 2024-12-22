import { supabase } from '../config/supabase';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID;

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
    const event = req.body;
    const eventName = event.meta.event_name;

    try {
      switch (eventName) {
        case 'subscription_created':
        case 'subscription_updated': {
          const { user_id } = event.meta.custom_data;
          const subscription = event.data;

          await supabase
            .from('subscriptions')
            .upsert({
              user_id,
              lemon_squeezy_id: subscription.id,
              status: subscription.attributes.status,
              plan_id: subscription.attributes.variant_id,
              current_period_end: subscription.attributes.renews_at,
              cancel_at_period_end: subscription.attributes.cancelled,
              created_at: subscription.attributes.created_at,
              updated_at: subscription.attributes.updated_at,
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
              updated_at: new Date().toISOString(),
            })
            .eq('lemon_squeezy_id', subscription.id);
          break;
        }
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