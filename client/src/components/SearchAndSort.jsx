import React, { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import '../styles/SearchAndSort.css';

function SearchAndSort({ search, setSearch, sortBy, setSortBy }) {
  const handleSearchChange = (value) => {
    setSearch(value);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  return (
    <div className="search-sort-container">
      <div className="search-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by name, description or tags..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="search-input"
        />
        {search && (
          <button 
            className="clear-search-button"
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
          >
            <FiX />
          </button>
        )}
      </div>
      
      <div className="sort-container">
        <select 
          value={sortBy} 
          onChange={(e) => handleSortChange(e.target.value)}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="popularity">Most Popular</option>
        </select>
      </div>
    </div>
  );
}

export default SearchAndSort; 