/**
 * ✅ Centralized API service with authentication.
 * - Automatically includes httpOnly cookies (credentials: 'include')
 * - Handles errors gracefully and returns parsed JSON
 */

const API_BASE_URL = 'http://localhost:5000/api/v1';

/**
 * Core authenticated fetch wrapper
 */
const authenticatedFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // ✅ Sends httpOnly cookie for authentication
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("API Fetch Error:", error.message);
    throw error;
  }
};

/* ---------------- CART SERVICE ---------------- */

/**
 * Fetch the user's entire cart
 */
export const fetchCartAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/cart/`);
};

/**
 * Add a new item to the cart
 */
export const addItemToCartAPI = (productId, quantity = 1) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
};

/**
 * Update quantity of a specific cart item
 */
export const updateItemQuantityAPI = (productId, quantity) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
};

/**
 * Remove a specific item from the cart
 */
export const removeItemFromCartAPI = (productId) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'DELETE',
  });
};

/**
 * Clear the entire cart
 */
export const clearCartAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/cart/`, {
    method: 'DELETE',
  });
};

/* ---------------- PRODUCT SERVICE ---------------- */

/**
 * Fetch all products
 */
export const fetchAllProductsAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/products/`);
};

/**
 * Fetch single product by ID
 */
export const fetchProductByIdAPI = (id) => {
  return authenticatedFetch(`${API_BASE_URL}/products/${id}`);
};
