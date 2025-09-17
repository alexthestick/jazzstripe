import React, { useState } from 'react';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('brands');
  
  return (
    <div className="search-page">
      <div className="search-header">
        <input
          type="text"
          placeholder="Search brands, users, styles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="search-filters">
        <button 
          className={`filter-btn ${searchType === 'brands' ? 'active' : ''}`}
          onClick={() => setSearchType('brands')}
        >
          Brands
        </button>
        <button 
          className={`filter-btn ${searchType === 'users' ? 'active' : ''}`}
          onClick={() => setSearchType('users')}
        >
          Users
        </button>
        <button 
          className={`filter-btn ${searchType === 'styles' ? 'active' : ''}`}
          onClick={() => setSearchType('styles')}
        >
          Styles
        </button>
      </div>
      
      <div className="search-results">
        {searchQuery ? (
          <div className="search-results-content">
            <p>Search results for "{searchQuery}" in {searchType}</p>
            {/* TODO: Implement actual search results */}
          </div>
        ) : (
          <div className="search-placeholder">
            <h3>Discover</h3>
            <p>Search for brands, users, or styles to find new inspiration</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;


