// src/services/api.js

// Detect env variable style (Vite uses import.meta.env, CRA uses process.env)
const getEnv = (key, fallback) => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

// ✅ Works in both Vite (VITE_API_URL) and CRA (REACT_APP_API_URL)
const API_BASE_URL =
  getEnv("VITE_API_URL", getEnv("REACT_APP_API_URL", "http://localhost:5000/api/v1"));

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for authentication
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // --- Product methods ---
  async getProduct(productId) {
    return this.request(`/products/${productId}`);
  }

  async getAllProducts() {
    return this.request("/products");
  }

  async addReview(productId, reviewData) {
    return this.request(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(reviewData),
    });
  }

  async markReviewHelpful(productId, reviewId) {
    return this.request(`/products/${productId}/reviews/${reviewId}/helpful`, {
      method: "POST",
    });
  }
}

export default new ApiService();
