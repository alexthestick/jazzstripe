import React, { useState, useRef, useCallback } from 'react';

const PhotoCaptureStage = ({ 
  postData, 
  updatePostData, 
  nextStage, 
  prevStage, 
  canProceed 
}) => {
  const fileInputRef = useRef(null);
  const [selectedPhotos, setSelectedPhotos] = useState(postData.photos || []);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    
    // Enforce 5 photo limit
    const availableSlots = 5 - selectedPhotos.length;
    const filesToAdd = files.slice(0, availableSlots);
    
    const newPhotos = filesToAdd.map(file => ({
      id: Date.now() + Math.random(),
      file: file,
      url: URL.createObjectURL(file)
    }));
    
    const updatedPhotos = [...selectedPhotos, ...newPhotos];
    setSelectedPhotos(updatedPhotos);
    updatePostData({ photos: updatedPhotos });
  }, [selectedPhotos, updatePostData]);

  const removePhoto = useCallback((photoId) => {
    const updatedPhotos = selectedPhotos.filter(photo => photo.id !== photoId);
    setSelectedPhotos(updatedPhotos);
    updatePostData({ photos: updatedPhotos });
  }, [selectedPhotos, updatePostData]);

  const openPhotoSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      className="photo-capture-stage-simplified"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        overflow: 'hidden'
      }}
    >
      <div className="stage-header-compact">
        <h2>Add Photos</h2>
        <p>Select up to 5 photos from your gallery</p>
      </div>

      {/* Main Photo Selection Area - Scrollable */}
      <div className="photo-selection-area">
        {selectedPhotos.length === 0 ? (
          // Empty state - Large photo selector
          <div className="main-photo-selector" onClick={openPhotoSelector}>
            <div className="photo-selector-content">
              <div className="camera-icon-large">📷</div>
              <h3>Add Photos</h3>
              <p>Tap to select from gallery</p>
              <div className="photo-limit-indicator">Up to 5 photos</div>
            </div>
          </div>
        ) : (
          // Photos selected - Grid view with proper container
          <div className="selected-photos-container">
            <div className="selected-photos-grid">
              {selectedPhotos.map((photo, index) => (
                <div key={photo.id} className="selected-photo-item">
                  <img src={photo.url} alt={`Selected ${index + 1}`} />
                  <button 
                    className="remove-photo-btn"
                    onClick={() => removePhoto(photo.id)}
                  >
                    ×
                  </button>
                  <div className="photo-number">{index + 1}</div>
                </div>
              ))}
              
              {/* Add more photos button (if under limit) */}
              {selectedPhotos.length < 5 && (
                <div className="add-more-photos" onClick={openPhotoSelector}>
                  <div className="add-more-content">
                    <span className="plus-icon">+</span>
                    <span className="add-text">Add</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photo count indicator */}
        {selectedPhotos.length > 0 && (
          <div className="photo-count-status">
            {selectedPhotos.length} of 5 photos selected
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Fixed Navigation - Safe Area Aware */}
      <div className="stage-navigation-fixed">
        <button 
          className="nav-btn secondary" 
          onClick={prevStage} 
          disabled
        >
          Back
        </button>
        <button 
          className="nav-btn primary" 
          onClick={nextStage}
          disabled={!canProceed}
        >
          Continue ({selectedPhotos.length})
        </button>
      </div>
    </div>
  );
};

export default PhotoCaptureStage;