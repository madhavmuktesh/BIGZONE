// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  token: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  getUserId: () => null,
  checkAuthStatus: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.user);
        setToken("cookie-based");
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        throw new Error(data.message || "Unauthorized");
      }
    } catch (error) {
      console.error(
        "Auth status check failed (User not logged in):",
        error.message
      );

      localStorage.removeItem("user");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setToken("cookie-based");
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      setLoading(true);

      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      setLoading(false);
    }
  };

  const value = {
    user,
    setUser,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    getUserId: () => user?._id || user?.id,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};