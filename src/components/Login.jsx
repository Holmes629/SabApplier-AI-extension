import React, { useState } from 'react';
import Loader from './Loader';
import { Eye, EyeOff } from "lucide-react";
import GoogleLogin from '../services/API/GoogleLogin';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Show loader if loading 
  const showLoader = loading ;

  const onStatusUpdate = (msg, type) => {
    setStatusMessage(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');

    
    try {
      // Call the parent's handleLogin function which handles storage
      if (onLogin) {
        await onLogin(email, password);
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setStatusMessage('Login failed: ' + (err.message || 'Unknown error'));

    }
    setTimeout(() => {
      setLoading(false);
    },3000)
    
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setStatusMessage('');
    
    try {
      const result = await GoogleLogin(onStatusUpdate);
      
      if (result && result.success) {
        // Call the parent's onLogin function with Google user data
        if (onLogin) {
          // Create a mock login call that the parent expects
          await onLogin(result.user_email, null, result);
        }
      }
    } catch (err) {
      console.error('Google login error:', err);
      setStatusMessage('Google login failed: ' + (err.message || 'Unknown error'));
    }
    
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  return (
    <div className={`login-container${showLoader ? ' blurred' : ''}`}>
      
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            className="login-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="input-group">
          <input
            className="login-input password-input"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <span className={`eye-icon ${showPassword ? 'eye-open' : 'eye-closed'}`}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </span>
          </button>
        </div>
        <button className="login-button" type="submit" disabled={loading}>
          <span className="button-text">
            {loading ? 'Logging in...' : 'Login'}
          </span>
        </button>
        
        <div className="divider">
          <span>or</span>
        </div>
        
        <button 
          type="button" 
          className="google-login-button" 
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <div className="google-icon">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <span className="google-button-text">
            {loading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>
      </form>
      {showLoader && <Loader message={statusMessage || 'Logging in...'} />}
    </div>
  );
}