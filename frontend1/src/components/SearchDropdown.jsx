// SearchDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './SearchDropdown.css';

const SearchDropdown = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce function to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetchSuggestions(searchQuery);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch search suggestions from your API
  const fetchSuggestions = async (query) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/products/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        // Limit to first 8 suggestions for dropdown
        setSuggestions(data.products.slice(0, 8));
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Search suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
    
    if (value.length === 0) {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (product) => {
    setSearchQuery('');
    setIsOpen(false);
    navigate(`/product/${product._id}`);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter something to search!");
      return;
    }
    
    setIsOpen(false);
    navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
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
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="search-dropdown-container" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder="Search for products..."
            className="search-input"
            autoComplete="off"
          />
          
          <button type="submit" className="search-button">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((product, index) => (
              <div
                key={product._id}
                className={`suggestion-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleSuggestionClick(product)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-image">
                  <img 
                    src={product.images[0]?.url || '/placeholder.jpg'} 
                    alt={product.productname}
                    loading="lazy"
                  />
                </div>
                
                <div className="suggestion-content">
                  <div className="suggestion-name">{product.productname}</div>
                  <div className="suggestion-details">
                    <span className="suggestion-category">{product.category}</span>
                    {product.specifications?.brand && (
                      <span className="suggestion-brand">• {product.specifications.brand}</span>
                    )}
                  </div>
                  <div className="suggestion-price">₹{product.productprice.toLocaleString()}</div>
                </div>
              </div>
            ))}
            
            {/* View All Results Option */}
            <div 
              className="suggestion-item view-all"
              onClick={handleSubmit}
            >
              <div className="view-all-content">
                <span>View all results for "{searchQuery}"</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M5 12h14M12 5l7 7-7 7" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchDropdown;
