import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNotification } from '../contexts/NotificationContext';
import AuthModal from './AuthModal';
import { FiStar } from 'react-icons/fi';
import '../styles/Header.css';

function Header() {
  const { user, isModalOpen, setIsModalOpen, signOut } = useAuth();
  const { subscription, isSubscribed, startSubscription, cancelSubscription } = useSubscription();
  const { addNotification } = useNotification();

  const handleSubscribe = async () => {
    try {
      if (!user) {
        setIsModalOpen(true);
        return;
      }
      await startSubscription();
    } catch (error) {
      addNotification(error.message, 'error');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription();
      addNotification('Your subscription has been cancelled', 'success');
    } catch (error) {
      addNotification(error.message, 'error');
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">Component Library</h1>
      </div>
      <div className="header__right">
        {user ? (
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            {isSubscribed ? (
              <div className="subscription-info">
                <span className="premium-badge">
                  <FiStar /> Premium
                </span>
                <button 
                  className="cancel-subscription-button"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </button>
              </div>
            ) : (
              <button 
                className="subscribe-button"
                onClick={handleSubscribe}
              >
                Upgrade to Premium
              </button>
            )}
            <button 
              className="auth-button" 
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <button 
              className="subscribe-button"
              onClick={handleSubscribe}
            >
              Upgrade to Premium
            </button>
            <button 
              className="auth-button" 
              onClick={() => setIsModalOpen(true)}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </header>
  );
}

export default Header; 