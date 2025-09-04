import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SearchModal = ({ 
    showSearch, 
    setShowSearch, 
    setPosts, 
    setFilter, 
    searchFullBrand, 
    setSearchFullBrand, 
    BRANDS 
}) => {
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

export default SearchModal;
