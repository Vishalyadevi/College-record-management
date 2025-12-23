import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";

const InternContext = createContext();

export const InternProvider = ({ children }) => {
  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const UserId = user?.Userid;

  const [internships, setInternships] = useState([]);
  const [pendingInternships, setPendingInternships] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Approved Internships
  const fetchInternships = async () => {
    if (!token || !UserId) {
      console.log("❌ No token or UserId found");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📥 Fetching approved internships for UserId:", UserId);
      
      const response = await fetch(`${backendUrl}/api/fetch-internships?UserId=${UserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Fetch error:", response.status, errorText);
        throw new Error("Failed to fetch internships");
      }

      const data = await response.json();
      console.log("✅ Approved internships fetched:", data);
      
      const approvedInternships = Array.isArray(data) 
        ? data.filter(internship => internship.tutor_approval_status === true)
        : [];
      
      setInternships(approvedInternships);
    } catch (error) {
      console.error("❌ Error fetching internships:", error);
      toast.error("Failed to fetch internships");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Pending Internships
  const fetchPendingInternships = async () => {
    if (!token || !UserId) {
      console.log("❌ No token or UserId found");
      return;
    }

    try {
      setIsLoading(true);
      console.log("📥 Fetching pending internships for UserId:", UserId);
      
      const response = await fetch(`${backendUrl}/api/pending-internships?userID=${UserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Fetch error:", response.status, errorText);
        throw new Error("Failed to fetch pending internships");
      }

      const data = await response.json();
      console.log("✅ Pending internships fetched:", data);

      if (data.success && Array.isArray(data.internships)) {
        const pending = data.internships.filter(
          internship => internship.tutor_approval_status === false
        );
        setPendingInternships(pending);
      } else {
        console.error("Unexpected response format:", data);
        setPendingInternships([]);
      }
    } catch (error) {
      console.error("❌ Error fetching pending internships:", error);
      toast.error("Failed to fetch pending internships");
      setPendingInternships([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add Internship
  const addInternship = async (formData) => {
    if (!token || !UserId) {
      toast.error("Unauthorized: No token or user ID found");
      return;
    }

    setIsLoading(true);

    // Ensure UserId is in formData
    if (!formData.has("Userid")) {
      formData.append("Userid", UserId);
    }

    // Log FormData contents for debugging
    console.log("📤 Submitting internship with data:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await fetch(`${backendUrl}/api/add-internships`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log("📥 Add internship response:", responseData);

      if (response.ok && responseData.success) {
        toast.success(responseData.message || "Internship added successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to add internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error submitting internship:", error);
      toast.error("Server error while adding internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update Internship
  const updateInternship = async (internshipId, formData) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setIsLoading(true);

    // Log FormData contents for debugging
    console.log("📤 Updating internship with data:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await fetch(`${backendUrl}/api/update-internship/${internshipId}`, {
        method: "PATCH",
        headers: { 
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log("📥 Update internship response:", responseData);

      if (response.ok && responseData.success) {
        toast.success(responseData.message || "Internship updated successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to update internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error submitting internship update:", error);
      toast.error("Server error while updating internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Internship
  const deleteInternship = async (internshipId) => {
    if (!token) {
      toast.error("Unauthorized: No token found");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/delete-internship/${internshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();
      console.log("📥 Delete internship response:", responseData);

      if (response.ok && responseData.success) {
        toast.success(responseData.message || "Internship deleted successfully!");
        await fetchInternships();
        await fetchPendingInternships();
        return true;
      } else {
        console.error("❌ Error response:", responseData);
        toast.error(responseData.message || "Failed to delete internship.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error deleting internship:", error);
      toast.error("Server error while deleting internship.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && UserId) {
      fetchInternships();
      fetchPendingInternships();
    }
  }, [token, UserId]);

  return (
    <InternContext.Provider
      value={{
        internships,
        pendingInternships,
        isLoading,
        fetchInternships,
        fetchPendingInternships,
        addInternship,
        updateInternship,
        deleteInternship,
      }}
    >
      {children}
    </InternContext.Provider>
  );
};

export const useInternContext = () => {
  const context = useContext(InternContext);
  if (!context) {
    throw new Error("useInternContext must be used within an InternProvider");
  }
  return context;
};