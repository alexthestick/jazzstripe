import React, { useState } from 'react';

const AuthModal = ({ handleAuth, skipAuth, getLogoSvg }) => {
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

export default AuthModal;
