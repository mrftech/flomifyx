import React, { useState, useEffect, useCallback } from 'react';
import { itemService } from '../services/itemService';
import Header from './Header';
import Footer from './Footer';
import ItemCard from './ItemCard';
import Sidebar from './Sidebar';
import SearchAndSort from './SearchAndSort';
import SkeletonCard from './SkeletonCard';
import '../styles/ItemList.css';
import { usePersistedState } from '../hooks/usePersistedState';
import { logger } from '../utils/logger';
import { useSearchParams, useNavigate } from 'react-router-dom';

function ItemList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [filters, setFilters] = useState({
    itemType: searchParams.get('type') || null,
    licenseType: searchParams.get('license') || null,
    categoryId: searchParams.get('category') || null,
    collection: searchParams.get('collection') || null,
    platforms: searchParams.getAll('platform') || [],
    tags: searchParams.getAll('tag') || []
  });

  const [filterOptions, setFilterOptions] = useState({
    itemTypes: [],
    categories: [],
    collections: [],
    tags: []
  });
  const [allFilterOptions, setAllFilterOptions] = useState({
    itemTypes: [],
    categories: [],
    collections: [],
    tags: []
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [loadedIds] = useState(new Set());
  const [cursor, setCursor] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search) params.set('search', search);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (page > 1) params.set('page', page.toString());
    if (filters.itemType) params.set('type', filters.itemType);
    if (filters.licenseType) params.set('license', filters.licenseType);
    if (filters.categoryId) params.set('category', filters.categoryId);
    if (filters.collection) params.set('collection', filters.collection);
    filters.platforms.forEach(p => params.append('platform', p));
    filters.tags.forEach(t => params.append('tag', t));

    setSearchParams(params, { replace: true });
  }, [filters, search, sortBy, page, setSearchParams]);

  useEffect(() => {
    const handleURLChange = () => {
      const params = new URLSearchParams(window.location.search);
      setSearch(params.get('search') || '');
      setSortBy(params.get('sort') || 'newest');
      setPage(parseInt(params.get('page')) || 1);
      setFilters({
        itemType: params.get('type') || null,
        licenseType: params.get('license') || null,
        categoryId: params.get('category') || null,
        collection: params.get('collection') || null,
        platforms: params.getAll('platform'),
        tags: params.getAll('tag')
      });
    };

    window.addEventListener('popstate', handleURLChange);
    return () => window.removeEventListener('popstate', handleURLChange);
  }, []);

  const loadItems = useCallback(async (isLoadMore = false, currentPage = 1) => {
    try {
      if (isLoadMore && loadingMore) return;
      
      if (!isLoadMore) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      if (isLoadMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const result = await itemService.getItems({
        page: currentPage,
        pageSize: 12,
        search: search.trim(),
        sortBy,
        filters: {
          ...filters,
          itemType: filters.itemType === 'all' ? null : filters.itemType
        }
      });

      if (isLoadMore) {
        const uniqueItems = [...new Map(
          [...items, ...result.items].map(item => [item.id, item])
        ).values()];
        setItems(uniqueItems);
      } else {
        setItems(result.items);
      }

      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);

      if (!isLoadMore && result.filterOptions) {
        setFilterOptions(result.filterOptions);
        setAllFilterOptions(result.filterOptions);
      }
    } catch (err) {
      logger.error('Error loading items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [loading, loadingMore, search, sortBy, filters, items]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    await loadItems(true, nextPage);
  }, [loadingMore, hasMore, page, loadItems]);

  useEffect(() => {
    loadItems(false, 1);
  }, [filters, search, sortBy]);

  const handleReset = useCallback(() => {
    setSearch('');
    setSortBy('newest');
    setPage(1);
    setFilters({
      itemType: null,
      licenseType: null,
      categoryId: null,
      collection: null,
      platforms: [],
      tags: []
    });
    setSearchParams({}, { replace: true });
    loadItems(false, 1);
  }, [setSearchParams]);

  const renderContent = () => {
    if (loading && !loadingMore && (!items.length || search || Object.values(filters).some(v => v))) {
      return (
        <div className="items-grid">
          {Array(8).fill().map((_, i) => (
            <SkeletonCard key={`skeleton-${i}`} />
          ))}
        </div>
      );
    }

    if (!loading && !items.length) {
      return (
        <div className="empty-state">
          <div className="empty-state__content">
            <h3>No items found</h3>
            <p>
              {search 
                ? `No results found for "${search}"`
                : filters.itemType || filters.platforms.length > 0
                ? "No items match your filters"
                : "No items available"
              }
            </p>
            {(search || filters.itemType || filters.platforms.length > 0) && (
              <button 
                className="reset-filters-button"
                onClick={handleReset}
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="items-grid">
          {items.map((item, index) => (
            <ItemCard 
              key={`${item.id}-${index}`}
              item={item}
              isDropdownOpen={activeDropdown === item.id}
              setActiveDropdown={setActiveDropdown}
            />
          ))}
        </div>
        <div className="load-more-container">
          {loadingMore ? (
            <div className="loading-spinner">
              <div className="spinner-icon"></div>
              Loading more items...
            </div>
          ) : hasMore ? (
            <button 
              className="load-more-button"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              Load More
            </button>
          ) : items.length > 0 && (
            <div className="no-more-items">No more items to load</div>
          )}
        </div>
      </>
    );
  };

  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="app-container">
      <Header />
      <div className="layout">
        <Sidebar 
          filters={filters}
          setFilters={setFilters}
          filterOptions={allFilterOptions}
          onReset={handleReset}
        />
        <div className="main-content">
          <SearchAndSort
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          {renderContent()}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ItemList; 