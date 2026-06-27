// frontend1/src/pages/ProductPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ImageGallery from '../components/ImageGallery.jsx';
import EcoCartSummary from '../components/EcoCartSummary.jsx';
import EcoToast from '../components/EcoToast.jsx';
import '../styles/productmain.css';

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const Breadcrumbs = ({ category, subcategory, productName }) => (
  <nav className="breadcrumbs-nav">
    <div className="container" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
      <ol className="breadcrumbs-list">
        <li><a href="/">H</a></li>
        <li className="breadcrumbs-separator">/</li>
        <li><a href={`/search?query=${category}`}>{category}</a></li>
        {subcategory && (
          <>
            <li className="breadcrumbs-separator">/</li>
            <li><a href={`/search?query=${subcategory}`}>{subcategory}</a></li>
          </>
        )}
        <li className="breadcrumbs-separator">/</li>
        <li className="current-page">{productName}</li>
      </ol>
    </div>
  </nav>
);

// ─── FAQItem ──────────────────────────────────────────────────────────────────
const FAQItem = ({ question, answer, isOpen, onClick }) => (
  <div className="faq-item">
    <button className="faq-button" onClick={onClick}>
      <span>{question}</span>
      <svg className={`faq-icon ${isOpen ? 'open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {isOpen && <div className="faq-content">{answer}</div>}
  </div>
);

// ─── StickyCTA ────────────────────────────────────────────────────────────────
const StickyCTA = ({ product, isVisible, onAddToCart, onBuyNow, buyNowLoading, addingToCart }) => {
  if (!product) return null;
  return (
    <div className={`sticky-cta ${isVisible ? 'show' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="sticky-cta-price">
          <div className="current-price">₹{product.productprice.toLocaleString('en-IN')}</div>
          {product.originalPrice && (
            <div className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</div>
          )}
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-add-to-cart" disabled={addingToCart || !product.isInStock} onClick={onAddToCart} type="button">
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
          <button className="btn btn-buy-now" disabled={buyNowLoading || !product.isInStock} onClick={onBuyNow} type="button">
            {buyNowLoading ? 'Processing...' : 'Buy Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Inline ProductSummary (right column — name, price, stock, buttons only) ──
const ProductSummary = ({ product, onAddToCart, onBuyNow, buyNowLoading, addingToCart }) => {
  const discountPct = product.originalPrice && product.originalPrice > product.productprice
    ? Math.round(((product.originalPrice - product.productprice) / product.originalPrice) * 100)
    : 0;

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  return (
    <div className="product-summary-panel">

      {/* Brand */}
      {product.specifications?.brand && (
        <span className="product-header-brand">{product.specifications.brand}</span>
      )}

      {/* Name */}
      <h1 className="product-title">{product.productname}</h1>

      {/* Rating */}
      {product.reviewStats && (
        <div className="rating-section">
          <span className="stars">{renderStars(product.reviewStats.averageRating)}</span>
          <span className="rating-value">{Number(product.reviewStats.averageRating).toFixed(1)}</span>
          <span className="review-count">({product.reviewStats.totalReviews} reviews)</span>
        </div>
      )}

      {/* Price */}
      <div className="pricing-block">
        <div className="price-display">
          <span className="current-price">₹{product.productprice.toLocaleString('en-IN')}</span>
          {product.originalPrice && product.originalPrice > product.productprice && (
            <>
              <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>{discountPct > 0 && <span>{discountPct}% OFF</span>}
              
            </>
          )}
        </div>
        <p className="taxes-info">Inclusive of all taxes</p>
      </div>

      {/* Stock */}
      <div className="stock-status">
        <div className={`stock-indicator ${product.isInStock ? 'in-stock' : 'out-of-stock'}`}></div>
        <span className={product.isInStock ? 'stock-text' : ''} style={{ color: product.isInStock ? '#15803d' : '#dc2626', fontWeight: 500 }}>
          {product.isInStock
            ? `In Stock — ${product.stock?.quantity} left`
            : 'Out of Stock'}
        </span>
      </div>

      {/* Eco badge */}
      {(product.ecoScore ?? 0) > 0 && (
        <div className="eco-product-badge">
          🌿 Eco Friendly · +{product.ecoScore} eco points
        </div>
      )}

      {/* Buttons */}
      <div className="action-buttons">
        <button
          className="btn-add-to-cart"
          onClick={onAddToCart}
          disabled={addingToCart || !product.isInStock}
          type="button"
        >
          {addingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        <button
          className="btn-buy-now"
          onClick={onBuyNow}
          disabled={buyNowLoading || !product.isInStock}
          type="button"
        >
          {buyNowLoading ? 'Processing...' : 'Buy Now'}
        </button>
      </div>

      {/* Trust badges */}
      <div className="additional-info">
        <span className="info-item">✓ Free Shipping</span>
        <span className="info-item">✓ 30-Day Returns</span>
        <span className="info-item">✓ Secure Payment</span>
      </div>

    </div>
  );
};

// ─── Main ProductPage ─────────────────────────────────────────────────────────
export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItemToCart } = useCart();

  const [product, setProduct]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [quantity, setQuantity]               = useState(1);
  const [openFAQIndex, setOpenFAQIndex]       = useState(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [buyNowLoading, setBuyNowLoading]     = useState(false);
  const [addingToCart, setAddingToCart]       = useState(false);
  const [showEcoToast, setShowEcoToast]       = useState(false);
  const [ecoProduct, setEcoProduct]           = useState(null);

  const topRowRef = useRef(null);

  // ── Fetch ──
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/v1/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        if (data.success) setProduct(data.product);
        else throw new Error(data.message || 'Failed to fetch product');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ── Sticky scroll ──
  useEffect(() => {
    const handleScroll = () => {
      if (topRowRef.current) {
        setIsStickyVisible(topRowRef.current.getBoundingClientRect().bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Add to cart ──
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart!');
      navigate('/signin');
      return;
    }
    try {
      setAddingToCart(true);
      await addItemToCart(product._id, 1, {
        productname: product.productname,
        productprice: product.productprice,
        currentPrice: product.productprice,
        images: product.images,
        stock: product.stock,
      });
      toast.success(`Added "${product.productname}" to cart!`);
      if ((product.ecoScore ?? 0) > 0) {
        setEcoProduct(product);
        setShowEcoToast(true);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // ── Buy Now ──
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to continue');
      navigate('/signin');
      return;
    }
    try {
      setBuyNowLoading(true);
      const res = await fetch('/api/v1/orders/buy-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: product._id, quantity }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || 'Failed to proceed'); return; }
      navigate('/checkout', { state: { buyNowOrder: data.order, isBuyNow: true } });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBuyNowLoading(false);
    }
  };

  const faqs = [
    { q: "What is the return policy?",            a: "We offer a 30-day hassle-free return policy on all products." },
    { q: "How long does delivery take?",          a: "Standard delivery takes 3-5 business days. Express delivery available at checkout." },
    { q: "Is the product covered under warranty?",a: "Yes, all products come with a manufacturer warranty. Check specifications for details." },
  ];

  // ── States ──
  if (loading) return (
    <div className="container" style={{ padding: '2rem', textAlign: 'center' }}><h2>Loading product...</h2></div>
  );
  if (error) return (
    <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Error: {error}</h2>
      <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '1rem' }}>Try Again</button>
    </div>
  );
  if (!product) return (
    <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Product not found.</h2>
      <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</button>
    </div>
  );

  return (
    <>
      <EcoToast product={showEcoToast ? ecoProduct : null} />

      <Breadcrumbs
        category={product.category}
        subcategory={product.subcategory}
        productName={product.productname}
      />

      <main className="container">

        {/* ── TOP ROW: Image | Summary ── */}
        <div className="product-page-grid" ref={topRowRef}>

          {/* LEFT — images only */}
          <div className="product-left-col">
            <ImageGallery images={product.images} productName={product.productname} />
          </div>

          {/* RIGHT — name, price, stock, buttons only */}
          <div className="product-right-col">
            <ProductSummary
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              buyNowLoading={buyNowLoading}
              addingToCart={addingToCart}
            />
          </div>
        </div>

        {/* ── BELOW: full-width sections ── */}
        <div className="details-layout">

          {/* 1. Description */}
          <section className="section-card">
            <h2 className="section-title">Product Description</h2>
            <p className="product-description">{product.productdescription}</p>
          </section>

          {/* 2. Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <section className="section-card">
              <h2 className="section-title">Specifications</h2>
              <div className="specs-grid">
                {Object.entries(product.specifications).map(([key, value]) => {
                  if (value && typeof value !== 'object') return (
                    <div key={key} className="spec-item">
                      <span className="spec-label">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <span className="spec-value">{String(value)}</span>
                    </div>
                  );
                  return null;
                })}
              </div>
            </section>
          )}

          {/* 3. Reviews */}
          <section className="section-card">
            <h2 className="section-title">Customer Reviews</h2>

            {product.reviewStats && (
              <div className="review-summary-bar">
                <span className="review-avg-score">
                  {Number(product.reviewStats.averageRating).toFixed(1)}
                </span>
                <div>
                  <span className="stars">
                    {'★'.repeat(Math.floor(product.reviewStats.averageRating))}
                    {'☆'.repeat(5 - Math.floor(product.reviewStats.averageRating))}
                  </span>
                  <p className="review-total-count">{product.reviewStats.totalReviews} reviews</p>
                </div>
              </div>
            )}

            <div className="reviews-list">
              {product.productreviews && product.productreviews.length > 0 ? (
                product.productreviews.slice(0, 5).map((review) => (
                  <div key={review._id} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">
                        {review.user?.username || review.user?.fullname || 'Verified Buyer'}
                      </span>
                      <span className="review-rating">{'★'.repeat(review.rating)}</span>
                    </div>
                    <p className="review-text">{review.review}</p>
                    <span className="review-date">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No reviews yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </section>

          {/* 4. Eco summary (if eco product) */}
          {(product.ecoScore ?? 0) > 0 && (
            <EcoCartSummary
              items={[{
                productDetails: { ecoScore: product.ecoScore, co2SavedKg: product.co2SavedKg ?? 0 },
                quantity,
              }]}
            />
          )}

          {/* 5. FAQs */}
          <section className="section-card">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFAQIndex === index}
                  onClick={() => toggleFAQ(index)}
                />
              ))}
            </div>
          </section>

        </div>
      </main>

      <StickyCTA
        product={product}
        isVisible={isStickyVisible}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        buyNowLoading={buyNowLoading}
        addingToCart={addingToCart}
      />
    </>
  );

  function toggleFAQ(index) {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  }
}