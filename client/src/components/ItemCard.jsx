import React, { useState, useMemo } from 'react';
import { itemService } from '../services/itemService';
import { clipboardUtils } from '../utils/clipboard';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FiEye, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function ItemCard({ item, isDropdownOpen, setActiveDropdown }) {
  const { user } = useAuth();
  const { isSubscribed, startSubscription } = useSubscription();
  const { addNotification } = useNotification();
  const [copying, setCopying] = useState(false);
  const navigate = useNavigate();

  const isPremium = item.license_type === 'Premium';

  const handleCopy = async (platform) => {
    try {
      setCopying(true);
      await itemService.copyPlatformCode(item.id, platform);
      addNotification(`${platform} code copied successfully!`, 'success');
    } catch (error) {
      if (error.message.includes('premium')) {
        addNotification('This is a premium item. Please subscribe to copy the code.', 'info');
      } else {
        addNotification(error.message, 'error');
      }
    } finally {
      setCopying(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      if (!user) {
        addNotification('Please sign in to subscribe', 'info');
        return;
      }
      await startSubscription();
    } catch (error) {
      addNotification(error.message, 'error');
    }
  };

  return (
    <div className="item-card">
      <div className="item-card__header">
        <h3 className="item-card__title">
          {item.name}
          {isPremium && (
            <span className="premium-badge">
              <FiStar /> Premium
            </span>
          )}
        </h3>
      </div>

      <div className="item-card__preview">
        <img src={item.thumbnail_url} alt={item.name} />
        {isPremium && !isSubscribed && (
          <div className="premium-overlay">
            <h3>Premium Item</h3>
            <p>Subscribe to access this and other premium items</p>
            <button 
              className="unlock-button"
              onClick={handleSubscribe}
            >
              Unlock Now
            </button>
          </div>
        )}
      </div>

      <div className="item-card__content">
        <p className="item-card__description">{item.description}</p>
        
        <div className="item-card__tags">
          {item.tags?.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <div className="item-card__actions">
          {item.live_preview && (
            <a
              href={item.live_preview}
              target="_blank"
              rel="noopener noreferrer"
              className="preview-button"
            >
              <FiEye /> Preview
            </a>
          )}

          <button
            className="details-button"
            onClick={() => navigate(`/item/${item.id}`)}
          >
            View Details
          </button>

          {Object.entries(item.platform_data || {}).map(([platform, data]) => (
            data.enabled && (
              <button
                key={platform}
                className={`copy-button ${copying ? 'disabled' : ''}`}
                onClick={() => handleCopy(platform)}
                disabled={copying || (isPremium && !isSubscribed)}
              >
                <img 
                  src={`/images/${platform}-icon.svg`}
                  alt={platform}
                  className="platform-icon"
                />
                {copying ? 'Copying...' : `Copy ${platform}`}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

export default ItemCard; 