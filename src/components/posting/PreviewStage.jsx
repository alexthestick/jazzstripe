import React, { useState, useCallback } from 'react';

const PreviewStage = ({ 
  postData, 
  updatePostData, 
  nextStage, 
  prevStage, 
  canProceed,
  createPost,
  navigate
}) => {
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = useCallback(async () => {
    if (!postData.photos.length) return;
    
    setIsPosting(true);
    try {
      // Prepare post data for the createPost function
      const postDataForAPI = {
        imageFile: postData.photos[0].file, // Use first photo for now
        caption: postData.caption,
        clothingItems: postData.tags.reduce((acc, tag) => {
          if (tag.brand) {
            acc[tag.category || 'Other'] = tag.brand;
          }
          return acc;
        }, {}),
        isFullBrand: false,
        fullBrandName: '',
        postMode: postData.postMode,
        occasions: postData.occasions
      };

      await createPost(postDataForAPI);
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }, [postData, createPost, navigate]);

  const formatOccasions = (occasions) => {
    if (!occasions.length) return 'No occasions selected';
    return occasions.join(', ');
  };

  return (
    <div className="preview-stage">
      <div className="stage-header">
        <h2>Preview Your Post</h2>
        <p>Review everything before sharing</p>
      </div>

      {/* Post Preview */}
      <div className="post-preview">
        {/* Photos */}
        <div className="preview-photos">
          {postData.photos.map((photo, index) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={`Preview ${index + 1}`}
              className="preview-photo"
            />
          ))}
        </div>

        {/* Post Info */}
        <div className="preview-content">
          {/* Caption */}
          {postData.caption && (
            <div className="preview-caption">
              <p>{postData.caption}</p>
            </div>
          )}

          {/* Tags */}
          {postData.tags.length > 0 && (
            <div className="preview-tags">
              <h4>Tagged Items:</h4>
              <div className="tagged-items">
                {postData.tags.map(tag => (
                  <div key={tag.id} className="tagged-item">
                    <span className="tag-brand">{tag.brand}</span>
                    {tag.category && (
                      <span className="tag-category">({tag.category})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post Details */}
          <div className="preview-details">
            <div className="detail-item">
              <span className="detail-label">Post Type:</span>
              <span className="detail-value">
                {postData.postMode === 'regular' ? 'Regular Post' : 'Story'}
              </span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Occasions:</span>
              <span className="detail-value">
                {formatOccasions(postData.occasions)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Options */}
      <div className="edit-options">
        <button 
          className="edit-btn"
          onClick={() => prevStage()}
        >
          Edit Details
        </button>
        <button 
          className="edit-btn"
          onClick={() => {
            // Go back to tagging stage
            navigate('/create-post?stage=2');
          }}
        >
          Edit Tags
        </button>
      </div>

      {/* Navigation */}
      <div className="stage-navigation">
        <button className="nav-btn secondary" onClick={prevStage}>
          Back
        </button>
        <button 
          className="nav-btn primary post-btn" 
          onClick={handlePost}
          disabled={!canProceed || isPosting}
        >
          {isPosting ? 'Posting...' : 'Post to Jazzstripe'}
        </button>
      </div>
    </div>
  );
};

export default PreviewStage;
