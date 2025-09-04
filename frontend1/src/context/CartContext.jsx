import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  fetchCartAPI,
  addItemToCartAPI,
  removeItemFromCartAPI,
  updateItemQuantityAPI,
  clearCartAPI,
} from "../apiService.js";
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
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch Cart
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCartAPI();
      setCart(data);
    } catch (err) {
      setError("Failed to fetch cart");
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ✅ Add Item
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
        setError(`Failed to add item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  // ✅ Remove Item
  const removeItemFromCart = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to modify your cart.");
      }
      setLoading(true);
      try {
        await removeItemFromCartAPI(productId);
        await fetchCart();
      } catch (err) {
        setError(`Failed to remove item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  // ✅ Update Quantity
  const updateItemQuantity = useCallback(
    async (productId, quantity) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to update cart.");
      }
      setLoading(true);
      try {
        await updateItemQuantityAPI(productId, quantity);
        await fetchCart();
      } catch (err) {
        setError(`Failed to update quantity: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart]
  );

  // ✅ Clear Cart
  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to clear your cart.");
    }
    setLoading(true);
    try {
      await clearCartAPI();
      await fetchCart();
    } catch (err) {
      setError(`Failed to clear cart: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  // ✅ Load cart on login/logout
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addItemToCart,
        removeItemFromCart,
        updateItemQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
