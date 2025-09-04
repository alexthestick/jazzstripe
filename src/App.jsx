import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { supabase } from './lib/supabase';

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

    // Initialize dark mode preference and check for existing session
    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        }
        
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
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

    // Fetch posts from Supabase
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

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

    // Helper Functions
    // generateId function removed - using Supabase auto-generated IDs

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

    const getLogoSvg = () => {
        return (
            <svg viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
                <path d="M 50 100 L 50 40 M 50 70 L 80 70 M 50 100 L 80 100" stroke="currentColor" strokeWidth="8" fill="none"/>
                <circle cx="65" cy="50" r="8" fill="currentColor"/>
                
                <path d="M 120 100 Q 120 70, 140 70 Q 160 70, 160 100 L 160 130 Q 160 150, 140 150 Q 120 150, 120 130 Z" stroke="currentColor" strokeWidth="8" fill="none"/>
                <path d="M 120 70 Q 120 50, 140 50 Q 160 50, 160 70" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <path d="M 200 70 L 240 70 L 200 100 L 240 100" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <path d="M 280 70 L 320 70 L 280 100 L 320 100" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <path d="M 360 140 Q 400 150, 440 140 L 440 60 Q 440 40, 460 40 Q 480 40, 480 60 L 480 100" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
                
                <path d="M 520 40 L 520 100 M 520 70 L 540 70 Q 560 70, 560 85 Q 560 100, 540 100 L 520 100" stroke="currentColor" strokeWidth="8" fill="none"/>
                <path d="M 520 100 L 520 130" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <circle cx="600" cy="50" r="8" fill="currentColor"/>
                <path d="M 600 70 L 600 100" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <path d="M 640 70 L 640 100 Q 640 120, 660 120 Q 680 120, 680 100 L 680 70 Q 680 50, 700 50 Q 720 50, 720 70 L 720 100 Q 720 130, 690 130" stroke="currentColor" strokeWidth="8" fill="none"/>
                
                <path d="M 760 70 Q 780 70, 790 85 Q 780 100, 760 100 Q 740 100, 740 85 Q 740 70, 760 70 Z" stroke="currentColor" strokeWidth="8" fill="none"/>
                <path d="M 790 85 L 800 100" stroke="currentColor" strokeWidth="8" fill="none"/>
            </svg>
        );
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

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles!user_id (username),
                likes (user_id),
                comments (id)
            `);

        if (feedType === 'following' && user && following.length > 0) {
            query = query.in('user_id', following);
        } else if (feedType === 'explore') {
            // For explore, show posts from last 7 days sorted by engagement
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('created_at', weekAgo.toISOString());
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (!error && data) {
            let transformedPosts = data.map(post => ({
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
                commentCount: post.comments?.length || 0,
                engagement: (post.likes?.length || 0) + (post.comments?.length || 0)
            }));

            // Smart explore algorithm: 70% taste-based, 30% discovery
            if (feedType === 'explore' && user) {
                transformedPosts = await generateSmartExploreFeed(transformedPosts);
            } else if (feedType === 'explore') {
                // Sort by engagement for non-logged-in users
                transformedPosts.sort((a, b) => b.engagement - a.engagement);
            }

            setPosts(transformedPosts);
        }
        setLoading(false);
    }, [feedType, following, user]);

    const generateSmartExploreFeed = async (posts) => {
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
    };

    const analyzeUserPreferences = (posts, viewPatterns) => {
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
    };

    const calculatePreferenceScore = (post, preferences) => {
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

    // Components
    const Header = () => (
        <header className="header">
            <div className="header-content">
                <div className="logo" onClick={goHome}>
                    {getLogoSvg()}
                </div>
                <div className="header-actions">
                    <button className="btn btn-icon" onClick={goHome} title="Home">🏠</button>
                    <button className="theme-toggle" onClick={toggleTheme}>
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                    {user ? (
                        <>
                            <button className="btn btn-icon" onClick={() => setShowSearch(true)}>🔍</button>
                            <button className="btn" onClick={() => setShowCreatePost(true)}>+ Post</button>
                            <button 
                                className="btn btn-icon" 
                                onClick={() => {
                                    setCurrentProfile({ userId: user.id, username: user.username });
                                    setView('profile');
                                }}
                                title="My Profile"
                            >
                                👤
                            </button>
                            <button className="btn btn-icon" onClick={logout}>↩︎</button>
                        </>
                    ) : (
                        <button className="btn" onClick={() => setView('auth')}>Sign In</button>
                    )}
                </div>
            </div>
        </header>
    );

    const FilterBar = () => {
        if (!filter) return null;
        
        return (
            <div className="filter-bar active">
                <div className="filter-content">
                    <span className="filter-label">Viewing:</span>
                    <span className="filter-value">
                        {filter.fullBrand ? `Full ${filter.brand}` : filter.brand}
                    </span>
                    <button className="clear-filter" onClick={clearFilter}>Clear</button>
                </div>
            </div>
        );
    };

    const Post = ({ post }) => {
        const isLiked = user && post.likedBy.includes(user.id);
        const [showComments, setShowComments] = useState(false);
        const [commentCount, setCommentCount] = useState(post.commentCount || 0);
        const [showMenu, setShowMenu] = useState(false);
        const [similarPosts, setSimilarPosts] = useState([]);
        const [showSimilar, setShowSimilar] = useState(false);
        const [viewStartTime, setViewStartTime] = useState(null);
        const postRef = useRef(null);

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
            const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);
            setCommentCount(count || 0);
        }, [post.id]);

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
                        onClick={() => setShowComments(true)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        💬 <span>{commentCount}</span>
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
                                        <Post key={similarPost.id} post={similarPost} />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </article>
        );
    };

    const FeedTabs = () => (
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

    const Feed = () => {
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
        
        return filteredPosts.map(post => <Post key={post.id} post={post} />);
    };

    const AuthModal = () => {
        const [isSignUp, setIsSignUp] = useState(false);
        
        return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-title">{getLogoSvg()}</div>
                    <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
                <form onSubmit={handleAuth}>
                        <input type="hidden" name="authType" value={isSignUp ? 'signup' : 'signin'} />
                        
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input type="email" name="email" className="form-input" required />
                    </div>
                        
                        {isSignUp && (
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input type="text" name="username" className="form-input" required />
                    </div>
                        )}
                        
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input type="password" name="password" className="form-input" required />
                    </div>
                        
                        <button type="submit" className="btn" style={{width: '100%'}}>
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                </form>
                    
                <div className="auth-toggle">
                        <p>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <button type="button" onClick={() => setIsSignUp(!isSignUp)} style={{background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}>
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                        <p>Just browsing? <button type="button" onClick={skipAuth} style={{background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer'}}>Continue as guest</button></p>
                </div>
            </div>
        </div>
    );
    };

    const Comments = ({ postId, isOpen, onClose }) => {
        const [comments, setComments] = useState([]);
        const [newComment, setNewComment] = useState('');
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            if (isOpen) {
                fetchComments();
            }
        }, [isOpen, postId, fetchComments]);

        const fetchComments = useCallback(async () => {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles:user_id (username)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setComments(data);
            }
        }, [postId]);

        const submitComment = async (e) => {
            e.preventDefault();
            if (!user || !newComment.trim()) return;

            setLoading(true);
            const { error } = await supabase
                .from('comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: newComment.trim()
                });

            if (!error) {
                setNewComment('');
                fetchComments();
            }
            setLoading(false);
        };

        if (!isOpen) return null;

        return (
            <div className="comments-modal" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--bg, white)',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                maxHeight: '70vh',
                zIndex: 1000,
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
                    <h3>Comments</h3>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }}>×</button>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px'
                }}>
                    {comments.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#999' }}>
                            No comments yet. Be the first!
                        </p>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} style={{
                                marginBottom: '16px',
                                display: 'flex',
                                gap: '12px'
                            }}>
                                <div className="avatar" style={{ flexShrink: 0 }}>
                                    {getInitial(comment.profiles?.username)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        marginBottom: '4px'
                                    }}>
                                        {comment.profiles?.username}
                                    </div>
                                    <div>{comment.content}</div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#999',
                                        marginTop: '4px'
                                    }}>
                                        {formatTimestamp(comment.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {user && (
                    <form onSubmit={submitComment} style={{
                        padding: '20px',
                        borderTop: '1px solid var(--border, #e0e0e0)',
                        display: 'flex',
                        gap: '12px'
                    }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid var(--border, #e0e0e0)',
                                borderRadius: '20px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            className="btn"
                            disabled={loading || !newComment.trim()}
                        >
                            Post
                        </button>
                    </form>
                )}
            </div>
        );
    };

    const CreatePostModal = () => {
        const [imageFile, setImageFile] = useState(null);
        const [imagePreview, setImagePreview] = useState('');
        const [caption, setCaption] = useState('');
        const [isFullBrand, setIsFullBrand] = useState(false);
        const [fullBrandName, setFullBrandName] = useState('');
        const [clothingItems, setClothingItems] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [errors, setErrors] = useState({});
        const [isPickerOpen, setIsPickerOpen] = useState(false);
        const [hoveredCategory, setHoveredCategory] = useState(null);
        const [pendingKey, setPendingKey] = useState('');
        const [postMode, setPostMode] = useState('regular');

        const handleImageChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    setErrors({...errors, image: 'Image must be less than 5MB'});
                    return;
                }
                
                // Check file type
                if (!file.type.startsWith('image/')) {
                    setErrors({...errors, image: 'Please select a valid image file'});
                    return;
                }
                
                setImageFile(file);
                setErrors({...errors, image: ''});
                
                const reader = new FileReader();
                reader.onload = (e) => setImagePreview(e.target.result);
                reader.readAsDataURL(file);
            }
        };

        const handleCategoryChange = (category, subcategory, brand) => {
            const key = subcategory ? `${category} - ${subcategory}` : category;
            setClothingItems(prev => ({
                ...prev,
                [key]: brand
            }));
        };

        const removeClothingItem = (key) => {
            setClothingItems(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        };

        const validateForm = () => {
            const newErrors = {};
            
            if (!imageFile) {
                newErrors.image = 'Please select an image';
            }
            
            if (isFullBrand && !fullBrandName) {
                newErrors.fullBrand = 'Please select a brand for full brand outfit';
            }
            
            if (!isFullBrand && Object.values(clothingItems).every(item => !item)) {
                newErrors.clothing = 'Please tag at least one clothing item';
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }

            setIsSubmitting(true);
            try {
                await createPost({
                    imageFile,
                    caption,
                    clothingItems: isFullBrand ? {} : clothingItems,
                    isFullBrand,
                    fullBrandName: isFullBrand ? fullBrandName : null,
                    postMode
                });
                
                // Reset form
                setImageFile(null);
                setImagePreview('');
                setCaption('');
                setClothingItems({});
                setIsFullBrand(false);
                setFullBrandName('');
                setPostMode('regular');
                setErrors({});
                setShowCreatePost(false);
            } catch (error) {
                console.error('Error submitting:', error);
                setErrors({submit: 'Failed to create post. Please try again.'});
            }
            setIsSubmitting(false);
        };

        if (!showCreatePost) return null;

        return (
            <div className="modal active">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Share Your Outfit</h2>
                        <button 
                            className="close-modal" 
                            onClick={() => setShowCreatePost(false)}
                            type="button"
                        >
                            ×
                        </button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Photo *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="form-input"
                                    onChange={handleImageChange}
                                    required
                                />
                                {errors.image && <div className="error-message">{errors.image}</div>}
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        className="image-preview"
                                        alt="Preview"
                                        style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }}
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Caption</label>
                                <textarea
                                    className="form-textarea"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Tell us about your fit..."
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Post Mode</label>
                                <select
                                    className="form-input"
                                    value={postMode}
                                    onChange={(e) => setPostMode(e.target.value)}
                                >
                                    <option value="regular">Regular - Share your style</option>
                                    <option value="need-advice">Need Advice - Help me style this better</option>
                                    <option value="work-in-progress">Work in Progress - Still figuring this out</option>
                                </select>
                                {postMode === 'need-advice' && (
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        This will be shown to a wider audience for helpful feedback
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <div className="full-brand-toggle">
                                    <label>Full brand outfit</label>
                                    <div
                                        className={`toggle-switch ${isFullBrand ? 'active' : ''}`}
                                        onClick={() => setIsFullBrand(!isFullBrand)}
                                        role="button"
                                        tabIndex="0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                setIsFullBrand(!isFullBrand);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {isFullBrand ? (
                                <div className="form-group">
                                    <label className="form-label">Select Brand *</label>
                                    <select
                                        className="form-input"
                                        value={fullBrandName}
                                        onChange={(e) => setFullBrandName(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose a brand...</option>
                                        {BRANDS.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                    {errors.fullBrand && <div className="error-message">{errors.fullBrand}</div>}
                                </div>
                            ) : (
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label className="form-label">Tag Your Pieces</label>

                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setIsPickerOpen(!isPickerOpen)}
                                        style={{ marginBottom: '10px' }}
                                    >
                                        + Add clothing item
                                    </button>

                                    {isPickerOpen && (
                                        <div style={{ position: 'relative' }}>
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    zIndex: 10,
                                                    background: 'var(--card-bg, #fff)',
                                                    border: '1px solid var(--border, #ddd)',
                                                    borderRadius: 8,
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                                                }}
                                            >
                                                <ul style={{ listStyle: 'none', margin: 0, padding: 8, minWidth: 220 }}>
                                                    {Object.entries(CATEGORIES).map(([category, subcategories]) => (
                                                        <li
                                                            key={category}
                                                            onMouseEnter={() => setHoveredCategory(category)}
                                                            onMouseLeave={() => setHoveredCategory((prev) => (prev === category ? null : prev))}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderRadius: 6,
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                background: hoveredCategory === category ? 'var(--hover, rgba(0,0,0,0.06))' : 'transparent'
                                                            }}
                                                            onClick={() => {
                                                                if (!subcategories.length) {
                                                                    setPendingKey(category);
                                                                    setIsPickerOpen(false);
                                                                }
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <span>{category}</span>
                                                                {subcategories.length > 0 && <span>›</span>}
                                                            </div>

                                                            {hoveredCategory === category && subcategories.length > 0 && (
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: 0,
                                                                        left: '100%',
                                                                        marginLeft: 6,
                                                                        zIndex: 11,
                                                                        background: 'var(--card-bg, #fff)',
                                                                        border: '1px solid var(--border, #ddd)',
                                                                        borderRadius: 8,
                                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                                                                    }}
                                                                >
                                                                    <ul style={{ listStyle: 'none', margin: 0, padding: 8, minWidth: 200 }}>
                                                                        {subcategories.map((sub) => (
                                                                            <li
                                                                                key={sub}
                                                                                style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setPendingKey(`${category} - ${sub}`);
                                                                                    setIsPickerOpen(false);
                                                                                }}
                                                                            >
                                                                                {sub}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {pendingKey && (
                                        <div style={{ marginTop: 12 }}>
                                            <label className="form-label">Select Brand for {pendingKey}</label>
                                            <select
                                                className="brand-select"
                                                onChange={(e) => {
                                                    const brand = e.target.value;
                                                    if (brand) {
                                                        const [category, sub] = pendingKey.includes(' - ')
                                                            ? pendingKey.split(' - ')
                                                            : [pendingKey, null];
                                                        handleCategoryChange(category, sub, brand);
                                                        setPendingKey('');
                                                    }
                                                }}
                                            >
                                                <option value="">Select brand...</option>
                                                {BRANDS.map((brand) => (
                                                    <option key={brand} value={brand}>{brand}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {Object.entries(clothingItems).length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                                            {Object.entries(clothingItems).map(([key, brand]) => (
                                                brand ? (
                                                    <div
                                                        key={key}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            padding: '6px 10px',
                                                            borderRadius: 999,
                                                            background: 'var(--chip-bg, rgba(0,0,0,0.06))'
                                                        }}
                                                    >
                                                        <span>{key.includes(' - ') ? `${key.split(' - ')[1]}` : key}: {brand}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeClothingItem(key)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontWeight: 600
                                                            }}
                                                            aria-label={`Remove ${key}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : null
                                            ))}
                                        </div>
                                    )}

                                    {errors.clothing && <div className="error-message">{errors.clothing}</div>}
                                </div>
                            )}

                            {errors.submit && <div className="error-message">{errors.submit}</div>}

                            <button
                                type="submit"
                                className="btn"
                                style={{ width: '100%' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Posting...' : 'Post Outfit'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const Profile = ({ userId, username }) => {
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
        }, [userId]);

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
                        profilePosts.map(post => <Post key={post.id} post={post} />)
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
    const SearchModal = () => {
        const [localSearchQuery, setLocalSearchQuery] = useState('');
        const [debouncedQuery, setDebouncedQuery] = useState('');

        useEffect(() => {
            const timer = setTimeout(() => {
                setDebouncedQuery(localSearchQuery);
            }, 300);
            return () => clearTimeout(timer);
        }, [localSearchQuery]);

        const filteredBrands = BRANDS.filter(brand => 
            brand.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        const searchBrand = async (brand) => {
            // Enhanced search with vibe matching
            const designerBrands = ['Rick Owens', 'Yohji Yamamoto', 'Comme des Garçons', 'Balenciaga', 'Bottega Veneta', 'Prada', 'Gucci', 'Off-White', 'Vetements', 'Margiela', 'Alyx', 'Acne Studios', 'Our Legacy', 'Lemaire', 'Stone Island', 'Moncler', 'Jil Sander', 'Raf Simons', 'Undercover', 'Issey Miyake'];
            const streetwearBrands = ['Stussy', 'Supreme', 'Palace', 'Kith', 'Fear of God Essentials', 'Brain Dead', 'Online Ceramics', 'Cav Empt', 'Noah', 'ALD', 'JJJJound', 'Awake NY', 'Kapital', 'Needles', 'Human Made', 'John Elliott', 'Rhude', 'Enfants Riches Déprimés', 'Chrome Hearts', 'Gallery Dept'];
            
            const isDesigner = designerBrands.some(b => b.toLowerCase().includes(brand.toLowerCase()));
            const isStreetwear = streetwearBrands.some(b => b.toLowerCase().includes(brand.toLowerCase()));
            
            // Search for exact brand matches first
            let query = supabase
                .from('posts')
                .select(`
                    *,
                    profiles!user_id (username),
                    likes (user_id),
                    comments (id)
                `)
                .or(`clothing_items.cs.{${brand}},full_brand_name.ilike.%${brand}%`)
                .order('created_at', { ascending: false })
                .limit(20);

            const { data: exactMatches, error } = await query;
            
            if (!error && exactMatches) {
                // If we found exact matches, also get vibe matches
                let vibeQuery = supabase
                    .from('posts')
                    .select(`
                        *,
                        profiles!user_id (username),
                        likes (user_id),
                        comments (id)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (isDesigner) {
                    vibeQuery = vibeQuery.or('clothing_items.cs.{' + designerBrands.join(',') + '}');
                } else if (isStreetwear) {
                    vibeQuery = vibeQuery.or('clothing_items.cs.{' + streetwearBrands.join(',') + '}');
                }

                const { data: vibeMatches } = await vibeQuery;
                
                // Combine and deduplicate results
                const allResults = [...exactMatches];
                if (vibeMatches) {
                    const exactIds = new Set(exactMatches.map(p => p.id));
                    const uniqueVibeMatches = vibeMatches.filter(p => !exactIds.has(p.id));
                    allResults.push(...uniqueVibeMatches);
                }

                // Transform and set posts
                const transformedPosts = allResults.map(post => ({
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
                    commentCount: post.comments?.length || 0,
                    engagement: (post.likes?.length || 0) + (post.comments?.length || 0)
                }));

                setPosts(transformedPosts);
                setFilter(brand);
            }
            
            setShowSearch(false);
            setLocalSearchQuery('');
        };

        return (
            <div className={`modal ${showSearch ? 'active' : ''}`}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Search Brands</h2>
                        <button className="close-modal" onClick={() => { setShowSearch(false); setLocalSearchQuery(''); }}>×</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <input 
                                type="text" 
                                className="search-input" 
                                placeholder="Type to search brands..." 
                                value={localSearchQuery}
                                onChange={(e) => setLocalSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <div className="full-brand-toggle">
                                <label>Show only full brand outfits</label>
                                <div 
                                    className={`toggle-switch ${searchFullBrand ? 'active' : ''}`} 
                                    onClick={() => setSearchFullBrand(!searchFullBrand)}
                                />
                            </div>
                        </div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {filteredBrands.length > 0 ? (
                                filteredBrands.map(brand => (
                                <div key={brand} className="brand-option" onClick={() => searchBrand(brand)}>
                                    <span>{brand}</span>
                                </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: '#888' }}>No brands found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Main render
    if (view === 'auth' && !user) {
        return <AuthModal />;
    }

    if (view === 'profile' && currentProfile) {
        return (
            <div>
                <Header />
                <div className="container">
                    <Profile userId={currentProfile.userId} username={currentProfile.username} />
                </div>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <FilterBar />
            <div className="container">
                <FeedTabs />
                <Feed />
            </div>
            <SearchModal />
            <CreatePostModal />
        </div>
    );
}

export default App;
