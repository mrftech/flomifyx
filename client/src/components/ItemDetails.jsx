import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { itemService } from '../services/itemService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { FiArrowLeft, FiExternalLink, FiCopy, FiEye } from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import '../styles/ItemDetails.css';

function ItemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copying, setCopying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [relatedItems, setRelatedItems] = useState([]);
  const [collectionItems, setCollectionItems] = useState([]);
  const [collectionTotal, setCollectionTotal] = useState(0);
  const [showAllCollection, setShowAllCollection] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const availablePlatforms = useMemo(() => {
    if (!item?.platform_data) return [];

    try {
      console.log('Raw platform data:', item.platform_data);

      const platforms = typeof item.platform_data === 'string' 
        ? JSON.parse(item.platform_data) 
        : item.platform_data;

      console.log('Parsed platforms:', platforms);

      const available = Object.entries(platforms)
        .filter(([platform, data]) => {
          console.log(`Checking platform ${platform}:`, data);
          return data.code && data.code.trim().length > 0;
        })
        .map(([platform]) => platform);

      console.log('Available platforms after filtering:', available);
      return available;
    } catch (error) {
      console.error('Error parsing platform data:', error);
      return [];
    }
  }, [item?.platform_data]);

  console.log('Available platforms:', availablePlatforms);
  console.log('Platform data:', item?.platform_data);

  useEffect(() => {
    const fetchItemAndRelated = async () => {
      try {
        console.log('Fetching item with ID:', id);
        const itemData = await itemService.getItemById(id);
        setItem(itemData);

        // Fetch related items based on all tags
        if (itemData.tags?.length) {
          console.log('Fetching related items for tags:', itemData.tags);
          const relatedData = await itemService.getRelatedItems(
            id, 
            itemData.tags
          );
          console.log('Setting related items:', relatedData);
          setRelatedItems(relatedData);
        }

        // Fetch collection items
        if (itemData.collection) {
          const collectionData = await itemService.getCollectionItems(
            id,
            itemData.collection,
            showAllCollection ? 8 : 4 // Show 4 initially, 8 when expanded
          );
          setCollectionItems(collectionData.items);
          setCollectionTotal(collectionData.totalCount);
        }
      } catch (error) {
        console.error('Error:', error);
        addNotification('Failed to load item details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndRelated();
  }, [id, showAllCollection]);

  // Create URL with multiple tags for related items
  const getRelatedItemsUrl = (tags) => {
    return tags && tags.length > 0 ? `/?tag=${encodeURIComponent(tags[0])}` : '/';
  };

  const handleCopy = async (platform) => {
    try {
      setCopying(true);
      await itemService.copyPlatformCode(item.id, platform);
      addNotification(`${platform} code copied successfully!`, 'success');
    } catch (error) {
      addNotification(error.message, 'error');
    } finally {
      setCopying(false);
    }
  };

  console.log('Current item state:', item);

  const handleAttributeClick = (type, value) => {
    // Create new URLSearchParams for the home page
    const params = new URLSearchParams();
    
    switch(type) {
      case 'itemType':
        params.set('type', value);
        break;
      case 'collection':
        params.set('collection', value);
        break;
      case 'category':
        params.set('category', value);
        break;
      case 'tag':
        params.set('tag', value);
        break;
    }

    // Navigate to home page with filter
    navigate(`/?${params.toString()}`);
  };

  // Add console logs in render to verify data
  console.log('Current related items:', relatedItems);
  console.log('Current collection items:', collectionItems);

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!item) return <div className="error-message">Item not found</div>;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="item-details-page">
        <div className="item-details__nav">
          <div className="breadcrumbs">
            <Link to="/">Home</Link>
            <span className="breadcrumbs__separator">/</span>
            <Link to={`/?type=${item.item_type}`}>{item.item_type}</Link>
            {item.category_id && (
              <>
                <span className="breadcrumbs__separator">/</span>
                <Link to={`/?category=${item.category_id}`}>{item.category_id}</Link>
              </>
            )}
            <span className="breadcrumbs__separator">/</span>
            <span className="breadcrumbs__current">{item.name}</span>
          </div>
        </div>

        <div className="item-details">
          <div className="item-details__grid">
            {/* Left Column */}
            <div className="item-details__main">
              <div className="item-details__header">
                <h1>{item.name}</h1>
              </div>

              <div className="item-details__preview">
                <img src={item.thumbnail_url} alt={item.name} />
              </div>

              <div className="item-details__description">
                <h2>Description</h2>
                <p>{item.description}</p>
              </div>

              <div className="item-details__tags">
                <h2>Tags</h2>
                <div className="tags-container">
                  {item.tags?.map(tag => (
                    <button
                      key={tag}
                      className="tag-filter"
                      onClick={() => navigate(`/?tags=${tag}`)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Related Items Section */}
              {relatedItems.length > 0 && (
                <div className="related-items-section">
                  <div className="section-header">
                    <h2>Related Items</h2>
                    <Link 
                      to={getRelatedItemsUrl(item.tags)}
                      className="browse-all"
                    >
                      Browse All
                    </Link>
                  </div>
                  <div className="related-items">
                    {relatedItems.map(relatedItem => (
                      <Link 
                        key={relatedItem.id}
                        to={`/item/${relatedItem.id}`}
                        className="related-item"
                      >
                        <img src={relatedItem.thumbnail_url} alt={relatedItem.name} />
                        <h3>{relatedItem.name}</h3>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Collection Items Section */}
              {collectionItems.length > 0 && (
                <div className="collection-section">
                  <div className="section-header">
                    <h2>More from {item.collection}</h2>
                    <Link 
                      to={`/?collection=${encodeURIComponent(item.collection)}`} 
                      className="browse-all"
                    >
                      View All ({collectionTotal})
                    </Link>
                  </div>
                  <div className="collection-items">
                    {collectionItems.map(collectionItem => (
                      <Link 
                        key={collectionItem.id}
                        to={`/item/${collectionItem.id}`}
                        className="collection-item"
                      >
                        <img src={collectionItem.thumbnail_url} alt={collectionItem.name} />
                        <h3>{collectionItem.name}</h3>
                      </Link>
                    ))}
                  </div>
                  {collectionTotal > 4 && !showAllCollection && (
                    <button 
                      className="show-more-button"
                      onClick={() => setShowAllCollection(true)}
                    >
                      Show More
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="item-details__sidebar">
              {console.log('Rendering buttons for platforms:', availablePlatforms)}
              
              {availablePlatforms.length > 0 && (
                <div className="copy-buttons-container">
                  {availablePlatforms.map(platform => (
                    <button
                      key={platform}
                      className={`copy-button ${copying ? 'disabled' : ''}`}
                      onClick={() => handleCopy(platform)}
                      disabled={copying}
                    >
                      <img 
                        src={`/images/${platform}-icon.svg`}
                        alt={platform}
                        className="platform-icon"
                      />
                      {copying ? 'Copying...' : `Copy ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
                    </button>
                  ))}
                </div>
              )}

              {item.live_preview && (
                <a 
                  href={item.live_preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-button-large"
                >
                  <FiEye />
                  View Live Preview
                </a>
              )}

              <div className="item-attributes">
                <div className="item-attributes__header">
                  <span className={`license-badge license-badge--${item.license_type.toLowerCase()}`}>
                    {item.license_type}
                  </span>
                  <h3>Item Details</h3>
                </div>
                
                <dl>
                  {item.item_type && (
                    <>
                      <dt>Type</dt>
                      <dd>
                        <button
                          className="attribute-link"
                          onClick={() => handleAttributeClick('itemType', item.item_type)}
                        >
                          {item.item_type}
                        </button>
                      </dd>
                    </>
                  )}

                  {item.collection && (
                    <>
                      <dt>Collection</dt>
                      <dd>
                        <button
                          className="attribute-link"
                          onClick={() => handleAttributeClick('collection', item.collection)}
                        >
                          {item.collection}
                        </button>
                      </dd>
                    </>
                  )}

                  {item.category_id && (
                    <>
                      <dt>Category</dt>
                      <dd>
                        <button
                          className="attribute-link"
                          onClick={() => handleAttributeClick('category', item.category_id)}
                        >
                          {item.category_id}
                        </button>
                      </dd>
                    </>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <>
                      <dt>Tags</dt>
                      <dd className="tags-list">
                        {item.tags.map(tag => (
                          <button
                            key={tag}
                            className="tag-link"
                            onClick={() => handleAttributeClick('tag', tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ItemDetails; 