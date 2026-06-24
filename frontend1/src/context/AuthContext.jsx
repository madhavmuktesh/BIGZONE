import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext({
    user: null,
    setUser: () => {},
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

    // ✅ FIX: Check authentication status unconditionally
    const checkAuthStatus = async () => {
        try {
            setLoading(true);
            
            // Because we use httpOnly cookies, we MUST ping the server to know if we are logged in.
            // We should not rely on localStorage as the gatekeeper.
            const response = await fetch('/api/v1/users/me', {
                method: 'GET',
                credentials: 'include', // This sends the httpOnly cookie automatically
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    setUser(data.user);
                    setToken('cookie-based');
                    localStorage.setItem("user", JSON.stringify(data.user));
                } else {
                    throw new Error("Session invalid");
                }
            } else {
                throw new Error("Unauthorized");
            }
        } catch (error) {
            console.error("Auth status check failed (User not logged in):", error.message);
            // Clean up stale data if the server rejects the cookie
            localStorage.removeItem("user");
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    };

    // Load user and verify session on initialization
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
            
            // Call logout endpoint to clear httpOnly cookie on the backend
            await fetch('/api/v1/users/logout', {
                method: 'POST', // Adjusted to POST to match standard logout behavior if needed, or keep GET if backend uses GET
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
        setUser, 
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
            {/* Prevent app from flashing unprotected routes before auth check completes */}
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