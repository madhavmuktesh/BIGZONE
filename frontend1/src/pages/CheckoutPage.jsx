import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../styles/cart.css'; // Reusing cart styles for consistency

const CheckoutPage = () => {
    const { cart, clearCart } = useCart();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
    });

    // Protect the route
    useEffect(() => {
        if (!user || !token) {
            toast.error('Please sign in to checkout');
            navigate('/signin');
        }
        if (!cart?.items || cart.items.length === 0) {
            navigate('/cart');
        }
    }, [user, token, cart, navigate]);

    const handleInputChange = (e) => {
        setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!shippingAddress.addressLine || !shippingAddress.city || !shippingAddress.pincode) {
            return toast.error('Please fill in all required shipping fields.');
        }

        setLoading(true);
        try {
            // Calculate totals (matching your Cart logic)
            const subtotal = cart?.totalPrice || 0;
            const ecoDiscount = 2.00; // Your hardcoded eco discount
            const totalCost = Math.max(0, subtotal - ecoDiscount);

            // Structure the payload for your backend
            const orderPayload = {
                items: cart.items.map(item => ({
                    product: item.product._id || item.product,
                    quantity: item.quantity,
                    priceAtPurchase: item.productDetails?.currentPrice || item.priceAtAddition
                })),
                shippingAddress,
                costBreakdown: {
                    subtotal: subtotal,
                    shipping: 0, // Free shipping
                    tax: 0,
                    discount: ecoDiscount
                },
                totalCost: totalCost,
                paymentMethod: 'Cash On Delivery' // Defaulting to COD since no payment gateway exists yet
            };

            const response = await fetch('/api/v1/orders/create', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Order placed successfully!');
                await clearCart(); // Empty the cart after successful order
                
                // Route user to the orders page to see their new purchase
                setTimeout(() => {
                    navigate('/orders');
                }, 1500);
            } else {
                throw new Error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.message || 'Something went wrong during checkout');
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cart?.totalPrice || 0;
    const ecoDiscount = 2.00;
    const total = Math.max(0, subtotal - ecoDiscount);

    return (
        <div className="cart-page-body">
            <Toaster position="top-center" />
            <main className="cart-container">
                <div className="page-title">
                    <h1>Secure Checkout</h1>
                </div>

                <div className="cart-layout">
                    {/* Shipping Form */}
                    <div className="cart-items-list" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                        <h2>Shipping Details</h2>
                        <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <input 
                                type="text" name="addressLine" placeholder="Street Address *" 
                                value={shippingAddress.addressLine} onChange={handleInputChange} 
                                required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <input 
                                type="text" name="city" placeholder="City *" 
                                value={shippingAddress.city} onChange={handleInputChange} 
                                required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <input 
                                type="text" name="state" placeholder="State" 
                                value={shippingAddress.state} onChange={handleInputChange} 
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            <input 
                                type="text" name="pincode" placeholder="Pincode / Zip Code *" 
                                value={shippingAddress.pincode} onChange={handleInputChange} 
                                required style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </form>
                    </div>

                    {/* Order Summary (Reused logic from Cart) */}
                    <aside className="order-summary-card">
                        <h2>Final Summary</h2>
                        <div className="summary-rows">
                            <div className="summary-row">
                                <span className="label">Items ({cart?.items?.length || 0})</span>
                                <span className="value">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="label">Eco Discount</span>
                                <span className="value" style={{ color: 'green' }}>-${ecoDiscount.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="label">Shipping</span>
                                <span className="value" style={{ color: 'green' }}>FREE</span>
                            </div>
                        </div>
                        <div className="summary-total summary-row" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <span className="label"><strong>Total to Pay</strong></span>
                            <span className="value"><strong>${total.toFixed(2)}</strong></span>
                        </div>
                        
                        <button 
                            onClick={handlePlaceOrder} 
                            disabled={loading} 
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '20px' }}
                        >
                            {loading ? 'Processing...' : 'Place Order (Cash on Delivery)'}
                        </button>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;