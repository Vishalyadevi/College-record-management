import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";
import NEC_IMAGE from "../assets/nec2.JPG"; // Import the same background image

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:4000/api/forgot-password", { email });
      toast.success(response.data.message, { autoClose: 3000 });
      setEmail(""); // Clear the email field after successful submission
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error sending email";
      toast.error(errorMessage, { autoClose: 3000 });
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

        {/* Right Side: Forgot Password Container */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-10 bg-white/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <h1 className="text-3xl font-bold text-gray-800 text-center">Forgot Password</h1>

              {/* Email Input */}
              <div className="w-full">
                <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
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
                    <span className="ml-2">Sending...</span>
                  </div>
                ) : (
                  "SEND RESET LINK"
                )}
              </button>

              {/* Back to Login Link */}
              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-all"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;