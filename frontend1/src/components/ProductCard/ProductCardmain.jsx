import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { renderStars } from '../../utils/starRating.jsx';

const ProductCard = ({ product, onToggleWishlist, isWishlisted }) => {
  const { addItemToCart, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Prevent crash if product is missing
  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round((1 - product.productprice / product.originalPrice) * 100)
    : 0;

  const rating = product.reviewStats?.averageRating || 0;
  const reviewCount = product.reviewStats?.totalReviews || 0;
  const imageUrl =
    product.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Image';

  // Navigate to product detail page
  const handleProductClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    navigate(`/products/${product._id}`);
  };

  // Add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart!');
      sessionStorage.setItem('redirectAfterLogin', '/cart');
      navigate('/signin');
      return;
    }

    try {
      await addItemToCart(product._id, 1, {
        productname: product.productname,
        productprice: product.productprice,
        currentPrice: product.productprice,
        images: product.images,
        stock: product.stock,
      });

      toast.success(`Added "${product.productname}" to cart!`);
    } catch (error) {
      toast.error(error.message || 'Failed to add item to cart');
    }
  };

  // Toggle wishlist
  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product._id);
    }
  };

  return (
    <div
      className="product-card"
      onClick={handleProductClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-image-container">
        <img
          src={imageUrl}
          alt={product.productname || 'Product'}
          className="product-image"
        />
        {discount > 0 && (
          <div className="product-badge sale">{discount}% off</div>
        )}
        <button
          className="wishlist-button"
          onClick={handleWishlistClick}
          type="button"
          aria-label="Add to wishlist"
        >
          <i
            className={`${isWishlisted ? 'fas' : 'far'} fa-heart ${
              isWishlisted ? 'wishlisted' : ''
            }`}
          ></i>
        </button>
      </div>

      <div className="product-info">
        <h3 className="product-name">
          {product.productname || 'Unnamed Product'}
        </h3>

        <div className="product-rating">
          <div className="rating-stars">{renderStars(rating)}</div>
          <span className="rating-count">({reviewCount})</span>
        </div>

        <div className="product-pricing">
          <span className="product-price">${product.productprice ?? 'N/A'}</span>
          {product.originalPrice && (
            <span className="product-original-price">
              ${product.originalPrice}
            </span>
          )}
        </div>

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
  );
};

export default ProductCard;
