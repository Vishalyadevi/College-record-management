import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import Navbar from "./publichomeNavbar";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ✅ Check token validity on page load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      // Verify token with backend
      axios
        .get("http://localhost:4000/api/placement/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          // Token is valid, redirect based on role
          if (role === "placementadmin" || role === "superadmin") {
            navigate("/placement/admin-recruiters");
          } else if (role === "student") {
            navigate("/placement/home");
          } else if (role === "staff") {
            navigate("/placement/staff-home");
          }
        })
        .catch(() => {
          // Token invalid → clear storage
          localStorage.clear();
        });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:4000/api/placement/login", {
        identifier,
        password,
      });

      if (response.status === 200) {
        const { message, role, userId, username, email, regno, token } = response.data;

        // ✅ Save JWT token
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("userId", userId.toString());
        localStorage.setItem("username", username);
        localStorage.setItem("email", email);
        if (regno) localStorage.setItem("regno", regno);

        setShowSuccess(true);
        setProgress(100);

        setTimeout(() => {
          if (role === "placementadmin" || role === "superadmin") {
            navigate("/placement/admin-recruiters");
          } else if (role === "student") {
            navigate("/placement/home");
          } else if (role === "staff") {
            navigate("/placement/staff-home");
          } else {
            // Unauthorized role
            setError("You don't have access to the placement portal");
            localStorage.clear();
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setShowSuccess(false);
      setProgress(0);

      if (error.response) {
        setError(error.response.data.message || "Login failed");
      } else if (error.request) {
        setError("Cannot connect to server. Please check if the server is running.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loginpage">
      <Navbar />

      <div className="center">
        <div className="container">
          <h2>Placement Portal Login</h2>

          {error && <div className="error-message">{error}</div>}
          
          {showSuccess && (
            <div className="success-message">
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username / Regno"
              disabled={isLoading}
              required
            />
            <br />
            <br />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              required
            />
            <br />
            <br />

            <button
              type="submit"
              id="login"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="info-text" style={{ marginTop: "20px", fontSize: "0.9em", color: "#666" }}>
            <p>For Admins: Use your username</p>
            <p>For Students: Use your registration number</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;