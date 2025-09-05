import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from './Icons'; // Assuming you have a HeartIcon component
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addItemToCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleProductClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/ecozone/products/${product._id}`);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart!');
      navigate('/signin');
      return;
    }

    try {
      await addItemToCart(product._id, 1);
      toast.success(`Added "${product.productname}" to cart!`);
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart');
    }
  };

  if (!product) {
    return null;
  }

  const {
    _id,
    productname,
    productprice,
    originalPrice,
    reviewStats,
    images,
    category,
    specifications,
    ecoScore,
    co2SavedKg,
    ecoAnalysisJustification
  } = product;

  const discountPercentage = originalPrice && originalPrice > productprice
    ? Math.round(((originalPrice - productprice) / originalPrice) * 100)
    : 0;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    const emptyStars = 5 - fullStars;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    return stars;
  };

  return (
    <div className="product-card eco-card" onClick={handleProductClick} >
      
      <div className="product-image-container">
        <div className="product-image">
          {images && images.length > 0 ? (
            <img 
              src={images[0].url} 
              alt={productname}
              onError={(e) => { e.target.src = '/placeholder.jpg'; }}
            />
          ) : (
            <div className="placeholder-image" />
          )}
          
          <div className="eco-leaf-badge">
             🌱
          </div>

          {discountPercentage > 0 && (
            <div className="discount-badge">{discountPercentage}% OFF</div>
          )}
        </div>
        <button className="wishlist-button"><HeartIcon /></button>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{productname}</h3>
        
        <div 
          className="eco-info" 
          title={ecoAnalysisJustification || 'This is a certified eco-friendly product.'}
        >
          <div className="eco-score">
            <strong>{ecoScore}</strong> Eco Score
          </div>
          {co2SavedKg > 0 && (
            <div className="co2-saved">
              {co2SavedKg} kg CO₂ Saved
            </div>
          )}
        </div>

        <div className="product-meta">
          <span className="product-category">{category}</span>
          {specifications?.brand && (
            <span className="product-brand"> • {specifications.brand}</span>
          )}
        </div>
        
        <div className="product-rating">
          <div className="rating-stars">
            {renderStars(reviewStats?.averageRating)}
          </div>
          <span className="rating-count">
            ({reviewStats?.totalReviews || 0})
          </span>
        </div>
        
        <div className="product-price">
          <span className="current-price">₹{productprice?.toLocaleString()}</span>
          {originalPrice && originalPrice > productprice && (
            <span className="original-price">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>
        
        <div className="product-buttons">
          <Link to={`/ecozone/products/${_id}`} style={{ textDecoration: 'none' }}>
            <button className="btn-view">View Details</button>
          </Link>
          <button
            className="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={loading}
            type="button"
          >
            {loading ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;