import React from 'react';

const PostCreation = () => {
  return (
    <div className="post-creation-page">
      <div className="post-creation-header">
        <h2>Create Post</h2>
      </div>
      
      <div className="post-creation-content">
        <div className="post-creation-placeholder">
          <div className="camera-icon">📷</div>
          <h3>Share Your Style</h3>
          <p>Upload a photo of your outfit and share it with the community</p>
          <button className="upload-btn">
            Choose Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCreation;


