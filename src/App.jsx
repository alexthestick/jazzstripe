import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import './styles/modals/CommentsModal.css';
import { supabase } from './lib/supabase';

// Import components
import SearchModal from './components/SearchModal';
import CreatePostModal from './components/CreatePostModal';
import AuthModal from './components/AuthModal';
import PostPage from './components/PostPage';
import useIsMobile from './hooks/useIsMobile';

// New navigation components
import BottomNavigation from './components/BottomNavigation';
import TopHeader from './components/TopHeader';
import HomeFeed from './components/HomeFeed';
import SearchPage from './components/SearchPage';
// import PostCreation from './components/PostCreation'; // Removed - not used in new routing
import ActivityFeed from './components/ActivityFeed';
import UserProfile from './components/UserProfile';
import PostCreationFlow from './components/posting/PostCreationFlow';

// Brand list and categories (moved to App level)
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

const CATEGORIES = {
    'Tops': ['Button Up', 'Jacket', 'T-Shirt', 'Sweater'],
    'Bottoms': ['Pants', 'Denim', 'Shorts'],
    'Outerwear': [],
    'Footwear': [],
    'Tailoring': ['Blazer', 'Suit'],
    'Accessories': ['Hats', 'Belt', 'Glasses']
};

// MainApp component with all state management
function MainApp() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [feedType, setFeedType] = useState('foryou');
    const [, setCurrentProfile] = useState(null);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchFullBrand, setSearchFullBrand] = useState(false);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState([]);
    
    // Comments state - keeping for future use
    // const [showComments, setShowComments] = useState(false);
    // const [selectedPostComments, setSelectedPostComments] = useState(null);
    // const [comments, setComments] = useState({});
    const [commentText, setCommentText] = useState('');
    // const [loadingComments, setLoadingComments] = useState(false);
    
    // Threading and voting state - keeping for future use
    // const [replyingTo, setReplyingTo] = useState(null);
    // const [replyTexts, setReplyTexts] = useState({});
    // const [collapsedThreads, setCollapsedThreads] = useState(new Set());
    // const [commentVotes, setCommentVotes] = useState({});

    // Mobile detection and navigation
    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const location = useLocation();

    // Update activeTab based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') {
            setActiveTab('home');
        } else if (path === '/create-post') {
            setActiveTab('post');
        }
    }, [location.pathname]);

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

        viewPatterns.forEach(pattern => {
            const post = posts.find(p => p.id === pattern.post_id);
            if (!post) return;

            Object.values(post.clothingItems).forEach(brand => {
                preferences.brands.set(brand, (preferences.brands.get(brand) || 0) + pattern.view_duration);
            });

            const isOversized = post.caption?.toLowerCase().includes('oversized') || 
                               post.caption?.toLowerCase().includes('baggy');
            const silhouette = isOversized ? 'oversized' : 'fitted';
            preferences.silhouettes.set(silhouette, (preferences.silhouettes.get(silhouette) || 0) + pattern.view_duration);

            const isMonochrome = post.caption?.toLowerCase().includes('monochrome') || 
                               post.caption?.toLowerCase().includes('black and white');
            const colorMood = isMonochrome ? 'monochrome' : 'colorful';
            preferences.colorMoods.set(colorMood, (preferences.colorMoods.get(colorMood) || 0) + pattern.view_duration);
        });

        return preferences;
    }, []);

    const calculatePreferenceScore = useCallback((post, preferences) => {
        let score = 0;

        Object.values(post.clothingItems).forEach(brand => {
            score += preferences.brands.get(brand) || 0;
        });

        const isOversized = post.caption?.toLowerCase().includes('oversized') || 
                           post.caption?.toLowerCase().includes('baggy');
        const silhouette = isOversized ? 'oversized' : 'fitted';
        score += preferences.silhouettes.get(silhouette) || 0;

        const isMonochrome = post.caption?.toLowerCase().includes('monochrome') || 
                           post.caption?.toLowerCase().includes('black and white');
        const colorMood = isMonochrome ? 'monochrome' : 'colorful';
        score += preferences.colorMoods.get(colorMood) || 0;

        return score;
    }, []);

    const generateSmartExploreFeed = useCallback(async (posts) => {
        if (!user) return posts;

        const { data: viewPatterns } = await supabase
            .from('view_patterns')
            .select('post_id, view_duration')
            .eq('user_id', user.id)
            .gte('view_duration', 2000);

        if (!viewPatterns || viewPatterns.length === 0) {
            return posts.sort((a, b) => b.engagement - a.engagement);
        }

        const userPreferences = analyzeUserPreferences(posts, viewPatterns);
        
        const scoredPosts = posts.map(post => ({
            ...post,
            preferenceScore: calculatePreferenceScore(post, userPreferences)
        }));

        scoredPosts.sort((a, b) => b.preferenceScore - a.preferenceScore);

        const tasteBasedCount = Math.floor(posts.length * 0.7);
        const tasteBased = scoredPosts.slice(0, tasteBasedCount);
        const discovery = scoredPosts.slice(tasteBasedCount);
        
        const shuffledDiscovery = discovery.sort(() => Math.random() - 0.5);

        return [...tasteBased, ...shuffledDiscovery];
    }, [user, analyzeUserPreferences, calculatePreferenceScore]);

    // Fetch posts from Supabase
    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
                
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
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                query = query.gte('created_at', weekAgo.toISOString());
            }

            const { data: postsData, error: postsError } = await query
                .order('created_at', { ascending: false })
                .limit(50);
        
            if (postsError) throw postsError;

            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select('post_id');

            if (commentsError) throw commentsError;

            const commentCounts = commentsData.reduce((acc, comment) => {
                acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
                return acc;
            }, {});

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

            if (feedType === 'explore' && user) {
                transformedPosts = await generateSmartExploreFeed(transformedPosts);
            } else if (feedType === 'explore') {
                transformedPosts.sort((a, b) => b.engagement - a.engagement);
            }

            setPosts(transformedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, [feedType, following, user, generateSmartExploreFeed]);

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

    useEffect(() => {
        if (user) {
            fetchFollowing();
        }
    }, [user, fetchFollowing]);

    // Auth functions
    const handleAuth = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const username = formData.get('username');
        const password = formData.get('password');
        const isSignUp = formData.get('authType') === 'signup';
        
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username }
                    }
                });
                
                if (error) {
                    alert(`Sign up failed: ${error.message}`);
                    return;
                }
                
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
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) {
                    alert(`Sign in failed: ${error.message}`);
                    return;
                }
                
                if (data.user) {
                    setUser({
                        id: data.user.id,
                        email: data.user.email,
                        username: data.user.user_metadata?.username || email.split('@')[0]
                    });
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            alert('Authentication failed. Please try again.');
        }
    };

    const skipAuth = () => {
        setUser({
            id: null,
            email: null,
            username: 'Guest',
            isGuest: true
        });
    };

    const createPost = async (postData) => {
        if (!user || user.isGuest) {
            alert('Please sign in to post');
            return;
        }

        try {
            const file = postData.imageFile;
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('outfits')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('outfits')
                .getPublicUrl(fileName);

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

            await fetchPosts();
            setShowCreatePost(false);
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    };

    // Event Handlers
    const toggleLike = async (postId) => {
        if (!user || user.isGuest) {
            alert('Please sign in to like posts');
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
        
        await fetchPosts();
    };

    const filterByBrand = (brand, isFullBrand) => {
        setFilter({ brand, fullBrand: isFullBrand });
        window.scrollTo(0, 0);
    };

    const openComments = async (post) => {
        if (isMobile) {
            navigate(`/post/${post.id}`);
        } else {
            // Desktop comments functionality - simplified for now
            console.log('Desktop comments not implemented yet');
        }
    };

    // Navigation handling - THE KEY CHANGE FOR ROUTING
    const handleNavigation = (tabId) => {
        setActiveTab(tabId);
        
        switch(tabId) {
            case 'home':
                navigate('/');
                break;
            case 'search':
                // Handle search functionality
                break;
            case 'post':
                if (user && user.isGuest) {
                    alert('Please sign in to create posts');
                } else {
                    navigate('/create-post'); // ROUTE-BASED NAVIGATION
                }
                break;
            case 'activity':
                // Handle activity
                break;
            case 'profile':
                if (user && !user.isGuest) {
                    setCurrentProfile({
                        userId: user.id,
                        username: user.username
                    });
                } else if (user && user.isGuest) {
                    alert('Please sign in to view your profile');
                }
                break;
            default:
                // Default case for unknown tabs
                break;
        }
    };

    const handleMenuToggle = () => {
        setDarkMode(!darkMode);
    };

    const handleNotifications = () => {
        setActiveTab('activity');
    };

    // Helper functions
    const getLogoSvg = () => (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
            <path d="M 20 10 L 20 30 Q 20 35, 25 35 Q 30 35, 30 30 L 30 10 Q 30 5, 35 5 Q 40 5, 40 10 L 40 30 Q 40 35, 45 35 Q 50 35, 50 30 L 50 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M 60 10 L 60 30 Q 60 35, 65 35 Q 70 35, 70 30 L 70 10 Q 70 5, 75 5 Q 80 5, 80 10 L 80 30 Q 80 35, 85 35 Q 90 35, 90 30 L 90 10 Q 90 5, 95 5 Q 100 5, 100 10 L 100 30 Q 100 35, 105 35 Q 110 35, 110 30 L 110 10 Q 110 5, 115 5 Q 120 5, 120 10 L 120 30 Q 120 35, 125 35 Q 130 35, 130 30 L 130 10 Q 130 5, 135 5 Q 140 5, 140 10 L 140 30 Q 140 35, 145 35 Q 150 35, 150 30 L 150 10 Q 150 5, 155 5 Q 160 5, 160 10 L 160 30 Q 160 35, 165 35 Q 170 35, 170 30 L 170 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
    );

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

    const renderTabContent = () => {
        switch(activeTab) {
            case 'home':
                return (
                    <HomeFeed 
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
                        feedType={feedType}
                        setFeedType={setFeedType}
                    />
                );
            case 'search':
                return <SearchPage />;
            case 'activity':
                return <ActivityFeed />;
            case 'profile':
                return <UserProfile user={user} />;
            default:
                return (
                    <HomeFeed 
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
                        feedType={feedType}
                        setFeedType={setFeedType}
                    />
                );
        }
    };

    // Comment functions - simplified for now
    // const fetchComments = async (postId) => { ... }
    // const postComment = async (postId, parentId = null, replyText = null) => { ... }
    // const voteComment = async (commentId, voteType) => { ... }

    // Main render logic
    if (!user || (user && !user.isGuest && !user.id)) {
        return <AuthModal handleAuth={handleAuth} skipAuth={skipAuth} getLogoSvg={getLogoSvg} />;
    }

    if (loading && posts.length === 0) {
        return (
            <div className="app-container">
                <TopHeader 
                    user={user}
                    onMenuToggle={handleMenuToggle}
                    onNotifications={handleNotifications}
                />
                <div className="loading-container">
                    <div>Loading...</div>
                </div>
                <BottomNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    user={user}
                    onNavigate={handleNavigation}
                />
            </div>
        );
    }

    return (
        <div className="app-container">
            <TopHeader 
                user={user}
                onMenuToggle={handleMenuToggle}
                onNotifications={handleNotifications}
            />
            
            <main className="main-content">
                {renderTabContent()}
            </main>
            
            <BottomNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                onNavigate={handleNavigation}
            />
            
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

// Main App component with Router - THE ROUTING ARCHITECTURE
function App() {
    // Shared state for auth across routes
    const [user, setUser] = useState(null);

    // Initialize auth state at app level
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    username: session.user.user_metadata?.username || session.user.email.split('@')[0]
                });
            }
        });

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

    // Shared createPost function
    const createPost = async (postData) => {
        if (!user || user.isGuest) {
            alert('Please sign in to post');
            return;
        }

        try {
            const file = postData.imageFile;
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('outfits')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('outfits')
                .getPublicUrl(fileName);

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

            // Success - PostCreationFlow will handle navigation
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
            throw error; // Re-throw so PostCreationFlow can handle
        }
    };

    return (
        <Router>
            <Routes>
                {/* Home route - renders MainApp with all existing functionality */}
                <Route path="/" element={<MainApp />} />
                
                {/* NEW: Create post route - renders PostCreationFlow */}
                <Route path="/create-post" element={
                    <PostCreationFlow 
                        user={user}
                        createPost={createPost}
                        BRANDS={BRANDS}
                        CATEGORIES={CATEGORIES}
                    />
                } />
                
                {/* Individual post route */}
                <Route path="/post/:postId" element={<PostPage />} />
            </Routes>
        </Router>
    );
}

export default App;