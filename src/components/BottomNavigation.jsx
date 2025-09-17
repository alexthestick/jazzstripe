import React from 'react';

const BottomNavigation = ({ activeTab, setActiveTab, user, onNavigate }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'post', icon: '➕', label: 'Post' },
    { id: 'activity', icon: '❤️', label: 'Activity' },
    { id: 'profile', icon: '👤', label: 'Profile' }
  ];

  return (
    <div className="bottom-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onNavigate(tab.id)}
          aria-label={tab.label}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavigation;


