import React from 'react';
import Post from './Post';

const Feed = ({ 
    loading, 
    posts, 
    filter, 
    user, 
    getInitial, 
    formatTimestamp, 
    filterByBrand, 
    toggleLike, 
    setCurrentProfile, 
    setView,
    openComments
}) => {
    if (loading) {
        return (
            <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h3>Loading outfits...</h3>
            </div>
        );
    }

    let filteredPosts = [...posts];
    
    if (filter) {
        filteredPosts = posts.filter(post => {
            if (filter.fullBrand) {
                return post.isFullBrand && post.fullBrandName === filter.brand;
            } else {
                if (post.clothingItems) {
                    return Object.values(post.clothingItems).includes(filter.brand);
                }
                return false;
            }
        });
    }
    
    if (filteredPosts.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📷</div>
                <h3>No outfits yet</h3>
                <p>Be the first to share your style!</p>
            </div>
        );
    }
    
    return filteredPosts.map(post => (
        <Post 
            key={post.id} 
            post={post} 
            user={user}
            getInitial={getInitial}
            formatTimestamp={formatTimestamp}
            filterByBrand={filterByBrand}
            toggleLike={toggleLike}
            setCurrentProfile={setCurrentProfile}
            setView={setView}
            openComments={openComments}
        />
    ));
};

export default Feed;
