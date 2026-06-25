import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
            <h1 style={{ fontSize: '6rem', color: '#0066cc', margin: 0 }}>404</h1>
            <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '20px' }}>Oops! Page Not Found</h2>
            <p style={{ color: '#666', marginBottom: '30px', maxWidth: '400px' }}>
                We can't seem to find the page you're looking for. The link might be broken, or the page may have been removed.
            </p>
            <Link to="/" className="btn-primary" style={{ padding: '12px 24px', textDecoration: 'none', borderRadius: '4px' }}>
                Back to Home
            </Link>
        </div>
    );
};

export default NotFound;