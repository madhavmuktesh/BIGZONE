import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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
  if (product?.stock?.quantity !== undefined) return Number(product.stock.quantity) || 0;
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

  const fetchJSON = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
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
      throw new Error(data.message || "Request failed");
    }

    return data;
  }, []);

  const fetchMyProducts = useCallback(async () => {
    setFetchingProducts(true);
    setErrorState((prev) => ({ ...prev, products: "" }));

    try {
      const data = await fetchJSON("/api/v1/products/my-products");
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
      const data = await fetchJSON("/api/v1/orders/seller-orders");
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
      await fetchJSON(`/api/v1/products/${productId}`, {
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

      await fetchJSON(`/api/v1/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, orderStatus: status } : order
        )
      );

      toast.success(`Order marked as ${status}`);
    } catch (error) {
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
    const lowStockProducts = products.filter((p) => getStockQty(p) <= LOW_STOCK_LIMIT).length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => (o.orderStatus || "pending") === "pending").length;
    const activeOrders = orders.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.orderStatus || "pending")
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
    return <div style={styles.centerBox}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.page}>
      <Toaster position="top-center" />

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Seller Dashboard</h1>
          <p style={styles.subtitle}>
            Manage products, track orders, and update order progress.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button onClick={loadDashboard} style={styles.secondaryBtn} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={() => navigate("/form")} style={styles.primaryBtn}>
            + Add New Product
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Low Stock" value={stats.lowStockProducts} color="#b45309" />
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} color="#b7791f" />
        <StatCard label="Active Orders" value={stats.activeOrders} color="#2563eb" />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>My Products</h2>
            <p style={styles.sectionText}>Edit listings, watch stock, and remove products.</p>
          </div>
          <input
            type="text"
            placeholder="Search by name or category"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {fetchingProducts ? (
          <div style={styles.centerBox}>Loading products...</div>
        ) : errorState.products ? (
          <div style={styles.errorBox}>
            <p>{errorState.products}</p>
            <button onClick={fetchMyProducts} style={styles.secondaryBtn}>Retry</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3 style={styles.emptyTitle}>No products found</h3>
            <p style={styles.emptyText}>
              Add your first product or change the search text.
            </p>
          </div>
        ) : (
          <div style={styles.cardList}>
            {filteredProducts.map((product) => {
              const stockQty = getStockQty(product);
              const lowStock = stockQty <= LOW_STOCK_LIMIT;

              return (
                <div key={product._id} style={styles.productCard}>
                  <div style={styles.productInfo}>
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/100x100?text=No+Image"}
                      alt={product.productname || "Product"}
                      style={styles.productImage}
                    />

                    <div style={{ flex: 1 }}>
                      <h3 style={styles.productName}>{product.productname}</h3>
                      <p style={styles.metaText}>Category: {product.category || "—"}</p>
                      <p style={styles.metaText}>Price: {formatCurrency(product.productprice)}</p>
                      <p style={{ ...styles.metaText, color: lowStock ? "#b45309" : "#374151" }}>
                        Stock: {stockQty} {lowStock ? "(Low stock)" : ""}
                      </p>
                    </div>
                  </div>

                  <div style={styles.actionGroup}>
                    <button onClick={() => handleEdit(product._id)} style={styles.secondaryBtn}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product._id)} style={styles.dangerBtn}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Seller Orders</h2>
            <p style={styles.sectionText}>
              Accept orders and move them through each order stage.
            </p>
          </div>

          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            style={styles.select}
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
          <div style={styles.centerBox}>Loading orders...</div>
        ) : errorState.orders ? (
          <div style={styles.errorBox}>
            <p>{errorState.orders}</p>
            <button onClick={fetchSellerOrders} style={styles.secondaryBtn}>Retry</button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3 style={styles.emptyTitle}>No orders available</h3>
            <p style={styles.emptyText}>Orders placed for your products will appear here.</p>
          </div>
        ) : (
          <div style={styles.orderList}>
            {filteredOrders.map((order) => {
              const currentStatus = order.orderStatus || "pending";
              const nextStatuses = getNextStatuses(currentStatus);

              return (
                <div key={order._id} style={styles.orderCard}>
                  <div style={styles.orderTop}>
                    <div>
                      <h3 style={styles.orderId}>Order #{order._id?.slice(-8).toUpperCase()}</h3>
                      <p style={styles.metaText}>
                        Date: {formatDate(order.createdAt || order.orderPlacedAt)} | Payment:{" "}
                        {order.paymentMethod || "—"}
                      </p>
                      <p style={styles.metaText}>
                        Total: {formatCurrency(order.totalAmount || order.totalCost)}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: `${STATUS_COLORS[currentStatus] || "#6b7280"}20`,
                        color: STATUS_COLORS[currentStatus] || "#6b7280",
                        border: `1px solid ${STATUS_COLORS[currentStatus] || "#6b7280"}40`,
                      }}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  <div style={styles.itemsBlock}>
                    <strong>Items</strong>
                    <ul style={styles.itemList}>
                      {(order.items || order.products || []).map((item, index) => (
                        <li key={item._id || index} style={styles.itemRow}>
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

                  <div style={styles.statusActions}>
                    {nextStatuses.length === 0 ? (
                      <p style={styles.metaText}>No more actions available.</p>
                    ) : (
                      nextStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(order._id, status)}
                          disabled={statusUpdatingId === order._id}
                          style={{
                            ...styles.secondaryBtn,
                            borderColor: STATUS_COLORS[status] || "#d1d5db",
                            color: STATUS_COLORS[status] || "#111827",
                          }}
                        >
                          {statusUpdatingId === order._id ? "Updating..." : `Mark ${status}`}
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

const StatCard = ({ label, value, color = "#111827" }) => {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <h3 style={{ ...styles.statValue, color }}>{value}</h3>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px 16px 40px",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: "8px",
    color: "#475569",
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "10px 16px",
    background: "#0f766e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "10px 16px",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  dangerBtn: {
    padding: "10px 16px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
  },
  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },
  statValue: {
    margin: "8px 0 0",
    fontSize: "28px",
  },
  section: {
    background: "#fff",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
    marginBottom: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },
  sectionText: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  searchInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    minWidth: "260px",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    minWidth: "180px",
    background: "#fff",
  },
  centerBox: {
    padding: "40px",
    textAlign: "center",
    color: "#475569",
  },
  emptyBox: {
    textAlign: "center",
    padding: "40px 20px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  emptyTitle: {
    margin: 0,
    color: "#0f172a",
  },
  emptyText: {
    marginTop: "8px",
    color: "#64748b",
  },
  errorBox: {
    padding: "20px",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#991b1b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  cardList: {
    display: "grid",
    gap: "14px",
  },
  productCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    padding: "16px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#fff",
  },
  productInfo: {
    display: "flex",
    gap: "14px",
    alignItems: "center",
    flex: 1,
    minWidth: "280px",
  },
  productImage: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "10px",
    background: "#f3f4f6",
  },
  productName: {
    margin: "0 0 6px",
    color: "#111827",
  },
  metaText: {
    margin: "4px 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  actionGroup: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  orderList: {
    display: "grid",
    gap: "16px",
  },
  orderCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    background: "#fff",
  },
  orderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },
  orderId: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  itemsBlock: {
    marginBottom: "16px",
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "10px",
  },
  itemList: {
    listStyle: "none",
    padding: 0,
    margin: "10px 0 0",
    display: "grid",
    gap: "8px",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    color: "#334155",
    fontSize: "14px",
  },
  statusActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
};

export default SellerDashboard;