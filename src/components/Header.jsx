import React from 'react';

const Header = ({ 
    user, 
    darkMode, 
    goHome, 
    toggleTheme, 
    setShowSearch, 
    setShowCreatePost, 
    setCurrentProfile, 
    setView, 
    logout 
}) => {
    const getLogoSvg = () => (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="currentColor">
            <path d="M 20 10 L 20 30 Q 20 35, 25 35 Q 30 35, 30 30 L 30 10 Q 30 5, 35 5 Q 40 5, 40 10 L 40 30 Q 40 35, 45 35 Q 50 35, 50 30 L 50 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M 60 10 L 60 30 Q 60 35, 65 35 Q 70 35, 70 30 L 70 10 Q 70 5, 75 5 Q 80 5, 80 10 L 80 30 Q 80 35, 85 35 Q 90 35, 90 30 L 90 10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M 100 10 L 100 30 Q 100 35, 105 35 Q 110 35, 110 30 L 110 10 Q 110 5, 115 5 Q 120 5, 120 10 L 120 30 Q 120 35, 125 35 Q 130 35, 130 30 L 130 10" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
    );

    return (
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
};

export default Header;
