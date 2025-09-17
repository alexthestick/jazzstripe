import React, { useState } from 'react';

const ActivityFeed = () => {
  const [activityType, setActivityType] = useState('all');
  
  return (
    <div className="activity-page">
      <div className="activity-header">
        <h2>Activity</h2>
      </div>
      
      <div className="activity-filters">
        <button 
          className={`activity-filter ${activityType === 'all' ? 'active' : ''}`}
          onClick={() => setActivityType('all')}
        >
          All
        </button>
        <button 
          className={`activity-filter ${activityType === 'likes' ? 'active' : ''}`}
          onClick={() => setActivityType('likes')}
        >
          Likes
        </button>
        <button 
          className={`activity-filter ${activityType === 'comments' ? 'active' : ''}`}
          onClick={() => setActivityType('comments')}
        >
          Comments
        </button>
        <button 
          className={`activity-filter ${activityType === 'follows' ? 'active' : ''}`}
          onClick={() => setActivityType('follows')}
        >
          Follows
        </button>

        
      </div>
      
      <div className="activity-list">
        {activityType === 'all' && (
          <div className="activity-placeholder">
            <h3>All Activity</h3>
            <p>Your recent activity will appear here</p>
          </div>
        )}
        {activityType === 'likes' && (
          <div className="activity-placeholder">
            <h3>Likes</h3>
            <p>Posts you've liked will appear here</p>
          </div>
        )}
        {activityType === 'comments' && (
          <div className="activity-placeholder">
            <h3>Comments</h3>
            <p>Comments on your posts will appear here</p>
          </div>
        )}
        {activityType === 'follows' && (
          <div className="activity-placeholder">
            <h3>Follows</h3>
            <p>New followers will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;


