import { supabase } from '../config/supabase';

export const subscriptionService = {
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  },

  async hasActiveSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No subscription found
          return false;
        }
        console.error('Error checking subscription:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasActiveSubscription:', error);
      return false;
    }
  },

  async createCheckoutSession(userId, email) {
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }
}; 