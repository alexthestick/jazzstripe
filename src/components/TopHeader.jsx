import React from 'react';

const TopHeader = ({ user, onMenuToggle, onNotifications }) => {
  return (
    <div className="top-header-clean">
      <div className="header-content">
        {/* Logo */}
        <div className="logo-section">
          <h1 className="app-logo">Jazzstripe</h1>
        </div>
        
        {/* Right Actions */}
        <div className="header-actions">
          {user && !user.isGuest && (
            <button className="notification-btn" onClick={onNotifications}>
              📩
            </button>
          )}
          {user && user.isGuest && (
            <button className="sign-in-btn" onClick={() => window.location.reload()}>
              Sign In
            </button>
          )}
          <button className="menu-btn" onClick={onMenuToggle}>
            ☰
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopHeader;

