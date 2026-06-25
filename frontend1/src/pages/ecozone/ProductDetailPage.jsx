import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../../services/api";
import {
  Leaf,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Recycle,
} from "lucide-react";
import "../../styles/EcoProductDetail.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await ApiService.getEcoZoneProduct(id);
      const item = data?.product || data;
      setProduct(item);
      setActiveImage(0);
      setQuantity(1);
    } catch (err) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const images = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images.map((img) => img.url || img);
    }
    return [];
  }, [product]);

  const currentImage =
    images[activeImage] || "https://via.placeholder.com/800x800?text=No+Image";

  const ecoScore = Number(product?.ecoScore ?? 0);
  const co2SavedKg = Number(product?.co2SavedKg ?? 0);
  const reviewCount =
    product?.reviewStats?.totalReviews ??
    product?.productreviews?.length ??
    0;
  const averageRating = product?.reviewStats?.averageRating ?? 0;
  const inStock = (product?.stock?.quantity ?? 0) > 0;

  const ecoLabel =
    ecoScore >= 80
      ? "Excellent eco choice"
      : ecoScore >= 60
      ? "Strong eco choice"
      : ecoScore >= 40
      ? "Moderate eco impact"
      : "Lower eco score";

  const handlePrev = () => {
    if (!images.length) return;
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (!images.length) return;
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const handleQtyChange = (delta) => {
    const maxQty = Math.max(1, product?.stock?.quantity || 1);
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, maxQty)));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await ApiService.addToCart(product._id, quantity, {
        productname: product.productname,
        productprice: product.productprice,
        image: product?.images?.[0]?.url || "",
        ecoScore: product.ecoScore,
      });
      navigate("/cart");
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await ApiService.addToCart(product._id, quantity, {
        productname: product.productname,
        productprice: product.productprice,
        image: product?.images?.[0]?.url || "",
        ecoScore: product.ecoScore,
      });
      navigate("/checkout");
    } catch (err) {
      alert(err.message || "Failed to proceed");
    }
  };

  if (loading) {
    return (
      <div className="eco-page eco-center">
        <div className="eco-loader">
          <Loader2 className="spin" size={28} />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="eco-page eco-center">
        <div className="eco-error">
          <AlertCircle size={22} />
          <p>{error}</p>
          <button className="eco-btn primary" onClick={fetchProduct}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="eco-page eco-center">
        <div className="eco-error">
          <AlertCircle size={22} />
          <p>Product not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="eco-page">
      <header className="eco-header">
        <div className="eco-container eco-header-inner">
          <div>
            <p className="eco-brand">EcoZone</p>
            <h2 className="eco-header-title">Product details</h2>
          </div>

          <div className="eco-header-badge">
            <Leaf size={16} />
            <span>{ecoLabel}</span>
          </div>
        </div>
      </header>

      <main className="eco-container">
        <section className="eco-top-grid">
          <section className="eco-gallery-card">
            <div className="eco-main-image-wrap">
              <button
                className="img-nav left"
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>

              <img
                src={currentImage}
                alt={product.productname}
                className="eco-main-image"
              />

              <button
                className="img-nav right"
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="eco-thumbs">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`eco-thumb ${activeImage === idx ? "active" : ""}`}
                  onClick={() => setActiveImage(idx)}
                  type="button"
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="eco-details-card">
            <div className="eco-title-row">
              <div>
                <span className="eco-chip">{product.category}</span>
                {product.subcategory && (
                  <span className="eco-chip muted">{product.subcategory}</span>
                )}
                <h1 className="eco-title">{product.productname}</h1>
              </div>

              <div className="eco-rating-box">
                <div className="eco-stars">
                  <Star size={16} fill="currentColor" />
                  <span>{Number(averageRating).toFixed(1)}</span>
                </div>
                <p>{reviewCount} reviews</p>
              </div>
            </div>

            <div className="eco-price-block">
              <p className="eco-price">
                ₹{Number(product.productprice).toLocaleString("en-IN")}
              </p>
              {product.originalPrice ? (
                <p className="eco-original-price">
                  ₹{Number(product.originalPrice).toLocaleString("en-IN")}
                </p>
              ) : null}
            </div>

            <div className="eco-sustainability-panel">
              <div className="eco-score-ring">
                <div className="eco-score-number">{ecoScore}</div>
                <div className="eco-score-label">EcoScore</div>
              </div>

              <div className="eco-score-meta">
                <h3>{ecoLabel}</h3>
                <p>
                  {product.ecoAnalysisJustification ||
                    "This product was scored based on material, purpose, category, and sustainability keywords."}
                </p>

                <div className="eco-impact-row">
                  <div className="eco-impact-item">
                    <Recycle size={18} />
                    <div>
                      <strong>{ecoScore}/100</strong>
                      <span>EcoScore</span>
                    </div>
                  </div>

                  <div className="eco-impact-item">
                    <Leaf size={18} />
                    <div>
                      <strong>{co2SavedKg.toFixed(2)} kg</strong>
                      <span>CO₂ saved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="eco-info-grid">
              <div className="eco-info-box">
                <ShieldCheck size={18} />
                <div>
                  <strong>Trusted creator</strong>
                  <span>{product?.createdBy?.username || "Seller"}</span>
                </div>
              </div>

              <div className="eco-info-box">
                <Truck size={18} />
                <div>
                  <strong>Delivery</strong>
                  <span>Shipping available at checkout</span>
                </div>
              </div>

              <div className="eco-info-box">
                <Heart size={18} />
                <div>
                  <strong>EcoZone pick</strong>
                  <span>Curated sustainable listing</span>
                </div>
              </div>
            </div>

            <div className="eco-specs">
              <h3>Highlights</h3>
              <div className="eco-tags">
                {(product.tags || []).map((tag) => (
                  <span key={tag} className="eco-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="eco-stock-row">
              <span className={inStock ? "in-stock" : "out-stock"}>
                {inStock
                  ? `In stock (${product.stock.quantity})`
                  : "Out of stock"}
              </span>

              <div className="eco-qty">
                <button type="button" onClick={() => handleQtyChange(-1)}>
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => handleQtyChange(1)}>
                  +
                </button>
              </div>
            </div>

            <div className="eco-actions">
              <button
                type="button"
                className="eco-btn secondary"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                <ShoppingCart size={18} />
                Add to cart
              </button>

              <button
                type="button"
                className="eco-btn primary"
                onClick={handleBuyNow}
                disabled={!inStock}
              >
                Buy now
              </button>
            </div>

            <div className="eco-features">
              <div>
                <Recycle size={18} />
                <span>Eco-friendly materials</span>
              </div>
              <div>
                <Truck size={18} />
                <span>Fast delivery support</span>
              </div>
              <div>
                <Heart size={18} />
                <span>Made for conscious buyers</span>
              </div>
            </div>
          </section>
        </section>

        <section className="eco-description-card">
          <h3>Description</h3>
          <p>{product.productdescription}</p>
        </section>
      </main>
    </div>
  );
};

export default ProductDetailPage;