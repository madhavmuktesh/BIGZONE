// ProductPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Make sure to install react-router-dom
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import "../styles/productmain.css"; // Make sure to import the CSS file

// --- Sub-components (Refactored to accept props from backend) ---

const Breadcrumbs = ({ category, subcategory, productName }) => (
    <nav className="breadcrumbs-nav">
        <div className="container" style={{paddingTop: '0.75rem', paddingBottom: '0.75rem'}}>
            <ol className="breadcrumbs-list">
                <li><a href="/">Home</a></li>
                <li className="breadcrumbs-separator">/</li>
                <li><a href={`/category/${category}`}>{category}</a></li>
                {subcategory && (
                    <>
                        <li className="breadcrumbs-separator">/</li>
                        <li><a href={`/category/${category}/${subcategory}`}>{subcategory}</a></li>
                    </>
                )}
                <li className="breadcrumbs-separator">/</li>
                <li className="current-page">{productName}</li>
            </ol>
        </div>
    </nav>
);

const ImageGallery = ({ images, productName }) => {
    // Use the first image as the default main image
    const [mainImage, setMainImage] = useState(images.length > 0 ? images[0].url : '');
    const [isZoomed, setIsZoomed] = useState(false);

    // Update the main image if the images prop changes
    useEffect(() => {
        if (images.length > 0) {
            setMainImage(images[0].url);
        }
    }, [images]);

    if (!images || images.length === 0) {
        return <div className="image-gallery">No images available</div>;
    }

    return (
        <div className="image-gallery">
            <div className="main-image-container">
                <img
                    src={mainImage}
                    alt={`${productName} - Main View`}
                    className={`main-image ${isZoomed ? 'zoomed' : ''}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                />
            </div>
            <div className="thumbnail-list">
                {images.map((image, index) => (
                    <img
                        key={image.public_id || index}
                        src={image.url}
                        alt={`${productName} - Thumbnail ${index + 1}`}
                        className={`thumbnail ${mainImage === image.url ? 'active' : ''}`}
                        onClick={() => setMainImage(image.url)}
                    />
                ))}
                {/* You can add a video thumbnail here if your product data includes a video URL */}
            </div>
        </div>
    );
};

const ProductInfo = ({ product, quantity, onQuantityChange }) => {
    const [pincode, setPincode] = useState('');
    const [deliveryInfoVisible, setDeliveryInfoVisible] = useState(false);
    const { addItemToCart, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Helper function to render star ratings
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return (
            <>
                {'★'.repeat(fullStars)}
                {halfStar && '½'}
                {'☆'.repeat(emptyStars)}
            </>
        );
    };

    const handleCheckDelivery = () => {
      if (pincode.length === 6 && /^\d+$/.test(pincode)) {
          setDeliveryInfoVisible(true);
      } else {
          alert('Please enter a valid 6-digit pincode');
          setDeliveryInfoVisible(false);
      }
    };
    
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

    const handleBuyNow = () => alert(`Proceeding to checkout with ${quantity} x ${product.productname}`);

    return (
        <div className="product-info">
            {/* Header */}
            <div>
                <span className="product-header-brand">{product.specifications?.brand || 'Brand'}</span>
                <h1 className="product-title">{product.productname}</h1>
                <div className="rating-section">
                    <div className="star-rating">
                       {renderStars(product.reviewStats.averageRating)}
                    </div>
                    <span>({product.reviewStats.averageRating.toFixed(1)})</span>
                    <a className="rating-reviews-link">{product.reviewStats.totalReviews} reviews</a>
                </div>
            </div>

            {/* Pricing */}
            <div className="pricing-block">
                <div className="price-display">
                    <span className="current-price">₹{product.productprice.toLocaleString('en-IN')}</span>
                    {product.originalPrice && product.originalPrice > product.productprice && (
                         <>
                            <span className="original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                            <span className="discount-badge">{product.discountPercentage}% off</span>
                         </>
                    )}
                </div>
                <p className="taxes-info">Inclusive of all taxes</p>
                {/* Static offers can remain or be fetched from another API */}
            </div>

            {/* Availability & Delivery */}
            <div className="space-y-4">
                <div className="stock-status">
                    <div className={`stock-indicator ${product.isInStock ? 'in-stock' : 'out-of-stock'}`}></div>
                    <span className="stock-text">{product.isInStock ? 'In Stock' : 'Out of Stock'}</span>
                    {product.isInStock && <span>- Only {product.stock.quantity} left!</span>}
                </div>
                <div className="pincode-checker">
                    <input type="text" placeholder="Enter pincode" className="pincode-input" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleCheckDelivery}>Check</button>
                </div>
                {deliveryInfoVisible && (
                   <div className="delivery-info flex items-center space-x-2">
                     <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" style={{width: '1rem', height: '1rem', color: '#22c55e'}}>
                         <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                     </svg>
                     <span>Free delivery by <strong>Tomorrow, Sep 3</strong></span>
                   </div>
                )}
            </div>
            
            {/* Color Display (No longer a selector) */}
            {product.specifications?.color && (
              <div className="color-selector">
                <h3>Color: <span>{product.specifications.color}</span></h3>
              </div>
            )}
            
            {/* Quantity & CTA */}
            <div className="space-y-4">
                <div className="flex items-center space-x-4">
                    <span>Quantity:</span>
                    <div className="quantity-stepper">
                        <button onClick={() => onQuantityChange(-1)} disabled={quantity <= 1}>−</button>
                        <span className="quantity-display">{quantity}</span>
                        <button onClick={() => onQuantityChange(1)} disabled={quantity >= product.stock.quantity || quantity >= 10}>+</button>
                    </div>
                </div>
                <div className="cta-buttons">
                    <button className="add-to-cart-button" onClick={handleAddToCart} disabled={loading} type="button"> {loading ? 'Adding...' : 'Add to Cart'}</button>
                    <button className="btn btn-buy-now" onClick={handleBuyNow} disabled={!product.isInStock}>Buy Now</button>
                </div>
            </div>
        </div>
    );
};

// ... (FAQItem component remains the same)
const FAQItem = ({ question, answer, isOpen, onClick }) => (
    <div className="faq-item">
      <button className="faq-button" onClick={onClick}>
        <span>{question}</span>
        <svg className={`faq-icon ${isOpen ? 'open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {isOpen && <div className="faq-content">{answer}</div>}
    </div>
);


const StickyCTA = ({ product, isVisible }) => {
  if (!product) return null;

  return (
    <div className={`sticky-cta ${isVisible ? 'show' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="sticky-cta-price">
          
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---

export default function Productmain() {
    const { id } = useParams(); // Get product ID from URL, e.g., /products/123
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [openFAQIndex, setOpenFAQIndex] = useState(null);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const productInfoRef = useRef(null);

    // Fetch data from the backend when the component mounts
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // IMPORTANT: The URL should point to your backend API endpoint.
                // It might be http://localhost:5000/api/v1/products/${id} in development.
                const response = await fetch(`/api/v1/products/${id}`);
                if (!response.ok) {
                    throw new Error('Product not found');
                }
                const data = await response.json();
                if (data.success) {
                    setProduct(data.product);
                } else {
                    throw new Error(data.message || 'Failed to fetch product');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]); // Re-run effect if the product ID changes

    const handleQuantityChange = (delta) => {
      setQuantity(prev => {
          const newQuantity = prev + delta;
          // Use product stock from backend to set upper limit
          const maxQuantity = Math.min(10, product?.stock?.quantity || 1);
          if (newQuantity >= 1 && newQuantity <= maxQuantity) {
              return newQuantity;
          }
          return prev;
      });
    };
    
    const toggleFAQ = (index) => {
        setOpenFAQIndex(openFAQIndex === index ? null : index);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (productInfoRef.current) {
                const rect = productInfoRef.current.getBoundingClientRect();
                setIsStickyVisible(rect.bottom < 0);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Static FAQs, as this data wasn't in the product model
    const faqs = [
        { q: "How long does the battery last?", a: "The WH-1000XM5 provides up to 30 hours of playback with noise canceling on, and up to 40 hours with noise canceling off." },
        { q: "Can I use these headphones for phone calls?", a: "Yes, the WH-1000XM5 features precise voice pickup technology for crystal clear hands-free calling." },
        { q: "Are these headphones comfortable for long listening sessions?", a: "Absolutely. The WH-1000XM5 features a redesigned lighter build with soft fit leather and a noiseless design." },
    ];

    if (loading) {
        return <div className="container"><h2>Loading product...</h2></div>;
    }

    if (error) {
        return <div className="container"><h2>Error: {error}</h2></div>;
    }

    if (!product) {
        return <div className="container"><h2>Product not found.</h2></div>;
    }

    return (
        <>
            <Breadcrumbs 
                category={product.category} 
                subcategory={product.subcategory}
                productName={product.productname}
            />
            <main className="container">
                <div className="main-layout" ref={productInfoRef}>
                    <ImageGallery images={product.images} productName={product.productname} />
                    <ProductInfo
                        product={product}
                        quantity={quantity}
                        onQuantityChange={handleQuantityChange}
                    />
                </div>
                
                <div className="details-layout">
                    {/* Description Section */}
                    <section className="section-card">
                       <h2 className="section-title">Product Description</h2>
                       <p>{product.productdescription}</p>
                    </section>
                    
                    {/* Specifications Section */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <section className="section-card">
                            <h2 className="section-title">Technical Specifications</h2>
                            <table className="specs-table">
                                <tbody>
                                    {Object.entries(product.specifications).map(([key, value]) => {
                                        if (value && typeof value !== 'object') {
                                            return (
                                                <tr key={key}>
                                                    <td className="spec-key">{key.charAt(0).toUpperCase() + key.slice(1)}</td>
                                                    <td className="spec-value">{String(value)}</td>
                                                </tr>
                                            );
                                        }
                                        return null;
                                    })}
                                </tbody>
                            </table>
                        </section>
                    )}
                    
                    {/* FAQs Section */}
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
            <StickyCTA product={product} isVisible={isStickyVisible} />
        </>
    );
}
