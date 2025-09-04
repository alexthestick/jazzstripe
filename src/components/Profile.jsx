import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Post from './Post';

const Profile = ({ 
    userId, 
    username, 
    user, 
    getInitial, 
    setView, 
    setShowCreatePost, 
    toggleFollow, 
    following 
}) => {
    const [profilePosts, setProfilePosts] = useState([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [postCount, setPostCount] = useState(0);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [userProfileTheme, setUserProfileTheme] = useState('streaming');
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    useEffect(() => {
        fetchProfilePosts();
        fetchFollowStats();
        fetchProfileTheme();
    }, [userId, fetchProfilePosts, fetchFollowStats, fetchProfileTheme]);

    const fetchProfileTheme = useCallback(async () => {
        if (user && user.id === userId) {
            const { data } = await supabase
                .from('profiles')
                .select('theme_preference')
                .eq('id', userId)
                .single();
            
            if (data?.theme_preference) {
                setUserProfileTheme(data.theme_preference);
            }
        }
    }, [user, userId]);

    const updateProfileTheme = async (theme) => {
        if (!user || user.id !== userId) return;

        const { error } = await supabase
            .from('profiles')
            .update({ theme_preference: theme })
            .eq('id', userId);

        if (!error) {
            setUserProfileTheme(theme);
            setShowThemeSelector(false);
        }
    };

    const fetchFollowStats = useCallback(async () => {
        const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        const { count: followingNum } = await supabase
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        setFollowerCount(followers || 0);
        setFollowingCount(followingNum || 0);
    }, [userId]);

    const fetchProfilePosts = useCallback(async () => {
        setProfileLoading(true);
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                profiles!user_id (username),
                likes (user_id)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (!error && data) {
            const transformedPosts = data.map(post => ({
                id: post.id,
                userId: post.user_id,
                username: post.profiles?.username || username,
                imageUrl: post.image_url,
                caption: post.caption,
                clothingItems: post.clothing_items || {},
                isFullBrand: post.is_full_brand,
                fullBrandName: post.full_brand_name,
                likes: post.likes?.length || 0,
                timestamp: post.created_at,
                likedBy: post.likes?.map(like => like.user_id) || []
            }));
            setProfilePosts(transformedPosts);
            setPostCount(transformedPosts.length);
        }
        setProfileLoading(false);
    }, [userId, username]);

    return (
        <div className="profile-container">
            <div className="profile-header">
                <button 
                    className="back-button" 
                    onClick={() => setView('feed')}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    ← Back
                </button>
                
                <div className="profile-info" style={{
                    textAlign: 'center',
                    padding: '20px',
                    borderBottom: '1px solid var(--border, #e0e0e0)',
                    marginBottom: '20px'
                }}>
                    <div className="profile-avatar" style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--text, #333)',
                        color: 'var(--bg, #fff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        margin: '0 auto 16px'
                    }}>
                        {getInitial(username)}
                    </div>
                    <h2 style={{ margin: '8px 0' }}>@{username}</h2>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '8px' }}>
                        <span>{followerCount} followers</span>
                        <span>{followingCount} following</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary, #666)' }}>
                        {postCount} {postCount === 1 ? 'outfit' : 'outfits'}
                    </p>
                    {user && user.id === userId ? (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button 
                                className="btn" 
                                onClick={() => {
                                    setView('feed');
                                    setShowCreatePost(true);
                                }}
                            >
                                + New Post
                            </button>
                            <button 
                                className="btn" 
                                onClick={() => setShowThemeSelector(true)}
                                style={{ background: 'var(--accent, #007bff)' }}
                            >
                                🎵 Theme
                            </button>
                        </div>
                    ) : user && user.id !== userId && (
                        <button
                            className="btn"
                            onClick={() => toggleFollow(userId)}
                            style={{ marginTop: '16px' }}
                        >
                            {following.includes(userId) ? 'Unfollow' : 'Follow'}
                        </button>
                    )}
                </div>
            </div>

            <div className={`profile-posts ${userProfileTheme}`}>
                {profileLoading ? (
                    <div className="empty-state">
                        <div className="empty-icon">⏳</div>
                        <h3>Loading outfits...</h3>
                    </div>
                ) : profilePosts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📷</div>
                        <h3>No outfits yet</h3>
                        {user && user.id === userId && (
                            <p>Share your first outfit!</p>
                        )}
                    </div>
                ) : (
                    profilePosts.map(post => (
                        <Post 
                            key={post.id} 
                            post={post} 
                            user={user}
                            getInitial={getInitial}
                            formatTimestamp={() => {}} // Will be passed from parent
                            filterByBrand={() => {}} // Will be passed from parent
                            toggleLike={() => {}} // Will be passed from parent
                            setCurrentProfile={() => {}} // Will be passed from parent
                            setView={setView}
                        />
                    ))
                )}
            </div>

            {showThemeSelector && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--card-bg, white)',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <h3 style={{ marginBottom: '20px' }}>Choose Your Profile Theme</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { key: 'vinyl', name: 'Vinyl', desc: 'Circular grid layout', icon: '💿' },
                                { key: 'cassette', name: 'Cassette', desc: 'Two-column layout', icon: '📼' },
                                { key: 'streaming', name: 'Streaming', desc: 'Continuous scroll', icon: '🎵' }
                            ].map(theme => (
                                <button
                                    key={theme.key}
                                    onClick={() => updateProfileTheme(theme.key)}
                                    style={{
                                        padding: '16px',
                                        border: userProfileTheme === theme.key ? '2px solid var(--accent, #007bff)' : '1px solid var(--border, #ddd)',
                                        borderRadius: '8px',
                                        background: userProfileTheme === theme.key ? 'var(--accent-light, #e3f2fd)' : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                >
                                    <span style={{ fontSize: '24px' }}>{theme.icon}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 'bold' }}>{theme.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{theme.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowThemeSelector(false)}
                            style={{
                                marginTop: '20px',
                                padding: '8px 16px',
                                background: 'var(--border, #ddd)',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
