import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Ecozone from "./pages/Ecozone";
import Onepage from "./pages/onepage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductUploadForm from "./pages/form";
import SignIn from "./pages/signin";
import Cart from "./pages/cart";
import OrdersPage from "./pages/Orderpage";
import Productmain from "../src/pages/productdetailmain.jsx";
import RegisterPage from "./pages/registerpage.jsx";
import ProfilePage from "./pages/profilepage.jsx";
import EditProfile from "./pages/profileedit.jsx";
import SearchResults from "./pages/SearchResults";
import AddressPage from "./pages/AddressPage";
import AddAddressPage from "./pages/AddAddressPage";
import ProtectedRoute from "./components/ProtectedRoute";
import "../src/index.css";
import Header from "./components/Header/Headermain.jsx";

const DashboardPage = () => (
  <div style={{ padding: "50px", textAlign: "center", fontSize: "2rem" }}>
    Welcome to your Dashboard! (Protected)
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGate({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="App">
              {/* Global toaster for popups */}
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
              <Header />
              <Routes>
                {/* Public */}
                <Route path="/" element={<Onepage />} />
                <Route path="/ecozone" element={<Ecozone />} />
                <Route path="/products/:id" element={<Productmain />} />
                <Route path="/search" element={<SearchResults />} />

                {/* Auth-only gates */}
                <Route path="/signin" element={<AuthGate><SignIn /></AuthGate>} />
                <Route path="/register" element={<AuthGate><RegisterPage /></AuthGate>} />

                {/* Protected */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/form" element={<ProductUploadForm />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/editprofile" element={<EditProfile />} />
                  <Route path="/address" element={<AddressPage />} />
                  <Route path="/address/add" element={<AddAddressPage />} />
                  <Route path="/address/edit/:id" element={<AddAddressPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
