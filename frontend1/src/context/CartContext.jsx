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
        setCart(response.cart); // Set the nested cart object
      } else {
        setCart({ items: [], totalPrice: 0 });
      }
    } catch (err) {
      setError("Failed to fetch cart");
      console.error("Cart fetch error:", err);
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
        const updatedCartData = await addItemToCartAPI(productId, quantity);
        if (updatedCartData && updatedCartData.cart) {
          setCart(updatedCartData.cart);
        }
        return { success: true };
      } catch (err) {
        setError(`Failed to add item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const removeItemFromCart = useCallback(
    async (productId) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to modify your cart.");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedCartData = await removeItemFromCartAPI(productId);
        if (updatedCartData && updatedCartData.cart) {
          setCart(updatedCartData.cart);
        }
      } catch (err) {
        setError(`Failed to remove item: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );
  
  const updateItemQuantity = useCallback(
    async (productId, quantity) => {
      if (!isAuthenticated) {
        throw new Error("Please sign in to update cart.");
      }
      setLoading(true);
      setError(null);
      try {
        const updatedCartData = await updateItemQuantityAPI(productId, quantity);
        if (updatedCartData && updatedCartData.cart) {
          setCart(updatedCartData.cart);
        }
      } catch (err) {
        setError(`Failed to update quantity: ${err.message}`);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to clear your cart.");
    }
    setLoading(true);
    setError(null);
    try {
      const updatedCartData = await clearCartAPI();
      if (updatedCartData && updatedCartData.cart) {
        setCart(updatedCartData.cart);
      } else {
        setCart({ items: [], totalPrice: 0 });
      }
    } catch (err) {
      setError(`Failed to clear cart: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // The useEffect that was causing an infinite loop has been removed from this file.
  // The Cart.jsx component is now responsible for triggering the initial fetch.

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