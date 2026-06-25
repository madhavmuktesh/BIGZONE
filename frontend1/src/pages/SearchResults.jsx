import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import "../styles/searchresults.css";

const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const computeDiscount = (mrp, price) => {
  if (!mrp || !price || mrp <= 0 || price <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const currentPage = Math.max(parseInt(searchParams.get("page")) || 1, 1);

  const { addItemToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0 });
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("query", query.trim());
        if (category.trim()) params.set("category", category.trim());
        params.set("page", String(currentPage));
        params.set("limit", "12");

        const endpoint = query.trim()
          ? `/api/v1/products/search?${params.toString()}`
          : `/api/v1/products?${params.toString()}`;

        const res = await axios.get(endpoint);
        const list = res.data.products || [];

        setProducts(list);
        setPagination({
          totalPages: res.data.totalPages || 1,
          totalCount: res.data.totalCount ?? list.length,
        });
      } catch (err) {
        console.error("Search Error:", err);
        setError(err.response?.data?.message || "An error occurred while fetching products.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, category, currentPage]);

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "price-low") return list.sort((a, b) => (a.productprice || 0) - (b.productprice || 0));
    if (sortBy === "price-high") return list.sort((a, b) => (b.productprice || 0) - (a.productprice || 0));
    return list;
  }, [products, sortBy]);

  const updateParams = (nextPage) => {
    const next = new URLSearchParams();

    if (query.trim()) next.set("query", query.trim());
    if (category.trim()) next.set("category", category.trim());
    if (nextPage > 1) next.set("page", String(nextPage));

    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      updateParams(newPage);
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

  const titleText = query.trim()
    ? `Search Results for "${query}"`
    : category.trim()
    ? `Category: ${category}`
    : "All Products";

  const emptyText = query.trim()
    ? `No products found for "${query}".`
    : category.trim()
    ? `No products found in "${category}".`
    : "No products available.";

  if (loading) {
    return (
      <div className="sr-wrap sr-state">
        <div className="sr-state-box">Loading search results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sr-wrap sr-state">
        <div className="sr-state-box sr-state-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="sr-wrap">
      <div className="sr-toolbar">
        <div>
          <h2 className="sr-heading">{titleText}</h2>
          <span className="sr-subheading">{pagination.totalCount} products found</span>
        </div>

        <div className="sr-sort">
          <label htmlFor="sortBy" className="sr-sort-label">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sr-select"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {!sortedProducts.length ? (
        <div className="sr-empty">
          <p>{emptyText}</p>
          <Link to="/search" className="sr-empty-link">View all products</Link>
        </div>
      ) : (
        <div className="card-grid">
          {sortedProducts.map((p) => {
            const price = Number(p.productprice);
            const mrp = Number(p.originalPrice || p.mrp || 0);
            const off = computeDiscount(mrp, price);
            const imgSrc = p.images?.[0]?.url || p.images?.url || "https://via.placeholder.com/600x400?text=No+Image";
            const isAddingThisItem = !!addingToCart[p._id];

            return (
              <article key={p._id} className="sp-card">
                <Link to={`/products/${p._id}`} className="card-link" aria-label={`View ${p.productname}`} />

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

                {Number(p.ecoScore) > 60 && (
                  <div className="eco-pill">
                    🌱 Eco Score: {p.ecoScore}
                  </div>
                )}

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
      )}

      {pagination.totalPages > 1 && (
        <div className="sr-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="sr-page-btn"
            type="button"
          >
            Previous
          </button>

          <span className="sr-page-text">
            Page {currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="sr-page-btn"
            type="button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;