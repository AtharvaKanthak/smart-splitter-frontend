import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const initialState = {
  name: "",
  email: "",
  password: "",
  upiId: "",
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(initialState);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const { data } = await api.post(endpoint, payload);
      login({ token: data.token, user: data.user });
      navigate("/dashboard");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <p className="auth-brand">Smart Expense Splitter</p>
        <h2>{isLogin ? "Login" : "Create account"}</h2>
        <p className="muted auth-subtitle">Split group trip expenses with smart settlement.</p>

        {!isLogin && (
          <>
            <label>
              Name
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </label>

            <label>
              UPI ID
              <input
                required
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="yourname@upi"
              />
            </label>
          </>
        )}

        <label>
          Email
          <input
            required
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            required
            minLength={6}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="auth-buttons">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setError("");
              setFormData(initialState);
              setIsLogin((prev) => !prev);
            }}
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AuthPage;
