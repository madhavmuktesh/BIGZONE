import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { loginAPI } from '../../services/api.js';
import '../../styles/signin.css';

const AlertMessage = ({ message, type = 'error' }) => {
  if (!message) return null;

  return (
    <div className={`alert-message ${type}`} role="alert" aria-live="polite">
      {message}
    </div>
  );
};

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath || '/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (error) setError('');
    if (success) setSuccess('');
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginAPI({
        email: formData.email,
        password: formData.password,
      });

      if (data?.success) {
        setSuccess('Login successful! Redirecting...');
        login(data.user);
      } else {
        setError(data?.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setFormData({
      email: 'demo@bigzone.com',
      password: 'demo123',
      rememberMe: false,
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="signin-page">
      <header className="signin-header">
        <div className="signin-container signin-header-content">
          <div className="signin-header-left">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="back-button"
              aria-label="Go back"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <h1 className="logo-title">BIGZONE</h1>
          </div>

          <div className="signin-header-right">
            <span>New to BIGZONE?</span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="create-account-button"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      <main className="signin-main">
        <section className="signin-container signin-layout">
          <div className="signin-copy-panel">
            <span className="signin-badge">Welcome back</span>
            <h2>Sign in and continue your shopping journey</h2>
            <p>
              Access your account, manage orders, check your wishlist, and enjoy
              a secure login experience.
            </p>

            <ul className="signin-points">
              <li>Fast and secure access</li>
              <li>Track orders and saved items</li>
              <li>Simple demo credentials for testing</li>
            </ul>
          </div>

          <div className="signin-form-card">
            <div className="welcome-message">
              <h3>Sign In</h3>
              <p>Enter your details to access your BIGZONE account.</p>
            </div>

            <div className="secure-signin-indicator">
              <span className="indicator-dot" />
              <span className="indicator-text">Secure Sign In</span>
            </div>

            <AlertMessage message={error} type="error" />
            <AlertMessage message={success} type="success" />

            <form onSubmit={handleLoginSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field password-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <span>Remember me</span>
                </label>

                <Link to="/forgot-password" className="forgot-password-button">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In to BIGZONE'}
              </button>
            </form>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="quick-access-box"
            >
              <div className="quick-access-content">
                <p>Quick Demo Access</p>
                <div className="quick-access-creds">
                  <span>Email: demo@bigzone.com</span>
                  <span>Password: demo123</span>
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignIn;