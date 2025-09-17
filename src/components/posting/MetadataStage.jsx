import React, { useState } from 'react';

const MetadataStage = ({ postData, updatePostData, nextStage, prevStage }) => {
  const [caption, setCaption] = useState(postData.caption || '');
  const [postType, setPostType] = useState(postData.postType || 'regular');

  const handleCaptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setCaption(value);
      updatePostData({ caption: value });
    }
  };

  const handleContinue = () => {
    updatePostData({ 
      caption, 
      postType
    });
    nextStage();
  };

  return (
    <div className="metadata-stage-redesigned">
      {/* Fixed Header */}
      <div className="metadata-header">
        <h2>Add Details</h2>
        <p>Tell us about your outfit</p>
      </div>

      {/* Scrollable Content Area */}
      <div className="metadata-content">
        {/* Photo Preview Section */}
        <div className="photo-preview-section">
          <img 
            src={postData.photos[0]?.url} 
            alt="Your outfit"
            className="preview-thumbnail"
          />
          <div className="photo-count-badge">
            {postData.photos.length} photo{postData.photos.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Caption Section */}
        <div className="form-section">
          <label className="form-label">
            Caption <span className="optional-label">(Optional)</span>
          </label>
          <div className="caption-wrapper">
            <textarea
              className="caption-textarea"
              placeholder="What's the vibe? What's the occasion? Share your style story..."
              value={caption}
              onChange={handleCaptionChange}
              rows={3}
            />
            <span className="character-count">{caption.length}/500</span>
          </div>
        </div>

        {/* Post Type Selection */}
        <div className="form-section">
          <label className="form-label">Post Type</label>
          <div className="post-type-selector">
            <button
              className={`type-option ${postType === 'regular' ? 'active' : ''}`}
              onClick={() => setPostType('regular')}
            >
              <span className="type-icon">📸</span>
              <span className="type-label">Regular Post</span>
              <span className="type-desc">Share with everyone</span>
            </button>
            <button
              className={`type-option ${postType === 'story' ? 'active' : ''}`}
              onClick={() => setPostType('story')}
            >
              <span className="type-icon">⏰</span>
              <span className="type-label">Story</span>
              <span className="type-desc">24-hour story</span>
            </button>
          </div>
        </div>

        {/* Style Tips */}
        <div className="style-tips-section">
          <h3>💡 Style Tips</h3>
          <ul>
            <li>Use hashtags to reach more people</li>
            <li>Tag brands to help others discover them</li>
            <li>Share the story behind your outfit</li>
          </ul>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="metadata-navigation">
        <button className="nav-btn secondary" onClick={prevStage}>
          Back
        </button>
        <button className="nav-btn primary" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default MetadataStage;
