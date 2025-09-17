import React from 'react';

const UserProfile = ({ user }) => {
  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <span>👤</span>
        </div>
        <div className="profile-info">
          <h2>Your Profile</h2>
          <p>@{user?.username || 'username'}</p>
        </div>
        <button className="edit-profile-btn">
          Edit
        </button>
      </div>
      
      <div className="profile-stats">
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Posts</span>
        </div>
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Followers</span>
        </div>
        <div className="stat">
          <span className="stat-number">0</span>
          <span className="stat-label">Following</span>
        </div>
      </div>
      
      <div className="profile-posts">
        <div className="profile-posts-placeholder">
          <h3>Your Posts</h3>
          <p>Posts you've shared will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
