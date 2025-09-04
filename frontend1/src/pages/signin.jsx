import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/SignIn.css';

// Configure axios to include credentials by default
axios.defaults.withCredentials = true;

const AlertMessage = ({ message, type }) => {
  if (!message) return null;
  const alertClass = type === 'error' 
    ? 'bg-red-100 border border-red-400 text-red-700' 
    : 'bg-green-100 border border-green-400 text-green-700';
  return (
    <div className={`${alertClass} px-4 py-3 rounded-md relative mb-4`} role="alert">
      <span className="block sm:inline">{message}</span>
    </div>
  );
};

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        '/api/v1/users/login',
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        console.log("Login successful! User data:", response.data.user);

        // Pass only user data - token is now in httpOnly cookie
        login(response.data.user);

        // Check if user was trying to access a protected route
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');

        setTimeout(() => {
          navigate(redirectPath || "/", { replace: true });
        }, 1000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      console.error("Login failed:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@bigzone.com');
    setPassword('demo123');
    setError('');
    setSuccess('');
  };

  return (
    <div className="page-container">
      <header className="header">
        <div className="container header-content">
          <div className="header-left">
            <button onClick={() => window.history.back()} className="back-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1 className="logo-title">BIGZONE</h1>
          </div>
          <div className="header-right">
            <span>New to BIGZONE?</span>
            <button onClick={() => alert('Redirecting to register...')} className="create-account-button">
              Create Account
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="form-container">
          <div className="welcome-message">
            <h2>Welcome Back</h2>
            <p>Sign in to your BIGZONE account to continue shopping</p>
          </div>

          <div className="form-card">
            <div className="secure-signin-indicator">
              <div className="indicator-dot"></div>
              <span>Secure Sign In</span>
            </div>
            
            <AlertMessage message={error} type="error" />
            <AlertMessage message={success} type="success" />

            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  required 
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required 
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button type="button" onClick={togglePasswordVisibility} className="password-toggle-button">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={isLoading}/>
                  <span>Remember me</span>
                </label>
                <button type="button" onClick={() => alert('Password reset email sent! (Demo)')} className="forgot-password-button" disabled={isLoading}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In to BIGZONE'}
              </button>
            </form>

            <div onClick={fillDemoCredentials} className="quick-access-box">
              <div>
                <p>Quick Demo Access</p>
                <div className="quick-access-creds">
                  <span>Email: demo@bigzone.com</span>
                  <span>Password: demo123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignIn;