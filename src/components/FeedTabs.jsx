import React from 'react';

const FeedTabs = ({ feedType, setFeedType, user }) => (
    <div style={{
        display: 'flex',
        borderBottom: '2px solid var(--border, #e0e0e0)',
        marginBottom: '20px'
    }}>
        <button
            onClick={() => setFeedType('all')}
            style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: feedType === 'all' ? '2px solid var(--text, #333)' : 'none',
                cursor: 'pointer',
                fontWeight: feedType === 'all' ? 'bold' : 'normal'
            }}
        >
            For You
        </button>
        {user && (
            <button
                onClick={() => setFeedType('following')}
                style={{
                    flex: 1,
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: feedType === 'following' ? '2px solid var(--text, #333)' : 'none',
                    cursor: 'pointer',
                    fontWeight: feedType === 'following' ? 'bold' : 'normal'
                }}
            >
                Following
            </button>
        )}
        <button
            onClick={() => setFeedType('explore')}
            style={{
                flex: 1,
                padding: '12px',
                background: 'none',
                border: 'none',
                borderBottom: feedType === 'explore' ? '2px solid var(--text, #333)' : 'none',
                cursor: 'pointer',
                fontWeight: feedType === 'explore' ? 'bold' : 'normal'
            }}
        >
            Explore
        </button>
    </div>
);

export default FeedTabs;
