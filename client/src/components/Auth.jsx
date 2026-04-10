// /home/cameron/mindmap/voice-mindmap/client/src/components/Auth.jsx

import React, { useState, useEffect } from 'react';

export default function Auth({ onAuth, isLoading, error, successMessage, onClearSuccess, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear form and switch to sign in after successful signup
  useEffect(() => {
    if (successMessage && isSignUp) {
      setEmail('');
      setPassword('');
      setIsSignUp(false);
      onClearSuccess?.();
    }
  }, [successMessage, isSignUp, onClearSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    
    onAuth(email, password, isSignUp);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button className="auth-close-button" onClick={onClose}>&times;</button>
        <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
        <p className="auth-subtitle">
          {isSignUp ? 'Create an account to save your mind maps' : 'Sign in to access your mind maps'}
        </p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          
          {(error || localError) && (
            <div className="auth-error">{error || localError}</div>
          )}
          
          {successMessage && !isSignUp && (
            <div className="auth-success">{successMessage}</div>
          )}
          
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}