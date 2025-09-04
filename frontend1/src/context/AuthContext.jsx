import React, { createContext, useState, useContext, useEffect } from 'react';

// It's good practice to provide a default value that matches the shape of your context
const AuthContext = createContext({
    user: null,
    setUser: () => {}, // Provide a dummy function as a default
    token: null,
    isAuthenticated: false,
    loading: true,
    login: () => {},
    logout: () => {},
    getUserId: () => null,
    checkAuthStatus: async () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status on app load
    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            
            // First, try to get user from localStorage
            const storedUser = localStorage.getItem("user");
            
            if (storedUser) {
                // Verify the session with the server (since we're using httpOnly cookies)
                // Note: The base URL should come from your api service or an env variable
                const response = await fetch('/api/v1/users/me', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        setUser(data.user);
                        setToken('cookie-based');
                        // Update localStorage with fresh user data
                        localStorage.setItem("user", JSON.stringify(data.user));
                    } else {
                        // Session expired, clear stored data
                        localStorage.removeItem("user");
                        setUser(null);
                        setToken(null);
                    }
                } else {
                    // Session invalid, clear stored data
                    localStorage.removeItem("user");
                    setUser(null);
                    setToken(null);
                }
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            // On API error, clear local state to prevent using stale data
            localStorage.removeItem("user");
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    // Load user from localStorage and verify session on initialization
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = (userData) => {
        setUser(userData);
        setToken('cookie-based');
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            setLoading(true);
            
            // Call logout endpoint to clear httpOnly cookie
            await fetch('/api/v1/users/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Clear local state regardless of API call success
            setUser(null);
            setToken(null);
            localStorage.removeItem("user");
            setLoading(false);
        }
    };

    const value = {
        user,
        setUser, // ✅ FIX: Expose the setUser function to the context
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        getUserId: () => user?._id || user?.id,
        checkAuthStatus
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
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
