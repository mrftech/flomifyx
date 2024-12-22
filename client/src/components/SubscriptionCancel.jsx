import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Subscription.css';

function SubscriptionCancel() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    addNotification('Subscription checkout cancelled', 'info');
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, addNotification]);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="subscription-page">
        <div className="subscription-message">
          <h1>Subscription Checkout Cancelled</h1>
          <p>You have cancelled the subscription checkout process.</p>
          <p>You can still subscribe anytime to access premium items.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/')}
          >
            Back to Items
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default SubscriptionCancel; 