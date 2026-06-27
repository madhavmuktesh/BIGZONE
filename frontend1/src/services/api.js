// src/services/api.js


const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";


const authenticatedFetch = async (url, options = {}) => {
  try {
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
};

// ─────────────────────────────────────────
// AUTH & USER
// ─────────────────────────────────────────

export const loginAPI = (credentials) =>
  authenticatedFetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const registerAPI = (userData) =>
  authenticatedFetch(`${API_BASE_URL}/users/register`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const logoutAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/users/logout`, { method: 'POST' });

export const getCurrentUserAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/users/profile`);

export const updateUserProfileAPI = (profileData) =>
  authenticatedFetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });

export const uploadProfilePhotoAPI = (formData) =>
  authenticatedFetch(`${API_BASE_URL}/users/profile-photo`, {
    method: 'PUT',
    body: formData,
  });

export const addUserAddressAPI = (addressData) =>
  authenticatedFetch(`${API_BASE_URL}/users/address`, {
    method: 'POST',
    body: JSON.stringify(addressData),
  });

export const updateUserAddressAPI = (addressId, addressData) =>
  authenticatedFetch(`${API_BASE_URL}/users/address/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  });

// ─────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────

export const fetchAllProductsAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/products/`);

export const fetchProductByIdAPI = (id) =>
  authenticatedFetch(`${API_BASE_URL}/products/${id}`);

export const createProductAPI = (productData) =>
  authenticatedFetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(productData),
  });

export const updateProductAPI = (productId, productData) =>
  authenticatedFetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });

export const deleteProductAPI = (productId) =>
  authenticatedFetch(`${API_BASE_URL}/products/${productId}`, {
    method: 'DELETE',
  });

export const fetchUserProductsAPI = (userId) =>
  authenticatedFetch(`${API_BASE_URL}/products/user/${userId}`);

// ─────────────────────────────────────────
// ECOZONE
// ─────────────────────────────────────────

export const fetchEcoProductsAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/products/ecozone`);

export const fetchEcoProductByIdAPI = (productId) =>
  authenticatedFetch(`${API_BASE_URL}/products/ecozone/${productId}`);

// ─────────────────────────────────────────
// CART
// ─────────────────────────────────────────

export const fetchCartAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/cart/`);

export const addItemToCartAPI = (productId, quantity = 1) =>
  authenticatedFetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

export const updateItemQuantityAPI = (productId, quantity) =>
  authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });

export const removeItemFromCartAPI = (productId) =>
  authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'DELETE',
  });

export const clearCartAPI = () =>
  authenticatedFetch(`${API_BASE_URL}/cart/`, {
    method: 'DELETE',
  });

// ─────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────

export const addProductReviewAPI = (productId, reviewData) =>
  authenticatedFetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });

export const updateProductReviewAPI = (productId, reviewId, reviewData) =>
  authenticatedFetch(`${API_BASE_URL}/products/${productId}/reviews/${reviewId}`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });

export const deleteProductReviewAPI = (productId, reviewId) =>
  authenticatedFetch(`${API_BASE_URL}/products/${productId}/reviews/${reviewId}`, {
    method: 'DELETE',
  });