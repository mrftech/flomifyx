import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import '../styles/Sidebar.css';

function Sidebar({ filters, setFilters, filterOptions, onReset }) {
  const [showAllTags, setShowAllTags] = useState(false);
  const INITIAL_TAGS_COUNT = 10;

  useEffect(() => {
    console.log('Filter options in Sidebar:', filterOptions);
  }, [filterOptions]);

  // Ensure filterOptions has all required properties
  const safeFilterOptions = {
    itemTypes: filterOptions?.itemTypes || [],
    licenseTypes: filterOptions?.licenseTypes || [],
    categories: filterOptions?.categories || [],
    collections: filterOptions?.collections || [],
    platforms: filterOptions?.platforms || [],
    tags: filterOptions?.tags || []
  };

  // Sort tags by frequency and slice them
  const sortedTags = [...safeFilterOptions.tags].sort();
  const visibleTags = showAllTags 
    ? sortedTags 
    : sortedTags.slice(0, INITIAL_TAGS_COUNT);

  return (
    <div className="sidebar">
      <div className="sidebar__header">
        <h2>Filters</h2>
        <button 
          className="reset-button"
          onClick={onReset}
          title="Reset all filters"
        >
          <FiRefreshCw />
          <span>Reset</span>
        </button>
      </div>

      {/* Item Type Filter */}
      <div className="filter-section">
        <h3>Type</h3>
        <select 
          value={filters.itemType || 'all'} 
          onChange={(e) => setFilters(prev => ({...prev, itemType: e.target.value}))}
        >
          <option value="all">All Types</option>
          {safeFilterOptions.itemTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* License Type Filter - Changed back to radio buttons */}
      <div className="filter-section">
        <h3>License</h3>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="license"
              value="all"
              checked={!filters.licenseType}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                licenseType: e.target.value === 'all' ? null : e.target.value
              }))}
            />
            All
          </label>
          <label>
            <input
              type="radio"
              name="license"
              value="Free"
              checked={filters.licenseType === 'Free'}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                licenseType: e.target.value
              }))}
            />
            Free
          </label>
          <label>
            <input
              type="radio"
              name="license"
              value="Premium"
              checked={filters.licenseType === 'Premium'}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                licenseType: e.target.value
              }))}
            />
            Premium
          </label>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h3>Category</h3>
        <select 
          value={filters.categoryId || 'all'} 
          onChange={(e) => setFilters(prev => ({...prev, categoryId: e.target.value}))}
        >
          <option value="all">All Categories</option>
          {safeFilterOptions.categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Collection Filter */}
      <div className="filter-section">
        <h3>Collection</h3>
        <select 
          value={filters.collection || 'all'} 
          onChange={(e) => setFilters(prev => ({...prev, collection: e.target.value}))}
        >
          <option value="all">All Collections</option>
          {safeFilterOptions.collections.map(collection => (
            <option key={collection} value={collection}>{collection}</option>
          ))}
        </select>
      </div>

      {/* Platform Filter */}
      <div className="filter-section">
        <h3>Platform</h3>
        <div className="checkbox-group">
          {safeFilterOptions.platforms.map(platform => (
            <label key={platform}>
              <input
                type="checkbox"
                checked={filters.platforms?.includes(platform)}
                onChange={(e) => {
                  const platforms = filters.platforms || [];
                  if (e.target.checked) {
                    setFilters(prev => ({
                      ...prev,
                      platforms: [...platforms, platform]
                    }));
                  } else {
                    setFilters(prev => ({
                      ...prev,
                      platforms: platforms.filter(p => p !== platform)
                    }));
                  }
                }}
              />
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Tags Filter */}
      <div className="filter-section">
        <h3>Tags</h3>
        <div className="tags-container">
          {visibleTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter ${filters.tags?.includes(tag) ? 'active' : ''}`}
              onClick={() => {
                const tags = filters.tags || [];
                if (tags.includes(tag)) {
                  setFilters(prev => ({
                    ...prev,
                    tags: tags.filter(t => t !== tag)
                  }));
                } else {
                  setFilters(prev => ({
                    ...prev,
                    tags: [...tags, tag]
                  }));
                }
              }}
            >
              {tag}
            </button>
          ))}
        </div>
        
        {safeFilterOptions.tags.length > INITIAL_TAGS_COUNT && (
          <button
            className="show-more-button"
            onClick={() => setShowAllTags(!showAllTags)}
          >
            {showAllTags ? (
              <>
                <FiChevronUp /> Show Less
              </>
            ) : (
              <>
                <FiChevronDown /> Show More ({safeFilterOptions.tags.length - INITIAL_TAGS_COUNT} more)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar; 