import React, { createContext, useContext, useState, useCallback } from 'react';
import '../styles/Notification.css';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    
    setNotifications(prev => [
      ...prev,
      { id, message, type }
    ]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(({ id, message, type }) => (
          <div 
            key={id}
            className={`notification notification--${type}`}
            onClick={() => removeNotification(id)}
          >
            <div className="notification__content">
              {message}
            </div>
            <button className="notification__close">&times;</button>
            <div className="notification__progress" />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 