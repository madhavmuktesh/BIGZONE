import React, { useEffect, useMemo, useState, useCallback } from 'react';
import '../styles/OrdersPage.css';

// REFACTOR: Centralized API endpoints for better maintainability.
const API_BASE = '/api/v1';
const API_ENDPOINTS = {
  MY_ORDERS: `${API_BASE}/orders/my-orders`,
  SEARCH_ORDERS: `${API_BASE}/orders/search`,
  CANCEL_ORDER: (id) => `${API_BASE}/orders/${id}/cancel`,
};

// --- Helper Components ---

const StatusBadge = ({ status }) => {
  const cls = status?.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-badge status--${cls}`}>{status}</span>;
};

const currency = (n) => `₹${(Number(n || 0)).toFixed(2)}`;

const OrderItemRow = ({ item }) => {
  // item.product may be populated with productname, productprice, images per backend
  const name = item?.product?.productname ?? item?.name ?? 'Product';
  const price = item?.priceAtPurchase ?? item?.product?.productprice ?? 0;
  // FIX: Corrected optional chaining to get the first image from the array.
  const img = item?.product?.images?.[0];

  return (
    <div className="item-row">
      <div className="item-icon-wrapper">
        {img ? (
          <img className="item-image" src={img} alt={name} />
        ) : (
          <svg className="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        )}
      </div>
      <div className="item-details">
        <h4 className="item-name">{name}</h4>
        <p className="item-quantity">Quantity: {item.quantity}</p>
      </div>
      <div className="item-price">
        <p>{currency(price * item.quantity)}</p>
      </div>
    </div>
  );
};

const canCancel = (status) => {
  const s = (status || '').toLowerCase();
  return s === 'pending' || s === 'confirmed';
};

// REFACTOR: Declarative approach for rendering action buttons.
const actionButtonsConfig = {
  delivered: ['View Details', 'Reorder'],
  shipped: ['Track Order'],
  'in transit': ['Track Order', 'Cancel'],
  processing: ['View Details', 'Cancel'],
  confirmed: ['View Details', 'Cancel'],
  pending: ['View Details', 'Cancel'],
};

const OrderCard = ({ order, onCancel, onView, onTrack, onReorder }) => {
  const status = (order.orderStatus || order.status || '').toLowerCase();
  const placedAt = order.orderPlacedAt || order.date;
  const orderId = order._id || order.id;

  const subtotal = order?.costBreakdown?.subtotal ?? null;
  const tax = order?.costBreakdown?.tax ?? null;
  const shipping = order?.costBreakdown?.shipping ?? null;
  const total = order?.totalCost ?? null;

  const renderButton = (label) => {
    switch (label) {
      case 'View Details':
        return <button key={label} className="btn btn--primary" onClick={() => onView(order)}>View Details</button>;
      case 'Reorder':
        return <button key={label} className="btn btn--secondary" onClick={() => onReorder(order)}>Reorder</button>;
      case 'Track Order':
        return <button key={label} className="btn btn--primary" onClick={() => onTrack(order)}>Track Order</button>;
      case 'Cancel':
        return canCancel(status) && <button key={label} className="btn btn--danger" onClick={() => onCancel(order)}>Cancel</button>;
      default:
        return null;
    }
  };

  return (
    <div className="order-card">
      <div className="card-header">
        <div>
          <h3 className="order-id">Order #{orderId}</h3>
          <p className="order-date">
            Placed on {placedAt ? new Date(placedAt).toLocaleDateString() : '—'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {(order.products || order.items || []).map((item, idx) => (
        <OrderItemRow key={idx} item={item} />
      ))}

      <div className="totals">
        {subtotal != null && <div className="totals-row"><span>Subtotal</span><span>{currency(subtotal)}</span></div>}
        {tax != null && <div className="totals-row"><span>Tax</span><span>{currency(tax)}</span></div>}
        {shipping != null && <div className="totals-row"><span>Shipping</span><span>{currency(shipping)}</span></div>}
        {total != null && <div className="totals-row totals-row--total"><span>Total</span><span>{currency(total)}</span></div>}
      </div>

      <div className="card-actions">
        {(actionButtonsConfig[status] || []).map(renderButton)}
      </div>
    </div>
  );
};

// --- Custom Hook for Query Params ---

const useQuery = () => {
  const [params, setParams] = useState({ page: 1, limit: 10, status: '', name: '' });
  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    q.set('page', String(params.page));
    q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.name) q.set('name', params.name);
    return q.toString();
  }, [params]);
  return { params, setParams, queryString };
};

// --- Main Page Component ---

const OrdersPage = () => {
  const { params, setParams, queryString } = useQuery();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const isSearch = !!params.name && params.name.trim().length >= 2;
      const url = isSearch
        ? `${API_ENDPOINTS.SEARCH_ORDERS}?${queryString}`
        : `${API_ENDPOINTS.MY_ORDERS}?${queryString}`;

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Failed to load orders (${res.status})`);
      }
      const data = await res.json();
      const list = data.orders || [];
      setOrders(list);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalOrders: list.length, hasNextPage: false, hasPrevPage: false });
    } catch (e) {
      setErr(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [queryString, params.name]); // Simplified dependencies

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onCancel = async (order) => {
    if (!canCancel(order.orderStatus)) {
      alert('This order cannot be cancelled at its current status.');
      return;
    }
    const reason = window.prompt('Provide a cancellation reason (optional):');
    // Check if the user clicked "Cancel" on the prompt
    if (reason === null) return;
    
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const res = await fetch(API_ENDPOINTS.CANCEL_ORDER(order._id), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(t || `Cancel failed (${res.status})`);
        }
        await fetchOrders();
        alert('Order cancelled successfully');
      } catch (e) {
        alert(e.message || 'Cancel failed');
      }
    }
  };

  const onView = (order) => {
    window.location.href = `/orders/${order._id}`;
  };

  const onTrack = (order) => {
    const tn = order?.trackingNumber;
    if (tn) {
      window.open(`https://track.aftership.com/${encodeURIComponent(tn)}`, '_blank', 'noopener');
    } else {
      alert('Tracking number not available yet.');
    }
  };

  const onReorder = (order) => {
    alert('Reorder flow not implemented.');
  };

  const handleSearchChange = (e) => {
    setParams((p) => ({ ...p, name: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (e) => {
    setParams((p) => ({ ...p, status: e.target.value, page: 1 }));
  };

  const changePage = (next) => {
    setParams((p) => ({ ...p, page: Math.max(1, p.page + next) }));
  };

  return (
    <div className="page-background">
      <header className="page-header">
        <div className="container header-flex">
          <h1>Your Orders</h1>
          <div className="filters">
            <input
              type="text"
              className="input"
              placeholder="Search by product name (min 2 chars)"
              value={params.name}
              onChange={handleSearchChange}
            />
            <select className="select" value={params.status} onChange={handleStatusFilter}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </header>

      <main className="container page-content">
        {loading && <div className="loading">Loading orders…</div>}
        {err && !loading && <div className="error">{err}</div>}

        {!loading && !err && orders.length === 0 && (
          <div className="empty-state">No orders found.</div>
        )}

        {!loading && !err && orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onCancel={onCancel}
            onView={onView}
            onTrack={onTrack}
            onReorder={onReorder}
          />
        ))}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn" disabled={!pagination?.hasPrevPage} onClick={() => changePage(-1)}>
              Prev
            </button>
            <span className="page-info">
              Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1}
            </span>
            <button className="btn" disabled={!pagination?.hasNextPage} onClick={() => changePage(1)}>
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;