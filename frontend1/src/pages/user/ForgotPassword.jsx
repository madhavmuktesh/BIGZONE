import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
// Use your standard authentication styling if you have a specific CSS file for login/register
//import '../styles/auth.css'; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            return toast.error("Please enter your email address");
        }

        setLoading(true);
        try {
            const response = await fetch('/api/v1/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSubmitted(true);
                toast.success("Reset link generated!");
            } else {
                throw new Error(data.message || "Something went wrong");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <header className="signin-header">
                <div className="signin-container signin-header-content">
                <div className="signin-header-left">
                    <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="back-button"
                    aria-label="Go back"
                    >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
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
            <Toaster position="top-center" />
            <div style={{ maxWidth: '400px', width: '100%', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Forgot Password?</h2>
                
                {submitted ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'green', marginBottom: '20px' }}>
                            If an account exists with that email, a reset link has been sent.
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            <em>Developer Note: Check your backend terminal console for the link while in development mode!</em>
                        </p>
                        <Link to="/signin" className="btn btn-primary" style={{ display: 'block', marginTop: '20px', textAlign: 'center', textDecoration: 'none' }}>
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ padding: '12px', cursor: loading ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? 'Processing...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <Link to="/signin" style={{ color: '#0066cc', textDecoration: 'none' }}>Remembered it? Sign in here.</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;