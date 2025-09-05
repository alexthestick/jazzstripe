import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { supabase } from './lib/supabase';

// Import components
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import FeedTabs from './components/FeedTabs';
import Feed from './components/Feed';
import SearchModal from './components/SearchModal';
import CreatePostModal from './components/CreatePostModal';
import Profile from './components/Profile';
import AuthModal from './components/AuthModal';
import PostPage from './components/PostPage';
import useIsMobile from './hooks/useIsMobile';

// Brand list
const BRANDS = [
    // Mainstream
    'Nike', 'Adidas', 'New Balance', 'Puma', 'Converse',
    'Uniqlo', 'Zara', 'H&M', 'COS', 'Gap',
    'Levi\'s', 'Carhartt', 'Dickies', 'Champion',
    'North Face', 'Patagonia', 'Arc\'teryx',
    'Stussy', 'Supreme', 'Palace', 'Kith',
    'Fear of God Essentials',
    // Designer/High-End
    'Rick Owens', 'Yohji Yamamoto', 'Comme des Garçons',
    'Balenciaga', 'Bottega Veneta', 'Prada', 'Gucci',
    'Off-White', 'Vetements', 'Margiela', 'Alyx',
    'Acne Studios', 'Our Legacy', 'Lemaire',
    'Stone Island', 'Moncler', 'Jil Sander',
    'Raf Simons', 'Undercover', 'Issey Miyake',
    // Streetwear/Contemporary
    'Brain Dead', 'Online Ceramics', 'Cav Empt',
    'Noah', 'ALD', 'JJJJound', 'Awake NY',
    'Salomon', 'Hoka', 'ASICS',
    'Kapital', 'Needles', 'Human Made', 'Jiyongkim', 'Junya Watanabe',
    'John Elliott', 'Rhude', 'Enfants Riches Déprimés',
    'Chrome Hearts', 'Gallery Dept'
].sort();

// Categories and subcategories structure
const CATEGORIES = {
    'Tops': ['Button Up', 'Jacket', 'T-Shirt', 'Sweater'],
    'Bottoms': ['Pants', 'Denim', 'Shorts'],
    'Outerwear': [],
    'Footwear': [],
    'Tailoring': ['Blazer', 'Suit'],
    'Accessories': ['Hats', 'Belt', 'Glasses']
};

// Sample posts data removed - now using Supabase data

function App() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [view, setView] = useState('feed');
    const [currentProfile, setCurrentProfile] = useState(null);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    // Search query state removed - now handled in SearchModal
    const [searchFullBrand, setSearchFullBrand] = useState(false);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState([]);
    const [feedType, setFeedType] = useState('all'); // 'all', 'following', 'explore'
    // Profile theme state removed - now handled in Profile component
    
    // Comments state
    const [showComments, setShowComments] = useState(false);
    const [selectedPostComments, setSelectedPostComments] = useState(null);
    const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    
    // Threading and voting state
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyTexts, setReplyTexts] = useState({});
    const [collapsedThreads, setCollapsedThreads] = useState(new Set());
    const [commentVotes, setCommentVotes] = useState({});

    // Mobile detection
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize dark mode preference and check for existing session
    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        }
        
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.error('Error getting session:', error);
                return;
            }
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    username: session.user.user_metadata?.username || session.user.email.split('@')[0]
                });
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    username: session.user.user_metadata?.username || session.user.email.split('@')[0]
                });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Update body class when dark mode changes
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // Smart explore feed functions
    const analyzeUserPreferences = useCallback((posts, viewPatterns) => {
        const preferences = {
            brands: new Map(),
            silhouettes: new Map(),
            colorMoods: new Map()
        };

        // Analyze viewed posts
        viewPatterns.forEach(pattern => {
            const post = posts.find(p => p.id === pattern.post_id);
            if (!post) return;

            // Track brand preferences
            Object.values(post.clothingItems).forEach(brand => {
                preferences.brands.set(brand, (preferences.brands.get(brand) || 0) + pattern.view_duration);
            });

            // Simple silhouette detection (placeholder)
            const isOversized = post.caption?.toLowerCase().includes('oversized') || 
                               post.caption?.toLowerCase().includes('baggy');
            const silhouette = isOversized ? 'oversized' : 'fitted';
            preferences.silhouettes.set(silhouette, (preferences.silhouettes.get(silhouette) || 0) + pattern.view_duration);

            // Simple color mood detection (placeholder)
            const isMonochrome = post.caption?.toLowerCase().includes('monochrome') || 
                               post.caption?.toLowerCase().includes('black and white');
            const colorMood = isMonochrome ? 'monochrome' : 'colorful';
            preferences.colorMoods.set(colorMood, (preferences.colorMoods.get(colorMood) || 0) + pattern.view_duration);
        });

        return preferences;
    }, []);

    const calculatePreferenceScore = useCallback((post, preferences) => {
        let score = 0;

        // Brand affinity
        Object.values(post.clothingItems).forEach(brand => {
            score += preferences.brands.get(brand) || 0;
        });

        // Silhouette preference
        const isOversized = post.caption?.toLowerCase().includes('oversized') || 
                           post.caption?.toLowerCase().includes('baggy');
        const silhouette = isOversized ? 'oversized' : 'fitted';
        score += preferences.silhouettes.get(silhouette) || 0;

        // Color mood preference
        const isMonochrome = post.caption?.toLowerCase().includes('monochrome') || 
                           post.caption?.toLowerCase().includes('black and white');
        const colorMood = isMonochrome ? 'monochrome' : 'colorful';
        score += preferences.colorMoods.get(colorMood) || 0;

        return score;
    }, []);

    const generateSmartExploreFeed = useCallback(async (posts) => {
        if (!user) return posts;

        // Get user's viewing patterns
        const { data: viewPatterns } = await supabase
            .from('view_patterns')
            .select('post_id, view_duration')
            .eq('user_id', user.id)
            .gte('view_duration', 2000); // Only consider views longer than 2 seconds

        if (!viewPatterns || viewPatterns.length === 0) {
            // No patterns yet, return engagement-sorted posts
            return posts.sort((a, b) => b.engagement - a.engagement);
        }

        // Analyze user preferences
        const userPreferences = analyzeUserPreferences(posts, viewPatterns);
        
        // Score posts based on preferences
        const scoredPosts = posts.map(post => ({
            ...post,
            preferenceScore: calculatePreferenceScore(post, userPreferences)
        }));

        // Sort by preference score
        scoredPosts.sort((a, b) => b.preferenceScore - a.preferenceScore);

        // Mix 70% taste-based with 30% random discovery
        const tasteBasedCount = Math.floor(posts.length * 0.7);
        // discoveryCount variable removed - not used

        const tasteBased = scoredPosts.slice(0, tasteBasedCount);
        const discovery = scoredPosts.slice(tasteBasedCount);
        
        // Shuffle discovery posts
        const shuffledDiscovery = discovery.sort(() => Math.random() - 0.5);

        return [...tasteBased, ...shuffledDiscovery];
    }, [user, analyzeUserPreferences, calculatePreferenceScore]);

    // Move fetchPosts before useEffect calls
    const fetchPosts = useCallback(async () => {
        try {
        setLoading(true);
            
            // Fetch posts with profiles and likes
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles!user_id (username),
                    likes (user_id)
            `);

        if (feedType === 'following' && user && following.length > 0) {
            query = query.in('user_id', following);
        } else if (feedType === 'explore') {
            // For explore, show posts from last 7 days sorted by engagement
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('created_at', weekAgo.toISOString());
        }

            const { data: postsData, error: postsError } = await query
            .order('created_at', { ascending: false })
            .limit(50);
        
            if (postsError) throw postsError;

            // Fetch comment counts
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('post_id');

            if (commentsError) throw commentsError;

            // Count comments per post
            const commentCounts = commentsData.reduce((acc, comment) => {
                acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
                return acc;
            }, {});

            // Format posts
            let transformedPosts = postsData.map(post => ({
                id: post.id,
                userId: post.user_id,
                username: post.profiles?.username || 'Unknown',
                imageUrl: post.image_url,
                caption: post.caption,
                clothingItems: post.clothing_items || {},
                isFullBrand: post.is_full_brand,
                fullBrandName: post.full_brand_name,
                likes: post.likes?.length || 0,
                timestamp: post.created_at,
                likedBy: post.likes?.map(like => like.user_id) || [],
                commentCount: commentCounts[post.id] || 0,
                engagement: (post.likes?.length || 0) + (commentCounts[post.id] || 0)
            }));

            // Smart explore algorithm: 70% taste-based, 30% discovery
            if (feedType === 'explore' && user) {
                transformedPosts = await generateSmartExploreFeed(transformedPosts);
            } else if (feedType === 'explore') {
                // Sort by engagement for non-logged-in users
                transformedPosts.sort((a, b) => b.engagement - a.engagement);
            }

            setPosts(transformedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
        setLoading(false);
        }
    }, [feedType, following, user, generateSmartExploreFeed]);

    // Fetch posts from Supabase
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const fetchFollowing = useCallback(async () => {
        if (!user) return;

        const { data } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id);

        if (data) {
            setFollowing(data.map(f => f.following_id));
        }
    }, [user]);

    // Fetch following when user logs in
    useEffect(() => {
        if (user) {
            fetchFollowing();
        }
    }, [user, fetchFollowing]);

    // Realtime updates for posts
    useEffect(() => {
        const channel = supabase
            .channel('posts-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);

    // Realtime updates for comments
    useEffect(() => {
        const commentsChannel = supabase
            .channel('comments-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'comments' },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch the new comment with user info
                        const { data } = await supabase
                            .from('comments')
                            .select(`
                                *,
                                profiles:user_id (username)
                            `)
                            .eq('id', payload.new.id)
                            .single();

                        if (data) {
                            const newComment = {
                                id: data.id,
                                postId: data.post_id,
                                userId: data.user_id,
                                username: data.profiles?.username || 'Anonymous',
                                content: data.content,
                                timestamp: new Date(data.created_at).toLocaleString()
                            };

                            setComments(prev => ({
                                ...prev,
                                [data.post_id]: [...(prev[data.post_id] || []), newComment]
                            }));

                            // Update comment count
                            setPosts(prevPosts => 
                                prevPosts.map(post => 
                                    post.id === data.post_id 
                                        ? { ...post, commentCount: (post.commentCount || 0) + 1 }
                                        : post
                                )
                            );
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(commentsChannel);
        };
    }, []);

    // Helper Functions
    // generateId function removed - using Supabase auto-generated IDs

    const getLogoSvg = () => (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
            <path d="M 20 10 L 20 30 Q 20 35, 25 35 Q 30 35, 30 30 L 30 10 Q 30 5, 35 5 Q 40 5, 40 10 L 40 30 Q 40 35, 45 35 Q 50 35, 50 30 L 50 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M 60 10 L 60 30 Q 60 35, 65 35 Q 70 35, 70 30 L 70 10 Q 70 5, 75 5 Q 80 5, 80 10 L 80 30 Q 80 35, 85 35 Q 90 35, 90 30 L 90 10 Q 90 5, 95 5 Q 100 5, 100 10 L 100 30 Q 100 35, 105 35 Q 110 35, 110 30 L 110 10 Q 110 5, 115 5 Q 120 5, 120 10 L 120 30 Q 120 35, 125 35 Q 130 35, 130 30 L 130 10 Q 130 5, 135 5 Q 140 5, 140 10 L 140 30 Q 140 35, 145 35 Q 150 35, 150 30 L 150 10 Q 150 5, 155 5 Q 160 5, 160 10 L 160 30 Q 160 35, 165 35 Q 170 35, 170 30 L 170 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
    );

    // CommentThread Component
    const CommentThread = ({ comment, depth = 0 }) => {
        // Safety check
        if (!comment) {
            return <div>Error: Invalid comment</div>;
        }
        
        const isCollapsed = collapsedThreads.has(comment.id);
        const hasReplies = comment.replies && comment.replies.length > 0;
        const maxDepth = 5;
        const shouldIndent = depth > 0 && depth <= maxDepth;

        const handleReply = () => {
            setReplyingTo(comment.id);
            setReplyTexts(prev => ({
                ...prev,
                [comment.id]: ''
            }));
        };

        const handleReplySubmit = () => {
            const replyText = replyTexts[comment.id];
            if (replyText && replyText.trim()) {
                postComment(selectedPostComments.id, comment.id, replyText);
            }
        };

        const toggleCollapse = () => {
            setCollapsedThreads(prev => {
                const newSet = new Set(prev);
                if (newSet.has(comment.id)) {
                    newSet.delete(comment.id);
                } else {
                    newSet.add(comment.id);
                }
                return newSet;
            });
        };

        return (
            <div 
                className={`comment-thread ${shouldIndent ? 'indented' : ''}`}
                style={{ marginLeft: shouldIndent ? `${Math.min(depth, maxDepth) * 20}px` : '0' }}
            >
                <div className="comment">
                    <div className="comment-voting">
                        <button 
                            className={`vote-btn upvote ${comment.userVote === 'upvote' ? 'active' : ''}`}
                            onClick={() => voteComment(comment.id, 'upvote')}
                        >
                            ▲
                        </button>
                        <span className="comment-score">{comment.score || 0}</span>
                        <button 
                            className={`vote-btn downvote ${comment.userVote === 'downvote' ? 'active' : ''}`}
                            onClick={() => voteComment(comment.id, 'downvote')}
                        >
                            ▼
                        </button>
                    </div>
                    
                    <div className="comment-content-wrapper">
                        <div className="comment-header">
                            <span className="comment-username">@{comment.username}</span>
                            <span className="comment-timestamp">{comment.timestamp}</span>
                            {hasReplies && (
                                <button 
                                    className="collapse-btn"
                                    onClick={toggleCollapse}
                                >
                                    {isCollapsed ? '▶' : '▼'}
                                </button>
                            )}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                        <div className="comment-actions">
                            <button 
                                className="reply-btn"
                                onClick={handleReply}
                            >
                                Reply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reply input */}
                {replyingTo === comment.id && (
                    <div className="reply-input-section">
                        <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyTexts[comment.id] || ''}
                            onChange={(e) => setReplyTexts(prev => ({
                                ...prev,
                                [comment.id]: e.target.value
                            }))}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleReplySubmit();
                                }
                            }}
                            className="reply-input"
                            autoFocus
                        />
                        <div className="reply-actions">
                            <button 
                                onClick={handleReplySubmit}
                                className="reply-submit-button"
                                disabled={!replyTexts[comment.id]?.trim()}
                            >
                                Reply
                            </button>
                            <button 
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyTexts(prev => ({
                                        ...prev,
                                        [comment.id]: ''
                                    }));
                                }}
                                className="reply-cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Nested replies */}
                {hasReplies && !isCollapsed && (
                    <div className="comment-replies">
                        {comment.replies.map(reply => (
                            <CommentThread 
                                key={reply.id} 
                                comment={reply} 
                                depth={depth + 1} 
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Comments Modal Component
    const CommentsModal = () => {
        // Don't render on mobile - mobile uses PostPage navigation
        if (isMobile || !showComments || !selectedPostComments) return null;

        const postComments = comments[selectedPostComments.id] || [];

        return (
            <div className="modal-overlay" onClick={() => setShowComments(false)}>
                <div className="modal-content comments-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Comments</h2>
                        <button className="close-button" onClick={() => setShowComments(false)}>✕</button>
                    </div>
                    
                    <div className="comments-post-info">
                        <span className="username">@{selectedPostComments.username}</span>
                        <p className="caption">{selectedPostComments.caption}</p>
                    </div>

                    <div className="comments-list">
                        {loadingComments ? (
                            <div className="loading">Loading comments...</div>
                        ) : postComments.length === 0 ? (
                            <div className="no-comments">No comments yet. Be the first!</div>
                        ) : (
                            <div>
                                <div>Found {postComments.length} comments</div>
                                {postComments.map(comment => {
                                    try {
                                        return <CommentThread key={comment.id} comment={comment} />;
                                    } catch (error) {
                                        console.error('Error rendering comment:', error, comment);
                                        return (
                                            <div key={comment.id} className="comment">
                                                <div className="comment-header">
                                                    <span className="comment-username">@{comment.username}</span>
                                                    <span className="comment-timestamp">{comment.timestamp}</span>
                                                </div>
                                                <p className="comment-content">{comment.content}</p>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>

                    <div className="comment-input-section">
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    postComment(selectedPostComments.id);
                                }
                            }}
                            className="comment-input"
                        />
                        <button 
                            onClick={() => postComment(selectedPostComments.id)}
                            className="comment-submit-button"
                            disabled={!commentText.trim()}
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const getInitial = (username) => {
        return username ? username[0].toUpperCase() : '?';
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (hours < 1) return 'just now';
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
    };


    // Event Handlers
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const toggleLike = async (postId) => {
        if (!user) {
            setView('auth');
            return;
        }
        
        const post = posts.find(p => p.id === postId);
        const isLiked = post.likedBy.includes(user.id);
        
        if (isLiked) {
            await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);
                    } else {
            await supabase
                .from('likes')
                .insert({
                    post_id: postId,
                    user_id: user.id
                });
        }
        
        // Refresh posts to update like counts
        await fetchPosts();
    };

    const filterByBrand = (brand, isFullBrand) => {
        setFilter({ brand, fullBrand: isFullBrand });
        window.scrollTo(0, 0);
    };

    const clearFilter = () => {
        setFilter(null);
    };

    const goHome = () => {
        clearFilter();
        setCurrentProfile(null);
        setView('feed');
        window.scrollTo(0, 0);
    };

    const handleAuth = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const username = formData.get('username');
        const password = formData.get('password');
        const isSignUp = formData.get('authType') === 'signup';
        
        try {
            if (isSignUp) {
                // Sign up new user
                console.log('Attempting sign up for:', email);
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username }
                    }
                });
                
                if (error) {
                    console.error('Sign up error:', error);
                    alert(`Sign up failed: ${error.message}`);
                    return;
                }
                
                // Create profile
                if (data.user) {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: data.user.id,
            username: username
                        });
                    
                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                    }
                }
                
                alert('Sign up successful! Please check your email to verify your account.');
            } else {
                // Sign in existing user
                console.log('Attempting sign in for:', email);
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) {
                    console.error('Sign in error:', error);
                    alert(`Sign in failed: ${error.message}`);
                    return;
                }
                
                if (data.user) {
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        username: data.user.user_metadata?.username || email.split('@')[0]
        });
        setView('feed');
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Authentication failed. Please try again.');
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const skipAuth = () => {
        setView('feed');
    };

    const toggleFollow = async (userId) => {
        if (!user) {
            setView('auth');
            return;
        }

        const isFollowing = following.includes(userId);

        if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', userId);

            setFollowing(following.filter(id => id !== userId));
        } else {
            await supabase
                .from('follows')
                .insert({
                    follower_id: user.id,
                    following_id: userId
                });

            setFollowing([...following, userId]);
        }
    };

    const createPost = async (postData) => {
        if (!user) {
            alert('Please sign in to post');
            return;
        }

        try {
            // Upload image to Supabase storage
            const file = postData.imageFile;
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('outfits')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('outfits')
                .getPublicUrl(fileName);

            // Create post in database
            const { error: postError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    caption: postData.caption,
                    clothing_items: postData.clothingItems,
                    is_full_brand: postData.isFullBrand,
                    full_brand_name: postData.fullBrandName,
                    post_mode: postData.postMode || 'regular'
                });

            if (postError) throw postError;

            // Refresh posts
            await fetchPosts();
            setShowCreatePost(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    };

    // Comments functions
    const fetchComments = async (postId) => {
        try {
            setLoadingComments(true);
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (username)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching comments:', error);
                throw error;
            }
            

            // Build nested tree structure
            const commentMap = new Map();
            const rootComments = [];
            
            // If no comments, return empty array
            if (!data || data.length === 0) {
                setComments(prev => ({
                    ...prev,
                    [postId]: []
                }));
                return [];
            }

            // First pass: create comment objects and track user votes
            data.forEach(comment => {
                const userVote = comment.comment_votes?.find(vote => vote.user_id === user?.id);
                
                const commentObj = {
                    id: comment.id,
                    postId: comment.post_id,
                    userId: comment.user_id,
                    username: comment.profiles?.username || 'Anonymous',
                    content: comment.content,
                    timestamp: new Date(comment.created_at).toLocaleString(),
                    parentId: comment.parent_id || null,
                    depth: comment.depth || 0,
                    path: comment.path || [],
                    upvotes: comment.upvotes || 0,
                    downvotes: comment.downvotes || 0,
                    score: (comment.upvotes || 0) - (comment.downvotes || 0),
                    userVote: userVote?.vote_type || null,
                    replies: []
                };
                

                commentMap.set(comment.id, commentObj);
                
                // Track user votes
                if (userVote) {
                    setCommentVotes(prev => ({
                        ...prev,
                        [comment.id]: userVote.vote_type
                    }));
                }
            });

            // Second pass: build tree structure
            commentMap.forEach(comment => {
                if (comment.parentId) {
                    const parent = commentMap.get(comment.parentId);
                    if (parent) {
                        parent.replies.push(comment);
                    } else {
                        // If parent not found, treat as root comment
                        rootComments.push(comment);
                    }
                } else {
                    rootComments.push(comment);
                }
            });

            // Sort replies by score
            const sortComments = (comments) => {
                comments.sort((a, b) => b.score - a.score);
                comments.forEach(comment => {
                    if (comment.replies.length > 0) {
                        sortComments(comment.replies);
                    }
                });
            };
            sortComments(rootComments);

            setComments(prev => ({
                ...prev,
                [postId]: rootComments
            }));
            
            return rootComments;
        } catch (error) {
            console.error('Error fetching comments:', error);
            return [];
        } finally {
            setLoadingComments(false);
        }
    };

    const postComment = async (postId, parentId = null, replyText = null) => {
        const text = replyText || commentText;
        if (!text.trim()) return;
        
        try {
            let parentComment = null;
            let depth = 0;
            let path = [];

            if (parentId) {
                // Find parent comment to calculate depth and path
                const findParent = (comments) => {
                    for (const comment of comments) {
                        if (comment.id === parentId) {
                            return comment;
                        }
                        if (comment.replies.length > 0) {
                            const found = findParent(comment.replies);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                parentComment = findParent(comments[postId] || []);
                if (parentComment) {
                    depth = parentComment.depth + 1;
                    path = [...(parentComment.path || []), parentId];
                }
            }

            const { data, error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: text.trim(),
                    parent_id: parentId,
                    depth: depth,
                    path: path
                })
                .select()
                .single();

            if (error) throw error;

            // Add the new comment to state immediately
            const newComment = {
                id: data.id,
                postId: data.post_id,
                userId: data.user_id,
                username: user.username,
                content: data.content,
                timestamp: new Date(data.created_at).toLocaleString(),
                parentId: data.parent_id,
                depth: data.depth,
                path: data.path,
                upvotes: 0,
                downvotes: 0,
                score: 0,
                userVote: null,
                replies: []
            };

            // Add to tree structure
            if (parentId && parentComment) {
                // Add as reply to parent
                const addToTree = (comments) => {
                    for (const comment of comments) {
                        if (comment.id === parentId) {
                            comment.replies.push(newComment);
                            return true;
                        }
                        if (comment.replies.length > 0 && addToTree(comment.replies)) {
                            return true;
                        }
                    }
                    return false;
                };
                
                setComments(prev => {
                    const newComments = { ...prev };
                    if (newComments[postId]) {
                        addToTree(newComments[postId]);
                    }
                    return newComments;
                });
            } else {
                // Add as root comment
                setComments(prev => ({
                    ...prev,
                    [postId]: [...(prev[postId] || []), newComment]
                }));
            }

            // Clear input
            if (replyText) {
                setReplyTexts(prev => ({
                    ...prev,
                    [parentId]: ''
                }));
                setReplyingTo(null);
            } else {
                setCommentText('');
            }
            
            // Update comment count in posts
            setPosts(prevPosts => 
                prevPosts.map(post => 
                    post.id === postId 
                        ? { ...post, commentCount: (post.commentCount || 0) + 1 }
                        : post
                )
            );
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment');
        }
    };

    const voteComment = async (commentId, voteType) => {
        if (!user) {
            alert('Please sign in to vote');
            return;
        }

        try {
            
            // Try RPC function first, fallback to manual voting if it doesn't exist
            let error;
            try {
                const { error: rpcError } = await supabase.rpc('handle_comment_vote', {
                    p_comment_id: commentId,
                    p_user_id: user.id,
                    p_vote_type: voteType
                });
                error = rpcError;
            } catch (rpcError) {
                // Fallback: Manual voting logic
                const currentVote = commentVotes[commentId];
                
                if (currentVote === voteType) {
                    // Remove vote
                    await supabase
                        .from('comment_votes')
                        .delete()
                        .eq('comment_id', commentId)
                        .eq('user_id', user.id);
                    
                    // Update comment counts
                    const updateField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
                    await supabase
                        .from('comments')
                        .update({ [updateField]: supabase.raw(`${updateField} - 1`) })
                        .eq('id', commentId);
                } else {
                    // Add or change vote
                    await supabase
                        .from('comment_votes')
                        .upsert({
                            comment_id: commentId,
                            user_id: user.id,
                            vote_type: voteType
                        });
                    
                    if (currentVote) {
                        // Change vote - remove old vote count
                        const oldField = currentVote === 'upvote' ? 'upvotes' : 'downvotes';
                        await supabase
                            .from('comments')
                            .update({ [oldField]: supabase.raw(`${oldField} - 1`) })
                            .eq('id', commentId);
                    }
                    
                    // Add new vote count
                    const newField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
                    await supabase
                        .from('comments')
                        .update({ [newField]: supabase.raw(`${newField} + 1`) })
                        .eq('id', commentId);
                }
                error = null;
            }

            if (error) {
                console.error('Error voting on comment:', error);
                throw error;
            }

            // Update local state optimistically
            setCommentVotes(prev => ({
                ...prev,
                [commentId]: prev[commentId] === voteType ? null : voteType
            }));

            // Update comment scores in the tree
            const updateCommentScore = (comments) => {
                return comments.map(comment => {
                    if (comment.id === commentId) {
                        const currentVote = commentVotes[commentId];
                        const newVote = currentVote === voteType ? null : voteType;
                        
                        let upvoteChange = 0;
                        let downvoteChange = 0;
                        
                        if (currentVote === 'upvote' && newVote === null) {
                            upvoteChange = -1;
                        } else if (currentVote === 'downvote' && newVote === null) {
                            downvoteChange = -1;
                        } else if (currentVote === 'upvote' && newVote === 'downvote') {
                            upvoteChange = -1;
                            downvoteChange = 1;
                        } else if (currentVote === 'downvote' && newVote === 'upvote') {
                            upvoteChange = 1;
                            downvoteChange = -1;
                        } else if (currentVote === null && newVote === 'upvote') {
                            upvoteChange = 1;
                        } else if (currentVote === null && newVote === 'downvote') {
                            downvoteChange = 1;
                        }

                        return {
                            ...comment,
                            upvotes: Math.max(0, comment.upvotes + upvoteChange),
                            downvotes: Math.max(0, comment.downvotes + downvoteChange),
                            score: Math.max(0, comment.upvotes + upvoteChange) - Math.max(0, comment.downvotes + downvoteChange),
                            userVote: newVote
                        };
                    }
                    
                    if (comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentScore(comment.replies)
                        };
                    }
                    
                    return comment;
                });
            };

            setComments(prev => {
                const newComments = { ...prev };
                if (newComments[selectedPostComments?.id]) {
                    newComments[selectedPostComments.id] = updateCommentScore(newComments[selectedPostComments.id]);
                }
                return newComments;
            });

        } catch (error) {
            console.error('Error voting on comment:', error);
            alert('Failed to vote on comment');
        }
    };

    const openComments = async (post) => {
        console.log('openComments called:', { isMobile, postId: post.id, windowWidth: window.innerWidth });
        
        if (isMobile) {
            // Mobile: Navigate to dedicated post page
            console.log('Navigating to mobile post page:', `/post/${post.id}`);
            navigate(`/post/${post.id}`);
        } else {
            // Desktop: Open side panel
            console.log('Opening desktop side panel');
            setSelectedPostComments(post);
            setShowComments(true);
            await fetchComments(post.id);
        }
    };

    // Main render
    if (view === 'auth' && !user) {
        return <AuthModal handleAuth={handleAuth} skipAuth={skipAuth} getLogoSvg={getLogoSvg} />;
    }

    if (view === 'profile' && currentProfile) {
        return (
            <div>
                <Header 
                    user={user}
                    darkMode={darkMode}
                    goHome={goHome}
                    toggleTheme={toggleTheme}
                    setShowSearch={setShowSearch}
                    setShowCreatePost={setShowCreatePost}
                    setCurrentProfile={setCurrentProfile}
                    setView={setView}
                    logout={logout}
                />
                <div className="container">
                    <Profile 
                        userId={currentProfile.userId} 
                        username={currentProfile.username}
                        user={user}
                        getInitial={getInitial}
                        setView={setView}
                        setShowCreatePost={setShowCreatePost}
                        toggleFollow={toggleFollow}
                        following={following}
                    />
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header 
                user={user}
                darkMode={darkMode}
                goHome={goHome}
                toggleTheme={toggleTheme}
                setShowSearch={setShowSearch}
                setShowCreatePost={setShowCreatePost}
                setCurrentProfile={setCurrentProfile}
                setView={setView}
                logout={logout}
            />
            <FilterBar filter={filter} clearFilter={clearFilter} />
            <div className="container">
                <FeedTabs feedType={feedType} setFeedType={setFeedType} user={user} />
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
                    setView={setView}
                    openComments={openComments}
                />
            </div>
            <SearchModal 
                showSearch={showSearch}
                setShowSearch={setShowSearch}
                setPosts={setPosts}
                setFilter={setFilter}
                searchFullBrand={searchFullBrand}
                setSearchFullBrand={setSearchFullBrand}
                BRANDS={BRANDS}
            />
            <CreatePostModal 
                showCreatePost={showCreatePost}
                setShowCreatePost={setShowCreatePost}
                createPost={createPost}
                BRANDS={BRANDS}
                CATEGORIES={CATEGORIES}
            />
            {showComments && <CommentsModal />}
        </div>
    );
}

// Wrapper component with Router
function AppWrapper() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/post/:postId" element={<PostPage />} />
            </Routes>
        </Router>
    );
}

export default AppWrapper;
