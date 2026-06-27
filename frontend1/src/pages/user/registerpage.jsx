import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import "../../styles/RegisterPage.css";

const schema = z.object({
  fullname: z.string().trim().min(1, "Full name is required."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please provide a valid email address."),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Please provide a valid 10-digit phone number."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.enum(["user", "seller", "admin"]).default("user"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState("");
  const [serverMessageType, setServerMessageType] = useState("info");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullname: "",
      email: "",
      phoneNumber: "",
      password: "",
      role: "user",
    },
  });

  const onSubmit = async (values) => {
    setServerMessage("");
    setServerMessageType("info");

    try {
      const res = await fetch("/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 400) {
          setServerMessage(data.message || "Invalid input.");
          setServerMessageType("error");
        } else if (res.status === 409) {
          const msg = (data?.message || "").toLowerCase();

          if (msg.includes("email")) {
            setError("email", { type: "server", message: data.message });
          } else if (msg.includes("phone")) {
            setError("phoneNumber", { type: "server", message: data.message });
          } else {
            setServerMessage(data.message || "Account already exists.");
            setServerMessageType("error");
          }
        } else {
          setServerMessage(data.message || "Registration failed. Please try again.");
          setServerMessageType("error");
        }
        return;
      }

      setServerMessage(data.message || "Account created successfully.");
      setServerMessageType("success");
      reset();

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setServerMessage("Network error. Please try again.");
      setServerMessageType("error");
    }
  };

  return (
    <div className="register-page">
      <header className="signin-header">
        <div className="signin-container signin-header-content">
          <div className="signin-header-left">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="back-button"
              aria-label="Go back"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="logo-title">BIGZONE</h1>
          </div>

          <div className="signin-header-right">
            <span>New to BIGZONE?</span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="create-account-button"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>
      <div className="register-shell">
        <div className="register-panel register-panel-brand">
          <div className="brand-badge">Join us</div>
          <h1 className="brand-title">Create your account</h1>
          <p className="brand-copy">
            Start shopping, manage orders, save your wishlist, and access your account securely.
          </p>

          <ul className="brand-points">
            <li>Fast sign up experience</li>
            <li>Client-side validation with clear feedback</li>
            <li>Secure session handling with backend cookies</li>
          </ul>
        </div>

        <div className="register-panel register-panel-form">
          <div className="form-header">
            <h2>Sign up</h2>
            <p>Enter your details to create a new account.</p>
          </div>

          {serverMessage ? (
            <div className={`server-message ${serverMessageType}`}>
              {serverMessage}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="register-form">
            <div className="form-group">
              <label htmlFor="fullname" className="form-label">
                Full name
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Enter your full name"
                className={`form-input ${errors.fullname ? "input-error" : ""}`}
                {...register("fullname")}
              />
              {errors.fullname && <p className="form-error">{errors.fullname.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`form-input ${errors.email ? "input-error" : ""}`}
                {...register("email")}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber" className="form-label">
                Phone number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                className={`form-input ${errors.phoneNumber ? "input-error" : ""}`}
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && <p className="form-error">{errors.phoneNumber.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className={`password-field ${errors.password ? "input-error-wrap" : ""}`}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="form-input password-input"
                  {...register("password")}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                id="role"
                className="form-input form-select"
                {...register("role")}
              >
                <option value="user">User</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="form-helper">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}