import React from 'react';
import { FiFilter } from 'react-icons/fi';
import '../styles/SidebarToggle.css';

function SidebarToggle({ isOpen, toggle }) {
  return (
    <button 
      className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
      onClick={toggle}
      title={isOpen ? 'Hide Filters' : 'Show Filters'}
    >
      <FiFilter />
      <span>{isOpen ? 'Hide Filters' : 'Show Filters'}</span>
    </button>
  );
}

export default SidebarToggle; 