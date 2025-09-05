/**
 * Centralized API service using functional exports.
 * - Automatically includes httpOnly cookies for authentication.
 * - Gracefully handles errors and file uploads.
 */

const API_BASE_URL = '/api/v1';

/**
 * Core authenticated fetch wrapper.
 * Handles JSON and FormData automatically.
 */
const authenticatedFetch = async (url, options = {}) => {
  try {
    const headers = { ...options.headers };

    // If the body is FormData, let the browser set the Content-Type header.
    // Otherwise, set it to application/json.
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
    console.error(`API Fetch Error on ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
};

/* ---------------- USER SERVICE ---------------- */

export const updateUserProfileAPI = (profileData) => {
  return authenticatedFetch(`${API_BASE_URL}/users/profile`, {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

export const uploadProfilePhotoAPI = (formData) => {
  return authenticatedFetch(`${API_BASE_URL}/users/profile-photo`, {
    method: 'PUT',
    body: formData,
  });
};

export const addUserAddressAPI = (addressData) => {
  return authenticatedFetch(`${API_BASE_URL}/users/address`, {
    method: 'POST',
    body: JSON.stringify(addressData),
  });
};

export const updateUserAddressAPI = (addressId, addressData) => {
  return authenticatedFetch(`${API_BASE_URL}/users/address/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(addressData),
  });
};

/* ---------------- CART SERVICE ---------------- */

export const fetchCartAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/cart/`);
};

export const addItemToCartAPI = (productId, quantity = 1) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
};

export const updateItemQuantityAPI = (productId, quantity) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
};

export const removeItemFromCartAPI = (productId) => {
  return authenticatedFetch(`${API_BASE_URL}/cart/items/${productId}`, {
    method: 'DELETE',
  });
};

export const clearCartAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/cart/`, {
    method: 'DELETE',
  });
};

/* ---------------- PRODUCT SERVICE ---------------- */

export const fetchAllProductsAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/products/`);
};

export const fetchProductByIdAPI = (id) => {
  return authenticatedFetch(`${API_BASE_URL}/products/${id}`);
};

export const fetchecoProductsAPI = () => {
  return authenticatedFetch(`${API_BASE_URL}/products/ecozone`);
};