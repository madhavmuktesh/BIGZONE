import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
  // Using useSearchParams allows us to update the URL when changing pages
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const { addItemToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});

  // --- NEW: Enterprise State ---
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [sortBy, setSortBy] = useState("relevance");

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
        // Updated API call to pass page and limit limits
        const res = await axios.get(`/api/v1/products/search?query=${encodeURIComponent(query)}&page=${currentPage}&limit=12`);
        setProducts(res.data.products || []);
        setPagination({
            totalPages: res.data.totalPages || 1,
            totalCount: res.data.totalCount || (res.data.products ? res.data.products.length : 0)
        });
      } catch (err) {
        console.error("Search Error:", err);
        setError(err.response?.data?.message || "An error occurred while fetching products.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, currentPage]);

  // --- NEW: Local Sorting Logic ---
  const sortedProducts = [...products].sort((a, b) => {
      if (sortBy === 'price-low') return (a.productprice || 0) - (b.productprice || 0);
      if (sortBy === 'price-high') return (b.productprice || 0) - (a.productprice || 0);
      return 0; // relevance
  });

  const handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
          setSearchParams({ query, page: newPage });
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

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
      toast.success(`${product.productname} added to cart`, {
        duration: 2500,
        position: "top-center",
      });
    } catch (err) {
      toast.error(err.message || "Failed to add item to cart");
    } finally {
      setAddingToCart((prev) => ({ ...prev, [product._id]: false }));
    }
  };

  if (loading) return <p style={{ padding: '20px', textAlign: 'center' }}>Loading search results...</p>;
  if (error) return <p style={{ color: "red", padding: '20px', textAlign: 'center' }}>Error: {error}</p>;
  if (!products.length) return <p style={{ padding: '20px', textAlign: 'center' }}>No products found for "{query}".</p>;

  return (
    <div className="sr-wrap">
      
      {/* NEW: Header with Total Count and Sorting Dropdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div>
            <h2 className="sr-heading" style={{ marginBottom: '5px' }}>Search Results for "{query}"</h2>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>{pagination.totalCount} products found</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 'bold' }}>Sort by:</label>
              <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer' }}
              >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
              </select>
          </div>
      </div>

      <div className="card-grid">
        {/* Render sortedProducts instead of products */}
        {sortedProducts.map((p) => {
          const price = Number(p.productprice);
          const mrp = Number(p.originalPrice || p.mrp || 0);
          const off = computeDiscount(mrp, price);
          
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

              {/* NEW: Show Eco-Score if applicable */}
              {p.ecoScore > 60 && (
                <div style={{ marginTop: '5px' }}>
                    <span style={{ backgroundColor: '#def7ec', color: '#03543f', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        🌱 Eco Score: {p.ecoScore}
                    </span>
                </div>
              )}
              
              <button
                className="cta"
                onClick={(e) => handleAddToCart(e, p)}
                disabled={isAddingThisItem}
                type="button"
                style={{ marginTop: '10px' }}
              >
                {isAddingThisItem ? "Adding..." : "Add to Cart"}
              </button>
            </article>
          );
        })}
      </div>

      {/* NEW: Pagination Controls */}
      {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '40px', paddingBottom: '20px' }}>
              <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: '#fff' }}
              >
                  Previous
              </button>
              
              <span style={{ fontWeight: 'bold' }}>
                  Page {currentPage} of {pagination.totalPages}
              </span>
              
              <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: currentPage === pagination.totalPages ? 'not-allowed' : 'pointer', backgroundColor: '#fff' }}
              >
                  Next
              </button>
          </div>
      )}

    </div>
  );
};

export default SearchResults;