import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Client-side validation mirroring backend constraints
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
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

  const [showPassword, setShowPassword] = useState(false);
  const [serverMessage, setServerMessage] = useState("");

  const onSubmit = async (values) => {
    setServerMessage("");
    try {
      const res = await fetch("/api/v1/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // receive httpOnly cookie
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        // Map known server responses
        if (res.status === 400) {
          setServerMessage(data.message || "Invalid input.");
        } else if (res.status === 409) {
          // email or phone conflict
          const msg = (data?.message || "").toLowerCase();
          if (msg.includes("email")) {
            setError("email", { message: data.message });
          } else if (msg.includes("phone")) {
            setError("phoneNumber", { message: data.message });
          } else {
            setServerMessage(data.message);
          }
        } else {
          setServerMessage(data.message || "Registration failed. Please try again.");
        }
        return;
      }

      // Success: the backend sets cookie "token" and returns user payload
      // Navigate or update global auth state here
      setServerMessage(data.message || "Account created successfully.");
      // Example: window.location.assign("/account");
    } catch (err) {
      setServerMessage("Network error. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Create your account</h1>

      {serverMessage ? (
        <div style={styles.serverMsg}>{serverMessage}</div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="fullname" style={styles.label}>Full name</label>
          <input id="fullname" type="text" {...register("fullname")} style={styles.input} />
          {errors.fullname && <p style={styles.error}>{errors.fullname.message}</p>}
        </div>

        <div style={styles.field}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input id="email" type="email" {...register("email")} style={styles.input} />
          {errors.email && <p style={styles.error}>{errors.email.message}</p>}
        </div>

        <div style={styles.field}>
          <label htmlFor="phoneNumber" style={styles.label}>Phone number</label>
          <input id="phoneNumber" type="tel" inputMode="numeric" maxLength={10} {...register("phoneNumber")} style={styles.input} />
          {errors.phoneNumber && <p style={styles.error}>{errors.phoneNumber.message}</p>}
        </div>

        <div style={styles.field}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <div style={styles.passwordRow}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              style={{ ...styles.input, marginBottom: 0 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={styles.toggleBtn}
              aria-label="Toggle password visibility"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && <p style={styles.error}>{errors.password.message}</p>}
        </div>

        <div style={styles.field}>
          <label htmlFor="role" style={styles.label}>Role</label>
          <select id="role" {...register("role")} style={styles.select}>
            <option value="user">User</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" disabled={isSubmitting} style={styles.submit}>
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>

      <p style={styles.helper}>
        Already have an account? <a href="/login">Sign in</a>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 420,
    margin: "40px auto",
    padding: 24,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    fontFamily: "Inter, system-ui, Arial, sans-serif",
  },
  title: { margin: 0, marginBottom: 12, fontSize: 24, fontWeight: 700 },
  serverMsg: {
    padding: 10,
    background: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column" },
  label: { marginBottom: 6, fontSize: 14, fontWeight: 600 },
  input: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },
  passwordRow: { display: "flex", gap: 8, alignItems: "center" },
  toggleBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  submit: {
    marginTop: 8,
    background: "#111827",
    color: "#fff",
    border: "none",
    padding: "12px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  helper: { marginTop: 12, fontSize: 14, color: "#374151" },
  error: { color: "#b91c1c", fontSize: 12, marginTop: 6 },
};
