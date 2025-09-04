import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { cartCount } = useCart();

    const handleSignOut = () => {
        logout();
        navigate('/');
        toast.success('You have been signed out.');
    };

    const handleSignIn = () => {
        navigate('/signin');
    };

    const handleProtectedAction = (path) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            toast.error('Please sign in to continue!');
            sessionStorage.setItem('redirectAfterLogin', path);
            navigate('/signin');
        }
    };

    // --- MODIFIED LOGIC ---
    // Determine the delivery location from the authenticated user's profile data
    const deliveryCity = isAuthenticated ? user?.profile?.address?.[0]?.city : null;

    // Handle clicks on the delivery location link
    const handleDeliveryClick = () => {
        if (isAuthenticated) {
            // If logged in, navigate to the profile edit page to change the address
            navigate('/profile/edit');
        } else {
            // If not logged in, direct them to sign in to set an address
            handleProtectedAction('/profile/edit');
        }
    };
    // --- END MODIFIED LOGIC ---

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-content">
                    <div
                        className="logo"
                        onClick={() => navigate('/')}
                    >
                        BIGZONE
                    </div>
                    <div className="search-container">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search for products, brands, and more..."
                        />
                        <button className="search-button">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                    <div className="user-actions">
                        <button className="action-button" onClick={() => navigate('/ecozone')}>
                            <i className="fas fa-leaf"></i>
                            <span>ECOZONE</span>
                        </button>
                        <button className="action-button" onClick={() => handleProtectedAction('/cart')}>
                            <i className="fas fa-shopping-cart"></i>
                            <span>CART</span>
                            <span className="badge">{cartCount}</span>
                        </button>

                        {isAuthenticated ? (
                            <div className="action-button" style={{ cursor: 'default' }}>
                                <i className="fas fa-user-check"></i>
                                <span>Hi, {user?.fullname?.split(' ')[0] || 'User'}</span>
                                <button
                                    onClick={handleSignOut}
                                    className="sign-out-button"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button className="action-button" onClick={handleSignIn}>
                                <i className="fas fa-sign-in-alt"></i>
                                <span>Sign In</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <nav className="nav">
                <div className="nav-container">
                    <div className="nav-links">
                        <a className="nav-link" onClick={() => handleProtectedAction('/profile')}>
                            <i className="fas fa-user-circle" style={{marginRight: '8px'}}></i>Profile
                        </a>
                        {/* --- MODIFIED LINK --- */}
                        <a className="nav-link" onClick={handleDeliveryClick}>
                            <i className="fas fa-map-marker-alt" style={{marginRight: '8px'}}></i>
                            {deliveryCity ? `Deliver to ${deliveryCity}` : 'Select Address'}
                        </a>
                        {/* --- END MODIFIED LINK --- */}
                        <a className="nav-link" onClick={() => handleProtectedAction('/orders')}>
                            <i className="fas fa-box" style={{marginRight: '8px'}}></i>Returns & Orders
                        </a>
                        <a href="#" className="nav-link">
                            <i className="fas fa-globe" style={{marginRight: '8px'}}></i>Language
                        </a>
                        <a href="#" className="nav-link">
                            <i className="fas fa-headset" style={{marginRight: '8px'}}></i>Customer Service
                        </a>
                        <a className="nav-link" onClick={() => handleProtectedAction('/form')}>
                            <i className="fas fa-box" style={{marginRight: '8px'}}></i>Sell A Product
                        </a>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
