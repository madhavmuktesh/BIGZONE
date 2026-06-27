import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const deliveryCity = isAuthenticated ? user?.profile?.address?.[0]?.city : null;

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('You have been signed out.');
      navigate('/');
    } catch {
      toast.error('Failed to sign out.');
    }
  };

  const handleSignIn = () => navigate('/signin');

  const handleProtectedAction = (path) => {
    if (isAuthenticated) return navigate(path);
    toast.error('Please sign in to continue!');
    sessionStorage.setItem('redirectAfterLogin', path);
    navigate('/signin');
  };

  const handleDeliveryClick = () => {
    if (isAuthenticated) return navigate('/address');
    sessionStorage.setItem('redirectAfterLogin', '/address');
    toast.error('Please sign in to continue!');
    navigate('/signin');
  };

  const handleSellerDashboard = () => {
    handleProtectedAction('/sellerdashboard');
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetchSuggestions(searchQuery.trim());
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
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
        const nextSuggestions = data.products?.slice(0, 6) || [];
        setSuggestions(nextSuggestions);
        setIsDropdownOpen(nextSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions([]);
      setIsDropdownOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (product) => {
    if (!product?._id) return;
    setSearchQuery('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    navigate(`/products/${product._id}`);
  };

  const submitSearch = (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.error('Please enter something to search!');
      return;
    }

    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    navigate(`/search?query=${encodeURIComponent(trimmedQuery)}`);
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    submitSearch(searchQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch(e);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) handleSuggestionClick(suggestions[selectedIndex]);
        else submitSearch(searchQuery);
        break;
      default:
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
    <header className="bz-header">
      <div className="bz-header-top">
        <div className="bz-header-container">
          <div className="bz-header-content">
            <Link className="bz-logo" to="/" aria-label="Go to homepage">
              BIGZONE
            </Link>

            <div className="bz-search-wrapper" ref={dropdownRef}>
              <form className="bz-search-form" onSubmit={handleSearch} role="search">
                <input
                  ref={inputRef}
                  type="text"
                  className="bz-search-input"
                  placeholder="Search for products, brands, and more..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={isDropdownOpen}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    selectedIndex >= 0 ? `${listboxId}-option-${selectedIndex}` : undefined
                  }
                />
                <button type="submit" className="bz-search-button" aria-label="Search">
                  {loading ? (
                    <span className="bz-search-spinner" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-search" aria-hidden="true" />
                  )}
                </button>
              </form>

              {isDropdownOpen && suggestions.length > 0 && (
                <div className="bz-search-dropdown" id={listboxId} role="listbox">
                  {suggestions.map((product, index) => (
                    <button
                      type="button"
                      key={product._id}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      className={`bz-suggestion-item ${index === selectedIndex ? 'is-selected' : ''}`}
                      onClick={() => handleSuggestionClick(product)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="bz-suggestion-image">
                        <img
                          src={product.images?.[0]?.url || '/placeholder.jpg'}
                          alt={product.productname || 'Product'}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.jpg';
                          }}
                        />
                      </div>

                      <div className="bz-suggestion-content">
                        <div className="bz-suggestion-name">{product.productname}</div>
                        <div className="bz-suggestion-meta">
                          <span>{product.category}</span>
                          {product.specifications?.brand && <span> • {product.specifications.brand}</span>}
                        </div>
                        <div className="bz-suggestion-price">
                          ₹{product.productprice?.toLocaleString?.() || product.productprice}
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    className="bz-suggestion-item bz-view-all"
                    onClick={() => submitSearch(searchQuery)}
                  >
                    <div className="bz-view-all-content">
                      <i className="fas fa-search" aria-hidden="true" />
                      <span>View all results for "{searchQuery}"</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="bz-user-actions">
              <button type="button" className="bz-action-button" onClick={() => navigate('/ecozone')}>
                <i className="fas fa-leaf" aria-hidden="true" />
                <span>ECOZONE</span>
              </button>

              <button type="button" className="bz-action-button" onClick={() => handleProtectedAction('/cart')}>
                <i className="fas fa-shopping-cart" aria-hidden="true" />
                <span>CART</span>
                <span className="bz-badge">{cartCount}</span>
              </button>

              {isAuthenticated && (
                <button type="button" className="bz-action-button" onClick={handleSellerDashboard}>
                  <i className="fas fa-store" aria-hidden="true" />
                  <span>Seller Dashboard</span>
                </button>
              )}

              {isAuthenticated ? (
                <div className="bz-user-pill">
                  <div className="bz-user-pill-main">
                    <i className="fas fa-user-check" aria-hidden="true" />
                    <span>Hi, {user?.fullname?.split(' ')[0] || 'User'}</span>
                  </div>
                  <button type="button" onClick={handleSignOut} className="bz-signout-button">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button type="button" className="bz-action-button" onClick={handleSignIn}>
                  <i className="fas fa-sign-in-alt" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <nav className="bz-nav" aria-label="Primary">
        <div className="bz-header-container">
          <div className="bz-nav-links">
            <button type="button" className="bz-nav-link" onClick={() => navigate('/')}>
              <i className="fas fa-home" aria-hidden="true" />
              <span>Home</span>
            </button>

            <button type="button" className="bz-nav-link" onClick={() => handleProtectedAction('/profile')}>
              <i className="fas fa-user-circle" aria-hidden="true" />
              <span>Profile</span>
            </button>

            <button type="button" className="bz-nav-link" onClick={handleDeliveryClick}>
              <i className="fas fa-map-marker-alt" aria-hidden="true" />
              <span>{deliveryCity ? `Deliver to ${deliveryCity}` : 'Select Address'}</span>
            </button>

            <button type="button" className="bz-nav-link" onClick={() => handleProtectedAction('/orders')}>
              <i className="fas fa-box" aria-hidden="true" />
              <span>Returns & Orders</span>
            </button>


          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;