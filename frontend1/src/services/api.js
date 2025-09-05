// src/services/api.js
const API_BASE_URL = '/api/v1'; // Relative path for frontend proxy

class ApiService {
  /**
   * Core request method. Handles JSON and FormData automatically.
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {},
      credentials: "include", // Include cookies for auth
      ...options,
    };

    // Set headers unless body is FormData
    if (!(config.body instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error;
    }
  }

  // ------------------ AUTH & USER ------------------
  async login(credentials) {
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request("/users/logout", { method: "POST" });
  }

  async getCurrentUser() {
    return this.request("/users/profile");
  }

  async updateUserProfile(profileData) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async addUserAddress(addressData) {
    return this.request("/users/address", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
  }

  async updateUserAddress(addressId, addressData) {
    return this.request(`/users/address/${addressId}`, {
      method: "PUT",
      body: JSON.stringify(addressData),
    });
  }

  async uploadProfilePhoto(formData) {
    return this.request("/users/profile-photo", {
      method: "PUT",
      body: formData,
    });
  }

  // ------------------ PRODUCTS ------------------
  async getAllProducts() {
    return this.request("/products"); // GET /api/v1/products
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}`); // GET /api/v1/products/:id
  }

  async createProduct(productData) {
    return this.request("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(productId, productData) {
    return this.request(`/products/${productId}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId) {
    return this.request(`/products/${productId}`, {
      method: "DELETE",
    });
  }

  async getUserProducts(userId) {
    return this.request(`/products/user/${userId}`);
  }
  // ----------- ECO -------------
  async getALLEcoZoneProducts() {
    return this.request("/products/ecozone"); // GET /api/v1/products/ecozone
  }
  async getEcoZoneProduct(productId){
    return this.request(`products/ecozone/${productId}`)
  }



  // ------------------ CART ------------------
  async getCart() {
    return this.request("/cart"); // GET /api/v1/cart
  }

  async addToCart(productId, quantity = 1, productDetails = {}) {
    return this.request("/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, productDetails }),
    });
  }

  async updateCartItem(cartItemId, quantity) {
    return this.request(`/cart/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(cartItemId) {
    return this.request(`/cart/${cartItemId}`, {
      method: "DELETE",
    });
  }

  async clearCart() {
    return this.request("/cart", {
      method: "DELETE",
    });
  }

  // ------------------ REVIEWS ------------------
  async addProductReview(productId, reviewData) {
    return this.request(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  async updateProductReview(productId, reviewId, reviewData) {
    return this.request(`/products/${productId}/reviews/${reviewId}`, {
      method: "PUT",
      body: JSON.stringify(reviewData),
    });
  }

  async deleteProductReview(productId, reviewId) {
    return this.request(`/products/${productId}/reviews/${reviewId}`, {
      method: "DELETE",
    });
  }
}

export default new ApiService();
