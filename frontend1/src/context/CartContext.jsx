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
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], totalPrice: 0 });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchCartAPI();
      if (response && response.cart) {
        setCart(response.cart);
      } else {
        setCart({ items: [], totalPrice: 0 });
      }
    } catch (err) {
      setError("Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addItemToCart = useCallback(
    async (productId, quantity = 1) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to add items to your cart.");
      }
      setLoading(true);
      setError(null);
      try {
        await addItemToCartAPI(productId, quantity);
        await fetchCart(); // ✅ Re-fetch the cart to get the latest state
        return { success: true };
      } catch (err) {
        setError(`Failed to add item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart] // Add fetchCart to dependency array
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
        await fetchCart(); // ✅ Re-fetch the cart to get the latest state
      } catch (err) {
        setError(`Failed to remove item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, fetchCart] // Add fetchCart to dependency array
  );
  
  const updateItemQuantity = useCallback(
    async (productId, quantity) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to update cart.");
      }
      // Note: We don't set a global loading state here for a smoother UX
      try {
        await updateItemQuantityAPI(productId, quantity);
        await fetchCart(); // ✅ Re-fetch the cart to get the latest state
      } catch (err) {
        setError(`Failed to update quantity: ${err.message}`);
        throw err;
      }
    },
    [isAuthenticated, fetchCart] // Add fetchCart to dependency array
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to clear your cart.");
    }
    setLoading(true);
    setError(null);
    try {
      await clearCartAPI();
      await fetchCart(); // ✅ Re-fetch the cart to get the latest state
    } catch (err) {
      setError(`Failed to clear cart: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]); // Add fetchCart to dependency array

  const value = useMemo(() => ({
    cart,
    loading,
    error,
    fetchCart,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCart,
  }), [cart, loading, error, fetchCart, addItemToCart, removeItemFromCart, updateItemQuantity, clearCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};