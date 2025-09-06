import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';



const Header = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const { cartCount } = useCart();

    // Search states
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

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

    const deliveryCity = isAuthenticated ? user?.profile?.address?.[0]?.city : null;

    const handleDeliveryClick = () => {
        if (isAuthenticated) {
            navigate('/address');
        } else {
            handleProtectedAction('/signin');
        }
    };

    // --- SEARCH FUNCTIONALITY ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                fetchSuggestions(searchQuery);
            } else {
                setSuggestions([]);
                setIsDropdownOpen(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const fetchSuggestions = async (query) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/products/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.success) {
                setSuggestions(data.products.slice(0, 6));
                setIsDropdownOpen(true);
            }
        } catch (error) {
            console.error('Search suggestions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setSelectedIndex(-1);
        
        if (value.length === 0) {
            setSuggestions([]);
            setIsDropdownOpen(false);
        }
    };

    const handleSuggestionClick = (product) => {
        setSearchQuery('');
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        navigate(`/products/${product._id}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast.error("Please enter something to search!");
            return;
        }
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
    };

    const handleKeyDown = (e) => {
        if (!isDropdownOpen || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    handleSuggestionClick(suggestions[selectedIndex]);
                } else {
                    handleSearch(e);
                }
                break;
            case 'Escape':
                setIsDropdownOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-content">
                    <div className="logo" onClick={() => navigate('/')}>
                        BIGZONE
                    </div>
                    
                    {/* Search with suggestions */}
                    <div className="search-dropdown-wrapper" ref={dropdownRef}>
                        <form className="search-container" onSubmit={handleSearch}>
                            <input
                                ref={inputRef}
                                type="text"
                                className="search-input"
                                placeholder="Search for products, brands, and more..."
                                value={searchQuery}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
                                autoComplete="off"
                            />
                            <button type="submit" className="search-button">
                                {loading ? (
                                    <div className="search-loading-spinner"></div>
                                ) : (
                                    <i className="fas fa-search"></i>
                                )}
                            </button>
                        </form>

                        {isDropdownOpen && suggestions.length > 0 && (
                            <div className="search-suggestions-dropdown">
                                {suggestions.map((product, index) => (
                                    <div
                                        key={product._id}
                                        className={`search-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSuggestionClick(product);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="suggestion-image">
                                            <img 
                                                src={product.images?.[0]?.url || '/placeholder.jpg'} 
                                                alt={product.productname}
                                                onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                                            />
                                        </div>
                                        <div className="suggestion-content">
                                            <div className="suggestion-name">{product.productname}</div>
                                            <div className="suggestion-details">
                                                <span className="suggestion-category">{product.category}</span>
                                                {product.specifications?.brand && (
                                                    <span className="suggestion-brand"> • {product.specifications.brand}</span>
                                                )}
                                            </div>
                                            <div className="suggestion-price">₹{product.productprice?.toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                                <div 
                                    className="search-suggestion-item view-all-results"
                                    onClick={handleSearch}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="view-all-content">
                                        <i className="fas fa-search"></i>
                                        <span>View all results for "{searchQuery}"</span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                <button onClick={handleSignOut} className="sign-out-button">
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
                        <Link to="/" className="nav-link">
                            <i className="fas fa-home" style={{ marginRight: '8px' }}></i>HOME
                        </Link>
                        <Link to="/profile" className="nav-link">
                            <i className="fas fa-user-circle" style={{ marginRight: '8px' }}></i>Profile
                        </Link>
                        <a className="nav-link" onClick={handleDeliveryClick}>
                            <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                            {deliveryCity ? `Deliver to ${deliveryCity}` : 'Select Address'}
                        </a>
                        <Link to="/orders" className="nav-link">
                            <i className="fas fa-box" style={{ marginRight: '8px' }}></i>Returns & Orders
                        </Link>
                        <Link to="/feedback" className="nav-link">
                            <i className="fas fa-headset" style={{ marginRight: '8px' }}></i>Help & Contact
                        </Link>
                        <Link to="/form" className="nav-link">
                            <i className="fas fa-box" style={{ marginRight: '8px' }}></i>Sell A Product
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
