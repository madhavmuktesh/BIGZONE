import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  fetchCartAPI,
  addItemToCartAPI,
  removeItemFromCartAPI,
  updateItemQuantityAPI,
  clearCartAPI,
} from "../services/api.js";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Added clearError
  const clearError = useCallback(() => setError(null), []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], totalPrice: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCartAPI();
      setCart(response?.cart ?? { items: [], totalPrice: 0 });
    } catch (err) {
      setError(err.message); // ✅ raw message
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItemToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to add items to your cart.");
      }
      setLoading(true);
      setError(null);
      try {
        await addItemToCartAPI(productId, quantity);
        await fetchCart();
        return { success: true };
      } catch (err) {
        setError(err.message); // ✅ raw message — shows exact backend error
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  const removeItemFromCart = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to modify your cart.");
      }
      setLoading(true);
      setError(null);
      try {
        await removeItemFromCartAPI(productId);
        await fetchCart();
      } catch (err) {
        setError(err.message); // ✅ raw message
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  const updateItemQuantity = useCallback(
    async (productId, quantity) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to update cart.");
      }
      setLoading(true);
      setError(null);
      try {
        await updateItemQuantityAPI(productId, quantity);
        await fetchCart();
      } catch (err) {
        setError(err.message); // ✅ raw message
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to clear your cart.");
    }
    setLoading(true);
    setError(null);
    try {
      await clearCartAPI();
      await fetchCart();
    } catch (err) {
      setError(err.message); // ✅ raw message
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  const cartCount = useMemo(
    () => cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0,
    [cart.items]
  );

  const cartTotal = useMemo(() => cart.totalPrice ?? 0, [cart.totalPrice]);

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      cartCount,
      cartTotal,
      fetchCart,
      addItemToCart,
      removeItemFromCart,
      updateItemQuantity,
      clearCart,
      clearError, // ✅ added
    }),
    [
      cart,
      loading,
      error,
      cartCount,
      cartTotal,
      fetchCart,
      addItemToCart,
      removeItemFromCart,
      updateItemQuantity,
      clearCart,
      clearError, // ✅ added
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};