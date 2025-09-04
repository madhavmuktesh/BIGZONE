// src/components/ProductHeader.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, HeartIcon, ShoppingCartIcon } from './Icons';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext'; // ✅ to get user + token

const ProductHeader = ({ product }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth(); // ✅ get logged in user + token

  const [cartCount, setCartCount] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Fetch cart + wishlist when product changes
  useEffect(() => {
    if (user && token) {
      fetchCartCount();
      if (product) checkWishlistStatus();
    }
  }, [product, user, token]);

  const fetchCartCount = async () => {
    if (!token) return; // ✅ skip if not logged in
    try {
      const response = await ApiService.request('/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const totalItems =
        response.cart?.items?.reduce((total, item) => total + item.quantity, 0) ||
        0;
      setCartCount(totalItems);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  };

  const checkWishlistStatus = async () => {
    if (!product || !token) return;
    try {
      const response = await ApiService.request('/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const isProductInWishlist =
        response.wishlist?.items?.some((item) => item.product === product._id) ||
        false;
      setIsInWishlist(isProductInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      setIsInWishlist(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || !token) {
      alert('Please login to manage your wishlist');
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        await ApiService.request(`/wishlist/remove/${product._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsInWishlist(false);
      } else {
        await ApiService.request('/wishlist/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId: product._id })
        });
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Please login to manage your wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleCartClick = () => navigate('/cart');
  const handleBackClick = () =>
    window.history.length > 1 ? navigate(-1) : navigate('/');

  return (
    <nav className="product-header">
      <div className="product-header-content">
        <div className="left-nav">
          <button onClick={handleBackClick} aria-label="Go back">
            <ChevronLeftIcon />
          </button>
          <Link to="/">
            <h1>Ecozone</h1>
          </Link>
        </div>
        <div className="right-nav">
          <button
            onClick={handleWishlistToggle}
            disabled={isAddingToWishlist || !product}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`wishlist-button ${isInWishlist ? 'active' : ''}`}
          >
            <HeartIcon className={isInWishlist ? 'filled' : ''} />
          </button>
          <div className="cart-button-wrapper">
            <button onClick={handleCartClick} aria-label="View cart">
              <ShoppingCartIcon />
            </button>
            {cartCount > 0 && (
              <span className="cart-badge-detail">{cartCount}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ProductHeader;
