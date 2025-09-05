// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [activeStore, setActiveStore] = useState('ecozone');

  return (
    <nav className="header-nav">
      <div className="container">
        <div className="header-content">

          {/* Left: Logo */}
          <div className="header-logo">
            <h1>
              <Link to="/">Ecozone</Link>
            </h1>
          </div>

          {/* Center: Search Bar */}
          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search eco-friendly products..."
              className="search-input"
            />
            <button className="search-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 
                     0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Right: Store Toggle & Cart */}
          <div className="header-actions">
            <div className="store-toggle">
              <button
                onClick={() => setActiveStore('ecozone')}
                className={activeStore === 'ecozone' ? 'active' : 'inactive'}
              >
                Ecozone
              </button>
              <button
                onClick={() => setActiveStore('bigzone')}
                className={activeStore === 'bigzone' ? 'active' : 'inactive'}
              >
                Bigzone
              </button>
            </div>

            {/* Cart Button */}
            <Link to="/cart">
              <button className="cart-button">
                🛒 Cart
                <span className="cart-badge">3</span>
              </button>
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Header;
