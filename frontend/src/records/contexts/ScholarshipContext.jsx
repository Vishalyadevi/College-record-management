import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

const ScholarshipContext = createContext();

export const ScholarshipProvider = ({ children }) => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backendUrl ="http://localhost:4000"; // Base URL for the backend
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId"); // Assuming userID is stored in localStorage
 

  // Fetch all scholarships
  const fetchScholarships = async () => {
    if (!token||!UserId) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/fetch-scholarships?UserId=${UserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setScholarships(data);
        } else {
          console.error("Expected an array but got:", data);
          setScholarships([]); // Fallback to an empty array
        }
      } else {
        console.error("Error fetching scholarships:", response.status);
        toast.error("Failed to fetch scholarships.");
      }
    } catch (err) {
      console.error("Error fetching scholarships:", err);
      setError(err.message);
      toast.error("Server error while fetching scholarships.");
    } finally {
      setLoading(false);
    }
  };

  // Add a new scholarship
  const addScholarship = async (scholarship) => {
    console.log(scholarship)
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/add-scholarship`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scholarship),
      });

      if (response.ok) {
        const data = await response.json();
        setScholarships([...scholarships, data]);
        toast.success("Scholarship added successfully!");
      } else {
        console.error("Error adding scholarship:", response.status);
        toast.error("Failed to add scholarship.");
      }
    } catch (err) {
      console.error("Error adding scholarship:", err);
      setError(err.message);
      toast.error("Server error while adding scholarship.");
    } finally {
      setLoading(false);
    }
  };

  // Update a scholarship
  const updateScholarship = async (id, updatedScholarship) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/update-scholarship/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedScholarship),
      });

      if (response.ok) {
        const data = await response.json();
        setScholarships(scholarships.map((s) => (s.id === id ? data : s)));
        toast.success("Scholarship updated successfully!");
      } else {
        console.error("Error updating scholarship:", response.status);
        toast.error("Failed to update scholarship.");
      }
    } catch (err) {
      console.error("Error updating scholarship:", err);
      setError(err.message);
      toast.error("Server error while updating scholarship.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a scholarship
  const deleteScholarship = async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/delete-scholarship/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setScholarships(scholarships.filter((s) => s.id !== id));
        toast.success("Scholarship deleted successfully!");
      } else {
        console.error("Error deleting scholarship:", response.status);
        toast.error("Failed to delete scholarship.");
      }
    } catch (err) {
      console.error("Error deleting scholarship:", err);
      setError(err.message);
      toast.error("Server error while deleting scholarship.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, []);

  return (
    <ScholarshipContext.Provider
      value={{
        scholarships,
        loading,
        error,
        fetchScholarships,
        addScholarship,
        updateScholarship,
        deleteScholarship,
      }}
    >
      {children}
    </ScholarshipContext.Provider>
  );
};

export const useScholarship = () => useContext(ScholarshipContext);