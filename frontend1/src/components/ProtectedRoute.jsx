import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Import the useAuth hook

const ProtectedRoute = () => {
    // 2. Get the authentication status from our context
    const { isAuthenticated } = useAuth();

    // 3. The rest of the logic remains the same.
    // If authenticated, show the requested page. Otherwise, redirect to signin.
    return isAuthenticated ? <Outlet /> : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
