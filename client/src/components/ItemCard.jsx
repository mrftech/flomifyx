import React, { useState, useMemo, useEffect } from 'react';
import { itemService } from '../services/itemService';
import { clipboardUtils } from '../utils/clipboard';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function ItemCard({ item, isDropdownOpen, setActiveDropdown }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [copying, setCopying] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    id,
    name,
    description,
    license_type,
    thumbnail_url,
    live_preview,
    tags,
    platform_data
  } = item;

  const availablePlatforms = useMemo(() => {
    try {
      const platforms = typeof platform_data === 'string' 
        ? JSON.parse(platform_data) 
        : platform_data;

      console.log('Platform data:', platforms);

      const available = Object.entries(platforms || {})
        .filter(([platform, data]) => {
          const hasCode = data.code && data.code.trim().length > 0;
          console.log(`${platform} has code:`, hasCode);
          return hasCode;
        })
        .map(([platform]) => platform);

      return available;
    } catch (error) {
      console.error('Error parsing platform data:', error);
      return [];
    }
  }, [platform_data]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setActiveDropdown(isDropdownOpen ? null : item.id);
  };

  const handleCopy = async (e, platform) => {
    e.stopPropagation();
    
    try {
      setCopying(true);
      await itemService.copyPlatformCode(item.id, platform);
      addNotification(`${platform} code copied successfully!`, 'success');
      setActiveDropdown(null);
    } catch (error) {
      if (error.message.includes('premium')) {
        addNotification(error.message, 'error');
        setShowUpgradeModal(true);
        setActiveDropdown(null);
      } else if (error.message.includes('logged in')) {
        addNotification('Please log in to copy premium items', 'error');
        setShowLoginModal(true);
        setActiveDropdown(null);
      } else {
        addNotification('Failed to copy code. Please try again.', 'error');
      }
    } finally {
      setCopying(false);
    }
  };

  const handleItemClick = () => {
    navigate(`/item/${item.id}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.copy-button-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen, setActiveDropdown]);

  return (
    <div className="item-card">
      <div 
        className="item-card__image-container"
        onClick={handleItemClick}
        style={{ cursor: 'pointer' }}
      >
        <img 
          src={thumbnail_url || 'https://via.placeholder.com/300x200'} 
          alt={name} 
          className="item-card__image"
        />
        
        <span className={`license-badge license-badge--${license_type?.toLowerCase()}`}>
          {license_type}
        </span>

        <div className="copy-button-container">
          {availablePlatforms.length > 0 ? (
            <>
              <button 
                className="copy-button"
                onClick={toggleDropdown}
                disabled={copying}
              >
                {copying ? 'Copying...' : 'Copy Code'}
              </button>
              
              {isDropdownOpen && (
                <div 
                  className="copy-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  {availablePlatforms.map(platform => (
                    <button
                      key={platform}
                      className="copy-dropdown__item"
                      onClick={(e) => handleCopy(e, platform)}
                    >
                      <img 
                        src={`/images/${platform}-icon.svg`} 
                        alt={platform}
                        className="platform-icon"
                      />
                      Copy {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>

        {live_preview && (
          <a 
            href={live_preview}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-button"
            title="View Live Preview"
          >
            <FiEye />
          </a>
        )}
      </div>

      <div className="item-card__content">
        <h3 
          className="item-card__title"
          onClick={handleItemClick}
          style={{ cursor: 'pointer' }}
        >
          {name}
        </h3>
        <p className="item-card__description">{description}</p>
        
        <div className="item-card__tags">
          {tags?.map(tag => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ItemCard; 