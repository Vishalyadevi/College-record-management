import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaKey, FaSave, FaPlus, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const MyProfile = () => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    profileImage: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [editImage, setEditImage] = useState(false);
  const [editPassword, setEditPassword] = useState(false);

  const backendUrl = "http://localhost:4000";
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (!userId) {
          toast.error("User ID not found. Please log in again.");
          return;
        }

        const response = await axios.get(`${backendUrl}/api/get-user/${userId}`);

        if (response.data.success) {
          setUser({
            username: response.data.user.username,
            email: response.data.user.email,
            role: response.data.user.role,
            profileImage: response.data.user.profileImage
              ? `${backendUrl}${response.data.user.profileImage}`
              : "https://via.placeholder.com/150",
          });
        } else {
          toast.error("Failed to fetch user details.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        toast.error("Error fetching user details.");
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Handle image selection and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setEditImage(true);
    }
  };

  // Update profile (image & password)
  const handleUpdateProfile = async () => {
    if (editPassword && newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    const formData = new FormData();
    if (newImage) formData.append("image", newImage);
    if (editPassword) formData.append("password", newPassword);

    try {
      const response = await axios.put(`${backendUrl}/api/update-profile/${userId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setEditImage(false);
        setEditPassword(false);
        setNewPassword("");
        setConfirmPassword("");

        // Update profile image on success
        setUser((prev) => ({
          ...prev,
          profileImage: response.data.profileImage
            ? `${backendUrl}${response.data.profileImage}`
            : prev.profileImage,
        }));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  // Navigate to StudentBioData page
  const handleNavigateToBioData = () => {
    navigate(`/records/student-biodata/${userId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-500 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md text-center">
        
        {/* Profile Image Section */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <img
            src={previewImage || user.profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto border-4 border-blue-200 object-cover"
          />
          <div
            className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <FaPlus className="text-white text-lg" />
          </div>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* User Info */}
        <h2 className="text-2xl font-semibold mb-2">{user.username || "Loading..."}</h2>
        <p className="text-gray-600 mb-2">{user.email || "Loading..."}</p>
        <p className="bg-gray-200 px-4 py-1 rounded-full text-sm text-gray-700 inline-block">
          {user.role || "Loading..."}
        </p>
        

        {/* Bio Data Button (Visible only for students) */}
        {user.role === "Student" && (
          <div
            className="flex items-center justify-center space-x-2 cursor-pointer bg-green-500 text-white px-4 py-2 rounded-full mt-4 hover:bg-green-600 transition-colors"
            onClick={handleNavigateToBioData}
          >
            <FaUser className="text-white" />
            <span>Bio Data</span>
          </div>
        )}

        {/* Password Update Section */}
        <div className="mt-8">
          <div
            className="flex items-center justify-center space-x-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
            onClick={() => setEditPassword(!editPassword)}
          >
            <FaKey className="text-white" />
            <span>Change Password</span>
          </div>
          {editPassword && (
            <div className="mt-4 space-y-4">
              <input
                type="password"
                placeholder="New Password"
                className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="border p-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Save Button (Visible only in editable mode) */}
        {(editImage || editPassword) && (
          <button
            onClick={handleUpdateProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-full mt-8 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 w-full"
          >
            <FaSave />
            <span>Save Changes</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;