import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Subscription.css';

function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    addNotification('Subscription activated successfully!', 'success');
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, addNotification]);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="subscription-page">
        <div className="subscription-message success">
          <h1>🎉 Thank you for subscribing!</h1>
          <p>Your subscription has been activated successfully.</p>
          <p>You now have access to all premium items.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/')}
          >
            Browse Items
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SubscriptionSuccess; 