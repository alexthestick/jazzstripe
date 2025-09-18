import React from 'react';
import Feed from './Feed';

const HomeFeed = ({ 
  loading, 
  posts, 
  filter, 
  user, 
  getInitial, 
  formatTimestamp, 
  filterByBrand, 
  toggleLike, 
  setCurrentProfile, 
  openComments,
  feedType,
  setFeedType
}) => {
  
  return (
    <>
      {/* Move feed-tabs OUTSIDE of home-feed wrapper */}
      <div className="feed-tabs">
        <button 
          className={`feed-tab ${feedType === 'foryou' ? 'active' : ''}`}
          onClick={() => setFeedType('foryou')}
        >
          For You
        </button>
        <button 
          className={`feed-tab ${feedType === 'following' ? 'active' : ''}`}
          onClick={() => setFeedType('following')}
        >
          Following
        </button>
        <button 
          className={`feed-tab ${feedType === 'explore' ? 'active' : ''}`}
          onClick={() => setFeedType('explore')}
        >
          Explore
        </button>
      </div>
      
      {/* Feed content */}
      <div className="home-feed">
        <div className="feed-content">
          <Feed 
            loading={loading}
            posts={posts}
            filter={filter}
            user={user}
            getInitial={getInitial}
            formatTimestamp={formatTimestamp}
            filterByBrand={filterByBrand}
            toggleLike={toggleLike}
            setCurrentProfile={setCurrentProfile}
            openComments={openComments}
          />
        </div>
      </div>
    </>
  );
};

export default HomeFeed;
