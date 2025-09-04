// src/hooks/useCart.js
import { useState, useEffect, useContext, createContext } from 'react';
import ApiService from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getCart();
      setCart(response.cart);
      const totalItems = response.cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
      setCartCount(totalItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await ApiService.addToCart(productId, quantity);
      await fetchCart(); // Refresh cart
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await ApiService.removeFromCart(productId);
      await fetchCart(); // Refresh cart
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      loading,
      addToCart,
      removeFromCart,
      fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
