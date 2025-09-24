import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import NEC_IMAGE from "../assets/nec2.JPG";

const RecordsLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
        const { data } = await axios.post('http://localhost:4000/api/auth/login', formData);
        const { token, role, Userid, profileImage, Deptid, staffId } = data;
        
        if (!token || !role || !Userid) throw new Error('Invalid response from server');
        
        localStorage.setItem('user', JSON.stringify({ token, role, Userid, profileImage, Deptid }));
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', Userid);
        localStorage.setItem('userImage', profileImage);
        localStorage.setItem('deptid', Deptid);
  
        if (role === "Staff" && staffId) {
          localStorage.setItem("staffId", staffId);
        }
     
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} logged in successfully`);

        // Fixed route mappings to match your App.js routes
        const roleRoutes = {
          'Student': '/records/student-background',    // Fixed: matches the actual route
          'Staff': '/records/staff',         // Fixed: matches the actual route  
          'Admin': '/records/admin'                    // Fixed: matches the actual route
        };

        // Use the exact role case from server response
        const redirectPath = roleRoutes[role] || '/records/dashboard';
        setTimeout(() => navigate(redirectPath), 1000);

    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
        setError(errorMessage);
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
        <div className="hidden lg:block absolute inset-0 backdrop-blur-sm"></div>
      </div>

      {/* Centered Container for Desktop */}
      <div className="w-full lg:w-4/5 xl:w-3/4 max-w-6xl flex flex-col lg:flex-row bg-white/20 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden border border-white/30">
        {/* Left Side: Image */}
        <div
          className="hidden lg:flex w-full lg:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: `url(${NEC_IMAGE})` }}
        >
        </div>

        {/* Right Side: Login Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-10 bg-white/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <h1 className="text-3xl font-bold text-gray-800 text-center">Login</h1>

              {/* Email Input */}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10" />
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-600">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10" />
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-lg text-white font-semibold transition-all ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="ml-2">Logging in...</span>
                  </div>
                ) : (
                  "LOGIN"
                )}
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <Link
                  to="/records/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-all"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-600 text-sm text-center mt-2">{error}</p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RecordsLogin;