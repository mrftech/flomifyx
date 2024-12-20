import React from 'react';

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-description" />
        <div className="skeleton skeleton-description" />
      </div>
    </div>
  );
}

export default SkeletonCard; 