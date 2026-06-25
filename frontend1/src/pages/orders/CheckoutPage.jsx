import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import "../../styles/CheckoutPage.css";

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    mobile: "",
    country: "India",
    house: "",
    area: "",
    city: "",
    state: "",
    pincode: ""
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/v1/addresses", { credentials: "include" });
      const data = await res.json();

      if (data.success) {
        setSavedAddresses(data.addresses);

        if (data.addresses.length > 0) {
          const defaultAddress =
            data.addresses.find((a) => a.makeDefault) || data.addresses[0];

          setSelectedAddressId(defaultAddress._id);
          setShippingAddress({
            fullName: defaultAddress.fullName || "",
            mobile: defaultAddress.mobile || "",
            country: defaultAddress.country || "India",
            house: defaultAddress.house || "",
            area: defaultAddress.area || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            pincode: defaultAddress.pincode || ""
          });
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
    }
  };

  useEffect(() => {
    if (user === undefined) return;

    if (!user || !token) {
      toast.error("Please sign in to checkout");
      navigate("/signin");
      return;
    }

    if (cart && (!cart.items || cart.items.length === 0)) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
    }

    fetchAddresses();
  }, [user, token, cart, navigate]);

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setShippingAddress({
      fullName: address.fullName || "",
      mobile: address.mobile || "",
      country: address.country || "India",
      house: address.house || "",
      area: address.area || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value
    }));
    setSelectedAddressId("");
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    if (
      !shippingAddress.fullName?.trim() ||
      !shippingAddress.mobile?.trim() ||
      !shippingAddress.house?.trim() ||
      !shippingAddress.area?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pincode?.trim()
    ) {
      toast.error("Please fill in all required shipping fields.");
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      toast.error("Your cart is empty.");
      navigate("/cart");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          mobile: shippingAddress.mobile.trim(),
          country: shippingAddress.country.trim(),
          house: shippingAddress.house.trim(),
          area: shippingAddress.area.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state.trim(),
          pincode: shippingAddress.pincode.trim()
        },
        paymentMethod: "COD"
      };

      const response = await fetch("/api/v1/orders/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to place order");
      }

      toast.success("Order placed successfully!");
      await clearCart();

      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Something went wrong during checkout");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart?.totalPrice || 0;

  return (
    <div className="cart-page-body">
      <Toaster position="top-center" reverseOrder={false} />

      <main className="cart-container">
        <div className="breadcrumbs">
          <button type="button" onClick={() => navigate("/cart")} className="breadcrumb-link">
            Cart
          </button>
          <span>&gt;</span>
          <span className="current-page">Checkout</span>
        </div>

        <div className="page-title">
          <div className="icon-wrapper">
            <svg viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>

          <div>
            <h1>Secure Checkout</h1>
            <p>Review your delivery details and confirm your order.</p>
          </div>
        </div>

        <div className="cart-layout">
          <div className="cart-items-list checkout-form-card">
            {savedAddresses.length > 0 && (
              <div className="saved-addresses">
                <h2>Saved Addresses</h2>
                {savedAddresses.map((address) => (
                  <div
                    key={address._id}
                    className={`address-card ${selectedAddressId === address._id ? "selected-address" : ""}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === address._id}
                      readOnly
                    />
                    <div>
                      <h4>{address.fullName}</h4>
                      <p>{address.mobile}</p>
                      <p>{address.house}</p>
                      <p>{address.area}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="checkout-section-header">
              <h2>Shipping Details</h2>
              <p>Enter the address where your order should be delivered.</p>
            </div>

            <form onSubmit={handlePlaceOrder} className="checkout-form">
              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input id="fullName" type="text" name="fullName" value={shippingAddress.fullName} onChange={handleInputChange} required />
                </div>

                <div className="checkout-field">
                  <label htmlFor="mobile">Mobile Number *</label>
                  <input id="mobile" type="text" name="mobile" value={shippingAddress.mobile} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="house">House / Flat *</label>
                <input id="house" type="text" name="house" value={shippingAddress.house} onChange={handleInputChange} required />
              </div>

              <div className="checkout-field">
                <label htmlFor="area">Area / Street *</label>
                <input id="area" type="text" name="area" value={shippingAddress.area} onChange={handleInputChange} required />
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label htmlFor="city">City *</label>
                  <input id="city" type="text" name="city" value={shippingAddress.city} onChange={handleInputChange} required />
                </div>

                <div className="checkout-field">
                  <label htmlFor="state">State *</label>
                  <input id="state" type="text" name="state" value={shippingAddress.state} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="checkout-form-grid">
                <div className="checkout-field">
                  <label htmlFor="pincode">Pincode *</label>
                  <input id="pincode" type="text" name="pincode" value={shippingAddress.pincode} onChange={handleInputChange} required />
                </div>

                <div className="checkout-field">
                  <label htmlFor="country">Country *</label>
                  <input id="country" type="text" name="country" value={shippingAddress.country} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="checkout-note">
                Payment method: Cash on Delivery.
              </div>

              <button type="submit" disabled={loading} className={`btn ${loading ? "btn-disabled" : "btn-primary"}`}>
                {loading ? "Processing..." : "Place Order"}
              </button>
            </form>
          </div>

          <aside className="order-summary-card">
            <h2>Final Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span className="label">Items ({cart?.items?.length || 0})</span>
                <span className="value">₹{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-total summary-row">
              <span className="label">Total to Pay</span>
              <span className="value">COD</span>
            </div>

            <p className="checkout-warning">
              Orders will be placed using Cash on Delivery.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;