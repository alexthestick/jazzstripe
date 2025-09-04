import React, { useState, useEffect, useRef, useCallback } from 'react';
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

    // Move fetchPosts before useEffect calls
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

    const getLogoSvg = () => (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
            <path d="M 20 10 L 20 30 Q 20 35, 25 35 Q 30 35, 30 30 L 30 10 Q 30 5, 35 5 Q 40 5, 40 10 L 40 30 Q 40 35, 45 35 Q 50 35, 50 30 L 50 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M 60 10 L 60 30 Q 60 35, 65 35 Q 70 35, 70 30 L 70 10 Q 70 5, 75 5 Q 80 5, 80 10 L 80 30 Q 80 35, 85 35 Q 90 35, 90 30 L 90 10 Q 90 5, 95 5 Q 100 5, 100 10 L 100 30 Q 100 35, 105 35 Q 110 35, 110 30 L 110 10 Q 110 5, 115 5 Q 120 5, 120 10 L 120 30 Q 120 35, 125 35 Q 130 35, 130 30 L 130 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
    );

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
        </div>
    );
}

export default App;
