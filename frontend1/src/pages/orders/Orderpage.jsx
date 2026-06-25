import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/OrdersPage.css';

const API_BASE = '/api/v1';
const API_ENDPOINTS = {
  MY_ORDERS: `${API_BASE}/orders/my-orders`,
  SEARCH_ORDERS: `${API_BASE}/orders/search`,
  CANCEL_ORDER: (id) => `${API_BASE}/orders/${id}/cancel`,
};

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

const normalizeStatus = (status) => (status || '').toLowerCase().trim();

const getItemImage = (item) => {
  const firstImage = item?.product?.images?.[0];

  if (!firstImage) return '';
  if (typeof firstImage === 'string') return firstImage;
  if (typeof firstImage === 'object') return firstImage.url || '';
  return '';
};

const getItemKey = (item, idx) =>
  item?._id ||
  item?.id ||
  item?.product?._id ||
  `${item?.product?.productname || 'item'}-${idx}`;

const StatusBadge = ({ status }) => {
  const normalized = normalizeStatus(status);
  const cls = normalized.replace(/\s+/g, '-');

  return (
    <span className={`status-badge status--${cls || 'unknown'}`}>
      {status || 'Unknown'}
    </span>
  );
};

const OrderItemRow = ({ item, index }) => {
  const name = item?.product?.productname ?? item?.name ?? 'Product';
  const price = item?.priceAtPurchase ?? item?.product?.productprice ?? 0;
  const image = getItemImage(item);

  return (
    <div className="item-row" key={getItemKey(item, index)}>
      <div className="item-icon-wrapper">
        {image ? (
          <img className="item-image" src={image} alt={name} />
        ) : (
          <svg className="item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        )}
      </div>

      <div className="item-details">
        <h4 className="item-name">{name}</h4>
        <p className="item-quantity">Quantity: {item?.quantity || 0}</p>
      </div>

      <div className="item-price">
        <p>{currency(price * (item?.quantity || 0))}</p>
      </div>
    </div>
  );
};

const canCancel = (status) => {
  const s = normalizeStatus(status);
  return s === 'pending' || s === 'confirmed';
};

const actionButtonsConfig = {
  delivered: ['View Details', 'Reorder'],
  shipped: ['Track Order'],
  'in transit': ['Track Order', 'Cancel'],
  processing: ['View Details', 'Cancel'],
  confirmed: ['View Details', 'Cancel'],
  pending: ['View Details', 'Cancel'],
};

const OrderCard = ({ order, onCancel, onView, onTrack, onReorder }) => {
  const status = normalizeStatus(order.orderStatus || order.status);
  const placedAt = order.orderPlacedAt || order.date;
  const orderId = order._id || order.id || '—';

  const subtotal = order?.costBreakdown?.subtotal ?? null;
  const tax = order?.costBreakdown?.tax ?? null;
  const shipping = order?.costBreakdown?.shipping ?? null;
  const total = order?.totalCost ?? null;

  const items = order.products || order.items || [];

  const renderButton = (label) => {
    switch (label) {
      case 'View Details':
        return (
          <button key={label} className="btn btn--primary" onClick={() => onView(order)}>
            View Details
          </button>
        );
      case 'Reorder':
        return (
          <button key={label} className="btn btn--secondary" onClick={() => onReorder(order)}>
            Reorder
          </button>
        );
      case 'Track Order':
        return (
          <button key={label} className="btn btn--primary" onClick={() => onTrack(order)}>
            Track Order
          </button>
        );
      case 'Cancel':
        return canCancel(status) ? (
          <button key={label} className="btn btn--danger" onClick={() => onCancel(order)}>
            Cancel
          </button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <article className="order-card">
      <div className="card-header">
        <div>
          <h3 className="order-id">Order #{orderId}</h3>
          <p className="order-date">
            Placed on {placedAt ? new Date(placedAt).toLocaleDateString() : '—'}
          </p>
        </div>

        <StatusBadge status={order.orderStatus || order.status} />
      </div>

      <div className="order-items">
        {items.map((item, idx) => (
          <OrderItemRow
            key={getItemKey(item, idx)}
            item={item}
            index={idx}
          />
        ))}
      </div>

      <div className="totals">
        {subtotal != null && (
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{currency(subtotal)}</span>
          </div>
        )}
        {tax != null && (
          <div className="totals-row">
            <span>Tax</span>
            <span>{currency(tax)}</span>
          </div>
        )}
        {shipping != null && (
          <div className="totals-row">
            <span>Shipping</span>
            <span>{currency(shipping)}</span>
          </div>
        )}
        {total != null && (
          <div className="totals-row totals-row--total">
            <span>Total</span>
            <span>{currency(total)}</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        {(actionButtonsConfig[status] || []).map(renderButton)}
      </div>
    </article>
  );
};

const useQuery = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    status: '',
    name: '',
  });

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

const OrdersPage = () => {
  const { params, setParams, queryString } = useQuery();

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErr('');

    try {
      const isSearch = params.name.trim().length >= 2;
      const url = isSearch
        ? `${API_ENDPOINTS.SEARCH_ORDERS}?${queryString}`
        : `${API_ENDPOINTS.MY_ORDERS}?${queryString}`;

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to load orders (${res.status})`);
      }

      const data = await res.json();
      const list = Array.isArray(data.orders) ? data.orders : [];

      setOrders(list);
      setPagination(
        data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalOrders: list.length,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (e) {
      setErr(e.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [params.name, queryString]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onCancel = async (order) => {
    const status = order?.orderStatus || order?.status;

    if (!canCancel(status)) {
      alert('This order cannot be cancelled at its current status.');
      return;
    }

    const reason = window.prompt('Provide a cancellation reason (optional):');
    if (reason === null) return;

    const confirmed = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmed) return;

    try {
      const res = await fetch(API_ENDPOINTS.CANCEL_ORDER(order._id), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Cancel failed (${res.status})`);
      }

      await fetchOrders();
      alert('Order cancelled successfully');
    } catch (e) {
      alert(e.message || 'Cancel failed');
    }
  };

  const onView = (order) => {
    window.location.href = `/orders/${order._id}`;
  };

  const onTrack = (order) => {
    const trackingNumber = order?.trackingNumber;

    if (trackingNumber) {
      window.open(
        `https://track.aftership.com/${encodeURIComponent(trackingNumber)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } else {
      alert('Tracking number not available yet.');
    }
  };

  const onReorder = () => {
    alert('Reorder flow not implemented.');
  };

  const handleSearchChange = (e) => {
    setParams((prev) => ({
      ...prev,
      name: e.target.value,
      page: 1,
    }));
  };

  const handleStatusFilter = (e) => {
    setParams((prev) => ({
      ...prev,
      status: e.target.value,
      page: 1,
    }));
  };

  const changePage = (next) => {
    setParams((prev) => ({
      ...prev,
      page: Math.max(1, prev.page + next),
    }));
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

            <select
              className="select"
              value={params.status}
              onChange={handleStatusFilter}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="in transit">In Transit</option>
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

        {!loading &&
          !err &&
          orders.map((order) => (
            <OrderCard
              key={order._id || order.id}
              order={order}
              onCancel={onCancel}
              onView={onView}
              onTrack={onTrack}
              onReorder={onReorder}
            />
          ))}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn"
              disabled={!pagination.hasPrevPage}
              onClick={() => changePage(-1)}
            >
              Prev
            </button>

            <span className="page-info">
              Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
            </span>

            <button
              className="btn"
              disabled={!pagination.hasNextPage}
              onClick={() => changePage(1)}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;