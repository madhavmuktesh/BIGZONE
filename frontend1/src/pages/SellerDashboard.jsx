import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "../styles/SellerDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_COLORS = {
  pending: "#b7791f",
  confirmed: "#2563eb",
  processing: "#7c3aed",
  shipped: "#0891b2",
  delivered: "#15803d",
  cancelled: "#dc2626",
};

const LOW_STOCK_LIMIT = 5;

const getStockQty = (product) => {
  if (product?.stock?.quantity !== undefined) {
    return Number(product.stock.quantity) || 0;
  }
  return Number(product?.stock) || 0;
};

const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatCard = ({ label, value, color = "#111827" }) => {
  return (
    <div className="seller-dashboard-stat-card">
      <p className="seller-dashboard-stat-label">{label}</p>
      <h3 className="seller-dashboard-stat-value" style={{ color }}>
        {value}
      </h3>
    </div>
  );
};

const SellerDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const [errorState, setErrorState] = useState({
    products: "",
    orders: "",
  });

  const fetchJSON = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      console.error("API Error:", {
        url: `${API_BASE_URL}${endpoint}`,
        status: response.status,
        response: data,
        requestBody: options.body,
      });

      throw new Error(
        data.message ||
          (Array.isArray(data.errors)
            ? data.errors
                .map((err) =>
                  typeof err === "string" ? err : `${err.path}: ${err.message}`
                )
                .join(", ")
            : "Request failed")
      );
    }

    return data;
  }, []);

  const fetchMyProducts = useCallback(async () => {
    setFetchingProducts(true);
    setErrorState((prev) => ({ ...prev, products: "" }));

    try {
      const data = await fetchJSON("/products/my-products");
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      setErrorState((prev) => ({
        ...prev,
        products: error.message || "Failed to load products",
      }));
    } finally {
      setFetchingProducts(false);
    }
  }, [fetchJSON]);

  const fetchSellerOrders = useCallback(async () => {
    setFetchingOrders(true);
    setErrorState((prev) => ({ ...prev, orders: "" }));

    try {
      const data = await fetchJSON("/orders/seller-orders");
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      setErrorState((prev) => ({
        ...prev,
        orders: error.message || "Failed to load orders",
      }));
    } finally {
      setFetchingOrders(false);
    }
  }, [fetchJSON]);

  const loadDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchMyProducts(), fetchSellerOrders()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchMyProducts, fetchSellerOrders]);

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to continue.");
      navigate("/signin");
      return;
    }

    if (!loading && user) {
      loadDashboard();
    }
  }, [user, loading, navigate, loadDashboard]);

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      await fetchJSON(`/products/${productId}`, {
        method: "DELETE",
      });

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const handleEdit = (productId) => {
    navigate(`/edit-product/${productId}`);
  };

  const handleStatusUpdate = async (orderId, status) => {
    if (!ORDER_STATUSES.includes(status)) {
      toast.error("Invalid status");
      return;
    }

    try {
      setStatusUpdatingId(orderId);

      const payload = { status };

      if (status === "shipped") {
        const trackingNumber = window.prompt("Enter tracking ID / tracking number:");
        if (!trackingNumber || !trackingNumber.trim()) {
          toast.error("Tracking number is required when marking order as shipped");
          setStatusUpdatingId(null);
          return;
        }
        payload.trackingNumber = trackingNumber.trim();
        payload.note = `Order shipped. Tracking ID: ${trackingNumber.trim()}`;
      }

      if (status === "cancelled") {
        const cancellationReason = window.prompt("Enter cancellation reason:");
        if (!cancellationReason || !cancellationReason.trim()) {
          toast.error("Cancellation reason is required");
          setStatusUpdatingId(null);
          return;
        }
        payload.cancellationReason = cancellationReason.trim();
        payload.note = cancellationReason.trim();
      }

      const data = await fetchJSON(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                ...data.order,
                orderStatus: data.order?.orderStatus || status,
                trackingNumber: data.order?.trackingNumber || order.trackingNumber,
                statusHistory: data.order?.statusHistory || order.statusHistory || [],
              }
            : order
        )
      );

      toast.success(`Order marked as ${status}`);
    } catch (error) {
      console.error("Status update failed:", error);
      toast.error(error.message || "Failed to update order status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return ["confirmed", "cancelled"];
      case "confirmed":
        return ["processing", "cancelled"];
      case "processing":
        return ["shipped", "cancelled"];
      case "shipped":
        return ["delivered"];
      default:
        return [];
    }
  };

  const filteredProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return products;

    return products.filter((product) => {
      const name = product.productname?.toLowerCase() || "";
      const category = product.category?.toLowerCase() || "";
      return name.includes(search) || category.includes(search);
    });
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "all") return orders;
    return orders.filter((order) => (order.orderStatus || "pending") === orderFilter);
  }, [orders, orderFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(
      (p) => getStockQty(p) <= LOW_STOCK_LIMIT
    ).length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => (o.orderStatus || "pending") === "pending"
    ).length;
    const activeOrders = orders.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(
        o.orderStatus || "pending"
      )
    ).length;

    return {
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      activeOrders,
    };
  }, [products, orders]);

  if (loading) {
    return <div className="seller-dashboard-center-box">Loading dashboard...</div>;
  }

  return (
    <div className="seller-dashboard seller-dashboard-page">
      <Toaster position="top-center" />

      <div className="seller-dashboard-header">
        <div>
          <h1 className="seller-dashboard-title">Seller Dashboard</h1>
          <p className="seller-dashboard-subtitle">
            Manage products, track orders, and update order progress.
          </p>
        </div>

        <div className="seller-dashboard-header-actions">
          <button
            onClick={loadDashboard}
            className="seller-dashboard-secondary-btn"
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => navigate("/form")}
            className="seller-dashboard-primary-btn"
          >
            + Add New Product
          </button>
        </div>
      </div>

      <div className="seller-dashboard-stats-grid">
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Low Stock" value={stats.lowStockProducts} color="#b45309" />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} color="#b7791f" />
        <StatCard label="Active Orders" value={stats.activeOrders} color="#2563eb" />
      </div>

      <div className="seller-dashboard-section">
        <div className="seller-dashboard-section-header">
          <div>
            <h2 className="seller-dashboard-section-title">My Products</h2>
            <p className="seller-dashboard-section-text">
              Edit listings, watch stock, and remove products.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search by name or category"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="seller-dashboard-search-input"
          />
        </div>

        {fetchingProducts ? (
          <div className="seller-dashboard-center-box">Loading products...</div>
        ) : errorState.products ? (
          <div className="seller-dashboard-error-box">
            <p>{errorState.products}</p>
            <button
              onClick={fetchMyProducts}
              className="seller-dashboard-secondary-btn"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="seller-dashboard-empty-box">
            <h3 className="seller-dashboard-empty-title">No products found</h3>
            <p className="seller-dashboard-empty-text">
              Add your first product or change the search text.
            </p>
          </div>
        ) : (
          <div className="seller-dashboard-card-list">
            {filteredProducts.map((product) => {
              const stockQty = getStockQty(product);
              const lowStock = stockQty <= LOW_STOCK_LIMIT;

              return (
                <div key={product._id} className="seller-dashboard-product-card">
                  <div className="seller-dashboard-product-info">
                    <img
                      src={
                        product.images?.[0]?.url ||
                        "https://placehold.co/100x100?text=No+Image"
                      }
                      alt={product.productname || "Product"}
                      className="seller-dashboard-product-image"
                    />

                    <div style={{ flex: 1 }}>
                      <h3 className="seller-dashboard-product-name">
                        {product.productname}
                      </h3>
                      <p className="seller-dashboard-meta-text">
                        Category: {product.category || "—"}
                      </p>
                      <p className="seller-dashboard-meta-text">
                        Price: {formatCurrency(product.productprice)}
                      </p>
                      <p
                        className="seller-dashboard-meta-text"
                        style={{ color: lowStock ? "#b45309" : "#374151" }}
                      >
                        Stock: {stockQty} {lowStock ? "(Low stock)" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="seller-dashboard-action-group">
                    <button
                      onClick={() => handleEdit(product._id)}
                      className="seller-dashboard-secondary-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="seller-dashboard-danger-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="seller-dashboard-section">
        <div className="seller-dashboard-section-header">
          <div>
            <h2 className="seller-dashboard-section-title">Seller Orders</h2>
            <p className="seller-dashboard-section-text">
              Accept orders and move them through each order stage.
            </p>
          </div>

          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="seller-dashboard-select-input"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {fetchingOrders ? (
          <div className="seller-dashboard-center-box">Loading orders...</div>
        ) : errorState.orders ? (
          <div className="seller-dashboard-error-box">
            <p>{errorState.orders}</p>
            <button
              onClick={fetchSellerOrders}
              className="seller-dashboard-secondary-btn"
            >
              Retry
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="seller-dashboard-empty-box">
            <h3 className="seller-dashboard-empty-title">No orders available</h3>
            <p className="seller-dashboard-empty-text">
              Orders placed for your products will appear here.
            </p>
          </div>
        ) : (
          <div className="seller-dashboard-order-list">
            {filteredOrders.map((order) => {
              const currentStatus = order.orderStatus || "pending";
              const nextStatuses = getNextStatuses(currentStatus);

              return (
                <div key={order._id} className="seller-dashboard-order-card">
                  <div className="seller-dashboard-order-top">
                    <div>
                      <h3 className="seller-dashboard-order-id">
                        Order #{order._id?.slice(-8).toUpperCase()}
                      </h3>
                      <p className="seller-dashboard-meta-text">
                        Date: {formatDate(order.createdAt || order.orderPlacedAt)} |
                        {" "}Payment: {order.paymentMethod || "—"}
                      </p>
                      <p className="seller-dashboard-meta-text">
                        Total: {formatCurrency(order.totalAmount || order.totalCost)}
                      </p>
                    </div>

                    <span
                      className="seller-dashboard-badge"
                      style={{
                        backgroundColor: `${STATUS_COLORS[currentStatus] || "#6b7280"}20`,
                        color: STATUS_COLORS[currentStatus] || "#6b7280",
                        borderColor: `${STATUS_COLORS[currentStatus] || "#6b7280"}40`,
                      }}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  <div className="seller-dashboard-items-block">
                    <strong>Items</strong>
                    <ul className="seller-dashboard-item-list">
                      {(order.items || order.products || []).map((item, index) => (
                        <li
                          key={item._id || index}
                          className="seller-dashboard-item-row"
                        >
                          <span>
                            {item.product?.productname ||
                              item.productDetails?.productname ||
                              "Product"}{" "}
                            × {item.quantity || 1}
                          </span>
                          <span>
                            {formatCurrency(
                              item.priceAtPurchase || item.priceAtAddition || item.price
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="seller-dashboard-status-actions">
                    {nextStatuses.length === 0 ? (
                      <p className="seller-dashboard-meta-text">
                        No more actions available.
                      </p>
                    ) : (
                      nextStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order._id, status)}
                          disabled={statusUpdatingId === order._id}
                          className="seller-dashboard-secondary-btn"
                          style={{
                            borderColor: STATUS_COLORS[status] || "#d1d5db",
                            color: STATUS_COLORS[status] || "#111827",
                          }}
                        >
                          {statusUpdatingId === order._id
                            ? "Updating..."
                            : `Mark ${status}`}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;