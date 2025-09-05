import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Comments from './Comments';

const Post = ({ 
    post, 
    user, 
    getInitial, 
    formatTimestamp, 
    filterByBrand, 
    toggleLike, 
    setCurrentProfile, 
    setView,
    openComments
}) => {
    const isLiked = user && post.likedBy.includes(user.id);
    const [showComments, setShowComments] = useState(false);
    const [commentCount, setCommentCount] = useState(post.commentCount || 0);
    const [showMenu, setShowMenu] = useState(false);
    const [similarPosts, setSimilarPosts] = useState([]);
    const [showSimilar, setShowSimilar] = useState(false);
    const [viewStartTime, setViewStartTime] = useState(null);
    const postRef = useRef(null);

    const trackViewPattern = useCallback(async (postId, duration) => {
        if (!user) return;

        try {
            await supabase
                .from('view_patterns')
                .insert({
                    user_id: user.id,
                    post_id: postId,
                    view_duration: duration,
                    scroll_depth: 0.5 // Simplified for now
                });
        } catch (error) {
            console.log('View tracking error:', error);
        }
    }, [user]);

    const fetchCommentCount = useCallback(async () => {
        try {
            const { count, error } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);
            
            if (error) {
                console.error('Error fetching comment count:', error);
                return;
            }
            
            setCommentCount(count || 0);
        } catch (error) {
            console.error('Error fetching comment count:', error);
        }
    }, [post.id]);

    useEffect(() => {
        fetchCommentCount();
    }, [post.id, fetchCommentCount]);

    useEffect(() => {
        if (!user || !postRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setViewStartTime(Date.now());
                    } else if (viewStartTime) {
                        // Track view duration when post goes out of view
                        const viewDuration = Date.now() - viewStartTime;
                        if (viewDuration > 1000) { // Only track views longer than 1 second
                            trackViewPattern(post.id, viewDuration);
                        }
                        setViewStartTime(null);
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(postRef.current);

        return () => {
            observer.disconnect();
        };
    }, [user, viewStartTime, post.id, trackViewPattern]);

    const findSimilarVibes = async () => {
        // Simple vibe matching based on brand tier and style patterns
        const designerBrands = ['Rick Owens', 'Yohji Yamamoto', 'Comme des Garçons', 'Balenciaga', 'Bottega Veneta', 'Prada', 'Gucci', 'Off-White', 'Vetements', 'Margiela', 'Alyx', 'Acne Studios', 'Our Legacy', 'Lemaire', 'Stone Island', 'Moncler', 'Jil Sander', 'Raf Simons', 'Undercover', 'Issey Miyake'];
        const streetwearBrands = ['Stussy', 'Supreme', 'Palace', 'Kith', 'Fear of God Essentials', 'Brain Dead', 'Online Ceramics', 'Cav Empt', 'Noah', 'ALD', 'JJJJound', 'Awake NY', 'Kapital', 'Needles', 'Human Made', 'John Elliott', 'Rhude', 'Enfants Riches Déprimés', 'Chrome Hearts', 'Gallery Dept'];
        
        const postBrands = Object.values(post.clothingItems);
        const isDesigner = postBrands.some(brand => designerBrands.includes(brand));
        const isStreetwear = postBrands.some(brand => streetwearBrands.includes(brand));
        
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles!user_id (username),
                likes (user_id),
                comments (id)
            `)
            .neq('id', post.id)
            .limit(20);

        // Match by brand tier and similar aesthetic
        if (isDesigner) {
            query = query.or('clothing_items.cs.{' + designerBrands.join(',') + '}');
        } else if (isStreetwear) {
            query = query.or('clothing_items.cs.{' + streetwearBrands.join(',') + '}');
        }

        const { data, error } = await query;
        if (!error && data) {
            const transformedPosts = data.map(p => ({
                id: p.id,
                userId: p.user_id,
                username: p.profiles?.username || 'Unknown',
                imageUrl: p.image_url,
                caption: p.caption,
                clothingItems: p.clothing_items || {},
                isFullBrand: p.is_full_brand,
                fullBrandName: p.full_brand_name,
                likes: p.likes?.length || 0,
                timestamp: p.created_at,
                likedBy: p.likes?.map(like => like.user_id) || [],
                commentCount: p.comments?.length || 0,
                engagement: (p.likes?.length || 0) + (p.comments?.length || 0)
            }));
            setSimilarPosts(transformedPosts);
            setShowSimilar(true);
        }
    };
    
    const formatBrands = () => {
        if (post.isFullBrand) {
            return (
                <span 
                    className="brand-tag full-brand" 
                    onClick={() => filterByBrand(post.fullBrandName, true)}
                >
                    Full {post.fullBrandName}
                </span>
            );
        }
        
        const brandTags = [];
        if (post.clothingItems) {
            Object.entries(post.clothingItems).forEach(([category, brand]) => {
                if (brand) {
                    const displayCategory = category.includes(' - ') 
                        ? category.split(' - ')[1] 
                        : category;
                    
                    brandTags.push(
                        <span 
                            key={`${category}-${brand}`}
                            className="brand-tag" 
                            onClick={() => filterByBrand(brand, false)}
                        >
                            {displayCategory}: {brand}
                        </span>
                    );
                }
            });
        }
        return brandTags;
    };
    
    return (
        <article className="post" ref={postRef}>
            <div className="post-header">
                <div className="avatar">{getInitial(post.username)}</div>
                <span 
                    className="username"
                    onClick={() => {
                        setCurrentProfile({ userId: post.userId, username: post.username });
                        setView('profile');
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {post.username}
                </span>
                <span className="timestamp">{formatTimestamp(post.timestamp)}</span>
            </div>
            <img src={post.imageUrl} alt="Outfit" className="post-image" />
            <div className="post-actions">
                <button 
                    className={`like-btn ${isLiked ? 'liked' : ''}`} 
                    onClick={() => toggleLike(post.id)}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>{post.likes}</span>
                </button>
                <button
                    className="comment-btn"
                    onClick={() => openComments(post)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    💬 <span>{post.commentCount || 0}</span>
                </button>
                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px'
                        }}
                    >
                        ⋯
                    </button>
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: 'var(--card-bg, white)',
                            border: '1px solid var(--border, #ddd)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            minWidth: '160px'
                        }}>
                            <button
                                onClick={() => {
                                    findSimilarVibes();
                                    setShowMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                🎵 Find Similar Vibes
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {post.caption && <div className="post-caption">{post.caption}</div>}
            <div className="post-brands">
                {formatBrands()}
            </div>
            <Comments
                postId={post.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                user={user}
                getInitial={getInitial}
                formatTimestamp={formatTimestamp}
                selectedPost={post}
            />
            {showSimilar && (
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
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '20px',
                            borderBottom: '1px solid var(--border, #e0e0e0)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3>Similar Vibes</h3>
                            <button
                                onClick={() => setShowSimilar(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px'
                        }}>
                            {similarPosts.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#999' }}>
                                    No similar posts found
                                </p>
                            ) : (
                                similarPosts.map(similarPost => (
                                    <Post 
                                        key={similarPost.id} 
                                        post={similarPost} 
                                        user={user}
                                        getInitial={getInitial}
                                        formatTimestamp={formatTimestamp}
                                        filterByBrand={filterByBrand}
                                        toggleLike={toggleLike}
                                        setCurrentProfile={setCurrentProfile}
                                        setView={setView}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default Post;
