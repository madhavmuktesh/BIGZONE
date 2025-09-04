import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import "../styles/searchresults.css";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

const computeDiscount = (mrp, price) => {
  if (!mrp || !price || mrp <= 0 || price <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

const SearchResults = () => {
  const queryParams = new URLSearchParams(useLocation().search);
  const query = queryParams.get("query") || "";
  const { addItemToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({}); // per-product loading

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/v1/products/search?query=${encodeURIComponent(query)}`);
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Search Error:", err);
        setError(err.response?.data?.message || "An error occurred while fetching products.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart!");
      sessionStorage.setItem("redirectAfterLogin", "/cart");
      navigate("/signin");
      return;
    }
    
    setAddingToCart((prev) => ({ ...prev, [product._id]: true }));
    
    try {
      await addItemToCart(product._id, 1, {
        productname: product.productname,
        productprice: product.productprice,
        currentPrice: product.productprice,
        images: product.images,
        stock: product.stock,
      });
      // Centered: "name + added to cart"
      toast.success(`${product.productname} added to cart`, {
        duration: 2500,
        position: "top-center", // per-toast override (works even if Toaster is elsewhere)
      });
    } catch (err) {
      toast.error(err.message || "Failed to add item to cart");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  if (loading) return <p>Loading search results...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;
  if (!products.length) return <p>No products found for "{query}".</p>;

  return (
    <div className="sr-wrap">
      <h2 className="sr-heading">Search Results for "{query}"</h2>
      <div className="card-grid">
        {products.map((p) => {
          const price = Number(p.productprice);
          const mrp = Number(p.originalPrice || p.mrp || 0);
          const off = computeDiscount(mrp, price);
          
          // FIXED: Proper image source handling
          const imgSrc = p.images?.[0]?.url || p.images?.url || "https://via.placeholder.com/600x400?text=No+Image";
          const isAddingThisItem = !!addingToCart[p._id];

          return (
            <article key={p._id} className="sp-card">
              <Link to={`/products/${p._id}`} className="card-link" aria-label={p.productname} />
              
              <div className="img-box">
                <img
                  src={imgSrc}
                  alt={p.productname}
                  loading="lazy"
                  onError={(ev) => {
                    ev.currentTarget.onerror = null;
                    ev.currentTarget.src = "https://via.placeholder.com/600x400?text=No+Image";
                  }}
                />
                {off > 0 && <span className="badge-off">{off}% off</span>}
              </div>
              
              <h3 className="title" title={p.productname}>{p.productname}</h3>
              
              <div className="price-row">
                <span className="price">{formatINR(price)}</span>
                {mrp > price && (
                  <>
                    <span className="mrp">M.R.P: <s>{formatINR(mrp)}</s></span>
                    <span className="save">{off}%</span>
                  </>
                )}
              </div>
              
              <div className="meta">
                <span className="cat">{p.category}</span>
                {p.subcategory && <span className="dot">•</span>}
                {p.subcategory && <span className="sub">{p.subcategory}</span>}
              </div>
              
              <button
                className="cta"
                onClick={(e) => handleAddToCart(e, p)}
                disabled={isAddingThisItem}
                type="button"
              >
                {isAddingThisItem ? "Adding..." : "Add to Cart"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
