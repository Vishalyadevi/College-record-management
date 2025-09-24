import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";

const InternContext = createContext();

export const InternProvider = ({ children }) => {
  const backendUrl = "http://localhost:4000"; // Adjust as needed
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId"); // Assuming userID is stored in localStorage
  

  const [internships, setInternships] = useState([]);
  const [pendingInternships, setPendingInternships] = useState([]); // State for pending internships
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Approved Internships for the logged-in user
  const fetchInternships = async () => {
    if (!token || !UserId) return;

    try {
      const response = await fetch(`${backendUrl}/api/fetch-internships?UserId=${UserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      

      if (!response.ok) throw new Error("Failed to fetch internships");

      const data = await response.json();
      const approvedInternships = data.filter(
        (internship) => internship.tutor_approval_status === true
      );
      setInternships(approvedInternships);
    } catch (error) {
      console.error("Error fetching internships:", error);
    }
  };

  // Fetch Pending Internships for the logged-in user
  const fetchPendingInternships = async () => {
    if (!token || !UserId) return;

    try {
      const response = await fetch(`${backendUrl}/api/pending-internships?userID=${UserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch pending internships");

      const data = await response.json();

      if (data.success && Array.isArray(data.internships)) {
        const pending = data.internships.filter(
          (internship) => internship.tutor_approval_status === false
        );
        setPendingInternships(pending);
      } else {
        console.error("Unexpected response format:", data);
        setPendingInternships([]);
      }
    } catch (error) {
      console.error("Error fetching pending internships:", error);
      setPendingInternships([]);
    }
  };

  // Add Internship
  const addInternship = async (formData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/add-internships`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success("Internship added successfully!");
        fetchInternships();
        fetchPendingInternships();
      } else {
        console.error("Error saving internship:", response.status);
        toast.error("Failed to add internship.");
      }
    } catch (error) {
      console.error("Error submitting internship:", error);
      toast.error("Server error while adding internship.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update Internship
  const updateInternship = async (internshipId, formData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/update-internship/${internshipId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success("Internship updated successfully!");
        fetchInternships();
        fetchPendingInternships();
      } else {
        console.error("Error updating internship:", response.status);
        toast.error("Failed to update internship.");
      }
    } catch (error) {
      console.error("Error submitting internship update:", error);
      toast.error("Server error while updating internship.");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Internship
  const deleteInternship = async (internshipId) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setIsLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/delete-internship/${internshipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Internship deleted successfully!");
        fetchInternships();
        fetchPendingInternships();
      } else {
        console.error("Error deleting internship:", response.status);
        toast.error("Failed to delete internship.");
      }
    } catch (error) {
      console.error("Error deleting internship:", error);
      toast.error("Server error while deleting internship.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchPendingInternships();
  }, []);

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

// Custom hook to use the InternContext
export const useInternContext = () => useContext(InternContext);