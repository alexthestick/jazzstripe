import React, { useState } from 'react';

const CreatePostModal = ({ 
    showCreatePost, 
    setShowCreatePost, 
    createPost, 
    BRANDS, 
    CATEGORIES 
}) => {
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

export default CreatePostModal;
