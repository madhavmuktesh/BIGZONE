import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import "../styles/cart.css";

const CartHeader = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success('Logged out successfully');
    };

    return (
        <header className="cart-header-nav">
            <div className="cart-header-content">
                <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>BIGZONE</h1>
                <div className="nav-group">
                    {isAuthenticated ? (
                        <>
                            <span>Welcome, {user?.fullname || user?.username}</span>
                            <button onClick={handleLogout} className="btn-secondary">Logout</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/signin')} className="btn-primary">Login</button>
                    )}
                </div>
            </div>
        </header>
    );
};

const CartItem = ({ item, onQuantityChange, onRemove, loading }) => {
    const renderValidationMessage = () => {
        switch (item.validationStatus) {
            case 'PRICE_CHANGED': 
                return (
                    <p className="validation-warning">
                        Price changed from ${item.priceAtAddition.toFixed(2)} to ${item.productDetails.currentPrice.toFixed(2)}
                    </p>
                );
            case 'INSUFFICIENT_STOCK': 
                return (
                    <p className="validation-error">
                        Only {item.productDetails.currentStock} left in stock. Please adjust quantity.
                    </p>
                );
            case 'OUT_OF_STOCK': 
                return (
                    <p className="validation-error">
                        This item is now out of stock and will be removed at checkout.
                    </p>
                );
            case 'PRODUCT_REMOVED': 
                return (
                    <p className="validation-error">
                        This product is no longer available.
                    </p>
                );
            default: 
                return null;
        }
    };

    const productId = item.product._id || item.product;
    const productName = item.productDetails?.productname || 'Product name unavailable';
    const productPrice = item.productDetails?.currentPrice || item.priceAtAddition || 0;
    const imageUrl = item.productDetails?.images?.[0]?.url || 'https://placehold.co/300x300?text=No+Image';
    const maxStock = item.productDetails?.currentStock || 999;
    
    return (
        <div className="cart-item-card">
            <div className="cart-item-image">
                <Link to={`/products/${productId}`} className="product-link">
                    <img src={imageUrl} alt={productName} />
                </Link>
            </div>
            <div className="cart-item-details">
                <div>
                    <Link to={`/products/${productId}`} className="product-link">
                        <h3>{productName}</h3>
                    </Link>
                    <p>Price: ${productPrice.toFixed(2)}</p>
                    <div className="validation-message">{renderValidationMessage()}</div>
                </div>
                <div className="cart-item-actions">
                    <div className="quantity-selector">
                        <div className="controls">
                            <button 
                                onClick={() => onQuantityChange(productId, item.quantity - 1)}
                                disabled={loading || item.quantity <= 1}
                            >
                                -
                            </button>
                            <span className="value">{item.quantity}</span>
                            <button 
                                onClick={() => onQuantityChange(productId, item.quantity + 1)}
                                disabled={loading || item.quantity >= maxStock}
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className="cart-item-price-section">
                        <span className="cart-item-price">
                            ${(productPrice * item.quantity).toFixed(2)}
                        </span>
                        <button 
                            onClick={() => onRemove(productId)} 
                            className="remove-item-button"
                            disabled={loading}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrderSummary = ({ cart, onCheckout, disableCheckout }) => {
    const subtotal = cart?.totalPrice || 0;
    const ecoDiscount = 2.00;
    const total = Math.max(0, subtotal - ecoDiscount);

    return (
        <aside className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-rows">
                <div className="summary-row">
                    <span className="label">Subtotal</span>
                    <span className="value">${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span className="label">Eco Discount</span>
                    <span className="value discount">-${ecoDiscount.toFixed(2)}</span>
                </div>
            </div>
            <div className="summary-total summary-row">
                <span className="label">Total</span>
                <span className="value">${total.toFixed(2)}</span>
            </div>
            <button 
                onClick={onCheckout} 
                disabled={disableCheckout} 
                className={`btn ${disableCheckout ? 'btn-disabled' : 'btn-primary'}`}
            >
                {disableCheckout ? 'Cannot Checkout' : 'Proceed to Checkout'}
            </button>
            {cart?.validationIssues > 0 && (
                <p className="checkout-warning">
                    Please resolve {cart.validationIssues} issue(s) before checkout
                </p>
            )}
        </aside>
    );
};

const Cart = () => {
    // --- 1. HOOKS AND STATE ---
    const { isAuthenticated } = useAuth();
    const { 
        cart, 
        loading, 
        error, 
        fetchCart,
        updateItemQuantity, 
        removeItemFromCart, 
        clearCart 
    } = useCart();
    const navigate = useNavigate();

    // --- 2. EFFECTS ---
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            toast.error('Please sign in to access your cart');
            navigate('/signin');
        }
    }, [isAuthenticated, loading, navigate]);

    // --- 3. HANDLER FUNCTIONS ---
    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await updateItemQuantity(productId, newQuantity);
        } catch (err) {
            toast.error(err.message || 'Failed to update quantity');
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await removeItemFromCart(productId);
            toast.success('Item removed from cart');
        } catch (err) {
            toast.error(err.message || 'Failed to remove item');
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Are you sure you want to clear your entire cart?')) {
            try {
                await clearCart();
                toast.success('Cart cleared');
            } catch (err) {
                toast.error(err.message || 'Failed to clear cart');
            }
        }
    };

    const handleCheckout = () => {
        if (!cart?.items || cart.items.length === 0) {
            toast.error('Your cart is empty');
            return;
        }
        if (cart.validationIssues > 0) {
            toast.error('Please resolve cart issues before checkout');
            return;
        }
        toast.success('Redirecting to checkout...');
        // navigate('/checkout');
    };
    
    // --- 4. DERIVED STATE & RENDER LOGIC ---
    const hasStockIssues = cart?.items?.some(item => 
        ['INSUFFICIENT_STOCK', 'OUT_OF_STOCK', 'PRODUCT_REMOVED'].includes(item.validationStatus)
    ) || false;

    const disableCheckout = !cart?.items || cart.items.length === 0 || hasStockIssues;

    const renderContent = () => {
        if (loading && (!cart?.items || cart.items.length === 0)) {
            return <div className="loading-state">Loading your cart...</div>;
        }

        if (error) {
            return (
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button onClick={() => fetchCart()} className="btn-primary">Retry</button>
                </div>
            );
        }

        if (!cart?.items || cart.items.length === 0) {
            return (
                <div className="empty-cart-state">
                    <h2>Your cart is empty</h2>
                    <p>Let's find something great for you!</p>
                    <button onClick={() => navigate('/')} className="btn-primary">Continue Shopping</button>
                </div>
            );
        }

        return (
            <div className="cart-layout">
                <div className="cart-items-list">
                    {cart.items.map(item => (
                        <CartItem 
                            key={item.product._id || item.product} 
                            item={item} 
                            onQuantityChange={handleQuantityChange} 
                            onRemove={handleRemoveItem}
                            loading={loading}
                        />
                    ))}
                    <button 
                        onClick={handleClearCart} 
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Clear Cart
                    </button>
                </div>
                <OrderSummary 
                    cart={cart}
                    onCheckout={handleCheckout} 
                    disableCheckout={disableCheckout} 
                />
            </div>
        );
    };

    // --- 5. RETURN JSX ---
    return (
        <div className="cart-page-body">
            <Toaster position="top-center" reverseOrder={false} />
            <CartHeader />
            <main className="cart-container">
                <div className="breadcrumbs">
                    <button onClick={() => navigate('/')} className="breadcrumb-link">Home</button>
                    <span>&gt;</span>
                    <span className="current-page">Cart</span>
                </div>
                <div className="page-title">
                    <div className="icon-wrapper">
                        <svg viewBox="0 0 24 24">
                            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
                        </svg>
                    </div>
                    <div>
                        <h1>Shopping Cart</h1>
                        <p>{cart?.items?.length || 0} items in your cart</p>
                    </div>
                </div>
                {renderContent()}
            </main>
        </div>
    );
};

export default Cart;