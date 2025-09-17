import React, { useState, useRef, useCallback } from 'react';
import DraggableTag from './DraggableTag';
import BrandSelector from './BrandSelector';

const VisualTaggingStage = ({ 
  postData, 
  updatePostData, 
  nextStage, 
  prevStage, 
  canProceed, 
  BRANDS,
  CATEGORIES 
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const [activeTagId, setActiveTagId] = useState(null);
  const photoRef = useRef(null);

  const handlePhotoClick = useCallback((e) => {
    if (!photoRef.current) return;
    
    const rect = photoRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newTag = {
      id: Date.now(),
      x: Math.min(Math.max(x, 5), 85), // Keep within bounds
      y: Math.min(Math.max(y, 5), 85),
      targetX: x,
      targetY: y,
      brand: '',
      category: '',
      color: getRandomTagColor()
    };
    
    const currentTags = postData.tags || [];
    updatePostData({ tags: [...currentTags, newTag] });
    setActiveTagId(newTag.id);
    setShowBrandSelector(true);
  }, [postData.tags, updatePostData]);

  const updateTag = useCallback((tagId, updates) => {
    const updatedTags = postData.tags.map(tag => 
      tag.id === tagId ? { ...tag, ...updates } : tag
    );
    updatePostData({ tags: updatedTags });
  }, [postData.tags, updatePostData]);

  const deleteTag = useCallback((tagId) => {
    const filteredTags = postData.tags.filter(tag => tag.id !== tagId);
    updatePostData({ tags: filteredTags });
  }, [postData.tags, updatePostData]);

  const getRandomTagColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleBrandSelect = (brand, category) => {
    if (activeTagId) {
      updateTag(activeTagId, { brand, category });
      setShowBrandSelector(false);
      setActiveTagId(null);
    }
  };

  return (
    <div className="visual-tagging-stage-fixed">
      <div className="stage-header-compact">
        <h2>Tag Your Outfit</h2>
        <p>Tap on clothing items to tag them with brands</p>
      </div>

      {/* Photo Selection for Multiple Photos */}
      {postData.photos.length > 1 && (
        <div className="photo-selector">
          {postData.photos.map((photo, index) => (
            <button
              key={index}
              className={`photo-thumb ${selectedPhoto === index ? 'active' : ''}`}
              onClick={() => setSelectedPhoto(index)}
            >
              <img src={photo.url} alt={`Photo ${index + 1}`} />
            </button>
          ))}
        </div>
      )}

      {/* Main Photo Canvas - FIXED HEIGHT */}
      <div className="tagging-canvas-container">
        <div className="photo-container" onClick={handlePhotoClick}>
          <img
            ref={photoRef}
            src={postData.photos[selectedPhoto]?.url}
            alt="Outfit to tag"
            className="tagging-photo"
          />
          
          {/* Render Tags */}
          {postData.tags?.map(tag => (
            <DraggableTag
              key={tag.id}
              tag={tag}
              updateTag={updateTag}
              deleteTag={deleteTag}
              onSelect={(tagId) => {
                setActiveTagId(tagId);
                setShowBrandSelector(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="tagging-instructions">
        <div className="instruction-item">
          <span className="instruction-icon">👆</span>
          <span>Tap to add</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">🏷️</span>
          <span>Drag to move</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-icon">✏️</span>
          <span>Tap to edit</span>
        </div>
      </div>

      {/* Brand Selector Modal */}
      {showBrandSelector && (
        <BrandSelector
          isOpen={showBrandSelector}
          onClose={() => {
            setShowBrandSelector(false);
            setActiveTagId(null);
          }}
          onSelect={handleBrandSelect}
          BRANDS={BRANDS}
          CATEGORIES={CATEGORIES}
          currentTag={postData.tags?.find(tag => tag.id === activeTagId)}
        />
      )}

      {/* Fixed Navigation */}
      <div className="stage-navigation-fixed">
        <button className="nav-btn secondary" onClick={prevStage}>
          Back
        </button>
        <button className="nav-btn primary" onClick={nextStage}>
          Continue ({postData.tags?.length || 0} tagged)
        </button>
      </div>
    </div>
  );
};

export default VisualTaggingStage;
