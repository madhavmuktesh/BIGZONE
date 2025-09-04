const API_BASE_URL = '/api/v1'; // Use a relative path, this is best practice

class ApiService {
  /**
   * Core request method. Handles JSON and FormData automatically.
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {}, // Start with empty headers
      credentials: "include", // Include cookies for authentication
      ...options,
    };

    // If body is FormData, let the browser set the Content-Type.
    // Otherwise, it's JSON.
    if (config.body instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Use the detailed message from the backend if available
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error.message);
      throw error; // Re-throw the error to be caught by the component
    }
  }

  // --- User & Auth methods ---

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
    return this.request("/users/logout", {
        method: "POST"
    });
  }

  async getCurrentUser() {
    return this.request("/users/profile");
  }

  async updateUserProfile(profileData) {
    return this.request("/users/profile", {
      method: "PUT", // Using PUT for consistency
      body: JSON.stringify(profileData),
    });
  }

  // *** ADDED THIS METHOD ***
  // Corresponds to the `addAddress` controller function.
  async addUserAddress(addressData) {
    return this.request('/users/address', {
        method: 'POST',
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
    // *** CORRECTED THIS ENDPOINT ***
    return this.request("/users/profile-photo", {
      method: "PUT",
      body: formData,
    });
  }
}

// Export a singleton instance of the class
export default new ApiService();