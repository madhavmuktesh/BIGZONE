import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

import Homepage from "./pages/HomePage.jsx";
import ProductDetailPage from "./pages/ecozone/ProductDetailPage.jsx";
import ProductUploadForm from "./pages/form";
import SignIn from "./pages/user/signin.jsx";
import Cart from "./pages/orders/cart.jsx";
import OrdersPage from "./pages/orders/Orderpage.jsx";
import OrderDetailsPage from "./pages/orders/OrderDetailsPage";
import Productmain from "./pages/productdetailmain.jsx";
import RegisterPage from "./pages/user/registerpage.jsx";
import ProfilePage from "./pages/user/profilepage.jsx";
import EditProfile from "./pages/user/profileedit.jsx";
import SearchResults from "./pages/SearchResults";
import AddAddressPage from "./pages/AddAddress.jsx";
import AddressPage from "./pages/Addresspage.jsx";
import EcohomePage from "./pages/ecozone/EcohomePage.jsx";
import CheckoutPage from "./pages/orders/CheckoutPage.jsx";
import ForgotPassword from "./pages/user/ForgotPassword.jsx";
import ResetPassword from "./pages/user/ResetPassword.jsx";
import SellerDashboard from "./pages/SellerDashboard";
import NotFound from "./pages/NotFound.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header/Headermain.jsx";
import Footer from "./components/Footer/Footer.jsx";

import "./index.css";

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

function Layout() {
  const location = useLocation();

  // Routes where Header & Footer should be hidden
  const hideLayoutRoutes = [
    "/signin",
    "/register",
    "/forgot-password",
  ];

  const hideLayout =
    hideLayoutRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/api/v1/users/reset-password/");

  return (
    <div className="App">
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000 }}
      />

      {!hideLayout && <Header />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/ecozone" element={<EcohomePage />} />
        <Route path="/products/:id" element={<Productmain />} />
        <Route path="/search" element={<SearchResults />} />
        <Route
          path="/ecozone/products/:id"
          element={<ProductDetailPage />}
        />

        {/* Auth Routes */}
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

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/api/v1/users/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/form" element={<ProductUploadForm />} />
          <Route
            path="/edit-product/:productId"
            element={<ProductUploadForm />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route
            path="/orders/:id"
            element={<OrderDetailsPage />}
          />
          <Route
            path="/editprofile"
            element={<EditProfile />}
          />
          <Route path="/address" element={<AddressPage />} />
          <Route
            path="/addaddress"
            element={<AddAddressPage />}
          />
          <Route
            path="/address/edit/:id"
            element={<AddAddressPage />}
          />
          <Route
            path="/checkout"
            element={<CheckoutPage />}
          />
          <Route
            path="/sellerdashboard"
            element={<SellerDashboard />}
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideLayout && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <CartProvider>
            <Layout />
          </CartProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;