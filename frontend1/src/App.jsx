import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Pages
import Ecozone from "./pages/Ecozone";
import Onepage from "./pages/onepage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductUploadForm from "./pages/form";
import SignIn from "./pages/signin";
import Cart from "./pages/cart";
import OrdersPage from './pages/Orderpage';
import Productmain from "../src/pages/productdetailmain.jsx";
import RegisterPage from './pages/registerpage.jsx';

// Protected Route
import ProtectedRoute from "./components/ProtectedRoute";

// Styles
import "../src/index.css";

// Placeholder Components (remove once actual components exist)
const ProfilePage = () => (
  <div style={{ padding: "50px", textAlign: "center", fontSize: "2rem" }}>
    My Profile (Protected)
  </div>
);

const DashboardPage = () => (
  <div style={{ padding: "50px", textAlign: "center", fontSize: "2rem" }}>
    Welcome to your Dashboard! (Protected)
  </div>
);

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Gate for auth pages: redirect authenticated users away from /signin and /register
function AuthGate({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const { user } = useAuth(); // Get current user from AuthContext

  return (
    <div className="App">
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<Onepage />} />
        <Route path="/ecozone" element={<Ecozone />} />
        <Route path="/products/:id" element={<Productmain />} />

        {/* Auth pages are blocked for signed-in users */}
        <Route
          path="/signin"
          element={
            <AuthGate>
              <SignIn />
            </AuthGate>
          }
        />
        <Route
          path="/register"
          element={
            <AuthGate>
              <RegisterPage />
            </AuthGate>
          }
        />

        {/* --- Protected Routes --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/form" element={<ProductUploadForm />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Route>

        {/* Catch-all → redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
