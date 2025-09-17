import React, { useState, useCallback, useMemo } from 'react';

const BrandSelector = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  BRANDS, 
  CATEGORIES, 
  currentTag 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredBrands = useMemo(() => {
    let filtered = BRANDS;
    
    if (searchTerm) {
      filtered = filtered.filter(brand => 
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      // Filter by category if needed
      filtered = filtered.filter(brand => 
        // This would need category mapping logic
        true
      );
    }
    
    return filtered.slice(0, 20); // Limit results
  }, [BRANDS, searchTerm, selectedCategory]);

  const handleBrandSelect = useCallback((brand) => {
    onSelect(brand, selectedCategory);
  }, [onSelect, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="brand-selector-overlay">
      <div className="brand-selector-modal">
        <div className="brand-selector-header">
          <h3>Select Brand</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Search Input */}
        <div className="search-section">
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="brand-search-input"
            autoFocus
          />
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <button
            className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {Object.keys(CATEGORIES).map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Brand List */}
        <div className="brand-list">
          {filteredBrands.map(brand => (
            <button
              key={brand}
              className="brand-item"
              onClick={() => handleBrandSelect(brand)}
            >
              <span className="brand-name">{brand}</span>
              {currentTag?.brand === brand && (
                <span className="selected-indicator">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Custom Brand Input */}
        <div className="custom-brand-section">
          <input
            type="text"
            placeholder="Or enter custom brand..."
            className="custom-brand-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                handleBrandSelect(e.target.value.trim());
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BrandSelector;
