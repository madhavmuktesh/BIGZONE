import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/OrderDetailsPage.css";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const API_ENDPOINTS = {
  ORDER: (id) => `${API_BASE}/orders/${id}`,
  INVOICE: (id) => `${API_BASE}/orders/${id}/invoice`,
};

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch(API_ENDPOINTS.ORDER(id), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load order");
      }

      setOrder(data.order);
    } catch (error) {
      setErr(error.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    window.open(API_ENDPOINTS.INVOICE(id), "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="page-background" style={{ padding: 20 }}>
        Loading order...
      </div>
    );
  }

  if (err) {
    return (
      <div className="page-background" style={{ padding: 20 }}>
        <p>{err}</p>
        <button onClick={() => navigate("/orders")}>Back to Orders</button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="page-background" style={{ padding: 20 }}>
      <button onClick={() => navigate("/orders")}>Back to Orders</button>

      <div className="order-details-card">
        <h1>Order Details</h1>
        <p><strong>Order ID:</strong> {order._id}</p>
        <p><strong>Status:</strong> {order.orderStatus}</p>
        <p><strong>Payment:</strong> {order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        <p>
          <strong>Placed At:</strong>{" "}
          {order.orderPlacedAt ? new Date(order.orderPlacedAt).toLocaleString() : "—"}
        </p>

        <h2>Shipping Address</h2>
        <p>{order.shippingAddress?.fullName}</p>
        <p>{order.shippingAddress?.mobile}</p>
        <p>{order.shippingAddress?.house}</p>
        <p>{order.shippingAddress?.area}</p>
        <p>
          {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
          {order.shippingAddress?.pincode}
        </p>
        <p>{order.shippingAddress?.country}</p>

        <h2>Items</h2>
        {order.products?.map((item, idx) => (
          <div key={idx} className="order-item-box">
            <p><strong>Product:</strong> {item.product?.productname || "Product"}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Price:</strong> {currency(item.priceAtPurchase)}</p>
            <p>
              <strong>Line Total:</strong> {currency(item.priceAtPurchase * item.quantity)}
            </p>
          </div>
        ))}

        <h2>Cost Breakdown</h2>
        <p>Subtotal: {currency(order.costBreakdown?.subtotal)}</p>
        <p>Tax: {currency(order.costBreakdown?.tax)}</p>
        <p>Shipping: {currency(order.costBreakdown?.shipping)}</p>
        <p>Discount: {currency(order.costBreakdown?.discount)}</p>
        <p><strong>Total: {currency(order.totalCost)}</strong></p>

        <div style={{ marginTop: 16 }}>
          <button onClick={downloadInvoice}>Download Invoice</button>
        </div>

        {order.statusHistory?.length > 0 && (
          <>
            <h2>Status History</h2>
            {order.statusHistory.map((entry, idx) => (
              <div key={idx} className="order-item-box">
                <p><strong>Status:</strong> {entry.status}</p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : "—"}
                </p>
                {entry.note && <p><strong>Note:</strong> {entry.note}</p>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsPage;