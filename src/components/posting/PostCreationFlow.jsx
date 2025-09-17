import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PhotoCaptureStage from './PhotoCaptureStage';
import VisualTaggingStage from './VisualTaggingStage';
import MetadataStage from './MetadataStage';
import PreviewStage from './PreviewStage';

const PostCreationFlow = ({ user, createPost, BRANDS, CATEGORIES }) => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(1);
  const [postData, setPostData] = useState({
    photos: [],
    tags: [],
    caption: '',
    postMode: 'regular',
    occasions: [],
    isFullBrand: false,
    fullBrandName: ''
  });

  const stages = [
    { id: 1, name: 'Photo', component: PhotoCaptureStage },
    { id: 2, name: 'Tag', component: VisualTaggingStage },
    { id: 3, name: 'Details', component: MetadataStage },
    { id: 4, name: 'Preview', component: PreviewStage }
  ];

  const updatePostData = useCallback((updates) => {
    setPostData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStage = () => {
    if (currentStage < 4) setCurrentStage(currentStage + 1);
  };

  const prevStage = () => {
    if (currentStage > 1) setCurrentStage(currentStage - 1);
  };

  // FIXED: Navigate back to home instead of using callback
  const handleClose = () => {
    navigate('/'); // This will work with the new routing structure
  };

  const canProceed = () => {
    switch (currentStage) {
      case 1: return postData.photos.length > 0;
      case 2: return true; // Tags are optional
      case 3: return true; // Caption optional
      case 4: return true;
      default: return false;
    }
  };

  // Enhanced createPost handler with navigation
  const handleCreatePost = async (postDataForAPI) => {
    try {
      await createPost(postDataForAPI);
      // Navigate back to home after successful post creation
      navigate('/');
    } catch (error) {
      console.error('Error creating post:', error);
      // Don't navigate on error - let user try again
      throw error;
    }
  };

  const CurrentStageComponent = stages[currentStage - 1].component;

  return (
    <div className="post-creation-flow">
      {/* Header with progress */}
      <div className="post-creation-header">
        <button className="close-btn" onClick={handleClose}>✕</button>
        <div className="stage-progress">
          {stages.map(stage => (
            <div 
              key={stage.id}
              className={`progress-dot ${currentStage >= stage.id ? 'active' : ''}`}
            >
              <span>{stage.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Content */}
      <div className="stage-content">
        <CurrentStageComponent
          postData={postData}
          updatePostData={updatePostData}
          nextStage={nextStage}
          prevStage={prevStage}
          canProceed={canProceed()}
          currentStage={currentStage}
          user={user}
          createPost={handleCreatePost} // Use our enhanced wrapper
          BRANDS={BRANDS}
          CATEGORIES={CATEGORIES}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default PostCreationFlow;
