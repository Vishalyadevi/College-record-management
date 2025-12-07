import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import { toast } from "react-toastify";
import NEC_IMAGE from "../assets/nec2.JPG";

const RecordsLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on input change
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required");
      }

      // Call login from context
      const response = await login(formData.email, formData.password);
      
      const { user } = response;

      if (!user || !user.role) {
        throw new Error("Invalid response from server");
      }

      // Show success message
      toast.success(`${user.role} logged in successfully!`);

      // Role-based routing - matches your backend roles
      const roleRoutes = {
        Student: "/records/student-background",
        Staff: "/records/staff",
        DeptAdmin: "/records/admin",
        SuperAdmin: "/records/admin",
        IrAdmin: "/records/ir-admin",
        PgAdmin: "/records/pg-admin",
        AcademicAdmin: "/records/academic-admin",
        NewgenAdmin: "/records/newgen-admin",
        PlacementAdmin: "/records/placement-admin",
      };

      // Get redirect path based on role
      const redirectPath = roleRoutes[user.role] || "/records/dashboard";

      // Navigate after short delay
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);

    } catch (err) {
      console.error("Login error:", err);
      
      // Handle different error types
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Full-Screen Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${NEC_IMAGE})` }}
      >
        {/* Overlay for Desktop Only */}
        <div className="hidden lg:block absolute inset-0 backdrop-blur-sm bg-black/20"></div>
      </div>

      {/* Centered Container */}
      <div className="relative z-10 w-full lg:w-4/5 xl:w-3/4 max-w-6xl flex flex-col lg:flex-row bg-white/20 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/30">
        {/* Left Side: Image */}
        <div
          className="hidden lg:flex w-full lg:w-1/2 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${NEC_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>
        </div>

        {/* Right Side: Login Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-10 bg-white/95 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              {/* Title */}
              <div className="text-center mb-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                  Welcome Back
                </h1>
                <p className="text-gray-600 text-sm">Sign in to your account</p>
              </div>

              {/* Email Input */}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-lg text-white font-semibold transition-all transform hover:scale-[1.02] ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "LOGIN"
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  to="/records/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-all font-medium hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Additional Info */}
              <div className="text-center text-xs text-gray-500 mt-4">
                <p>Protected by secure authentication</p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RecordsLogin;