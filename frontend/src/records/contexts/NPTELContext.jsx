// contexts/NPTELContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const NPTELContext = createContext();

export const useNPTEL = () => {
  const context = useContext(NPTELContext);
  if (!context) {
    throw new Error("useNPTEL must be used within an NPTELProvider");
  }
  return context;
};

export const NPTELProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const apiBase = "http://localhost:4000/api/nptel";

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // ========================
  // ADMIN FUNCTIONS
  // ========================

  // Add NPTEL course (Admin)
  const addCourse = async (courseData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/admin/add-course`,
        courseData,
        getAuthHeader()
      );
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update NPTEL course (Admin)
  const updateCourse = async (courseId, courseData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/admin/update-course/${courseId}`,
        courseData,
        getAuthHeader()
      );
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete NPTEL course (Admin)
  const deleteCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/admin/delete-course/${courseId}`,
        getAuthHeader()
      );
      await fetchAllCourses();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch all courses (Admin & Student)
  const fetchAllCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/courses`,
        getAuthHeader()
      );
      setCourses(response.data.courses || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================
  // STUDENT FUNCTIONS
  // ========================

  // Enroll in course (Student)
  const enrollCourse = async (enrollmentData) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiBase}/student/enroll`,
        enrollmentData,
        getAuthHeader()
      );
      await fetchStudentEnrollments(enrollmentData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to enroll in course");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update enrollment (Student)
  const updateEnrollment = async (enrollmentId, enrollmentData) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/student/update/${enrollmentId}`,
        enrollmentData,
        getAuthHeader()
      );
      await fetchStudentEnrollments(enrollmentData.Userid);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete enrollment (Student)
  const deleteEnrollment = async (enrollmentId, userId) => {
    setLoading(true);
    try {
      const response = await axios.delete(
        `${apiBase}/student/delete/${enrollmentId}`,
        {
          ...getAuthHeader(),
          data: { Userid: userId }
        }
      );
      await fetchStudentEnrollments(userId);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch student enrollments
  const fetchStudentEnrollments = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/student/my-courses?UserId=${userId}`,
        getAuthHeader()
      );
      setEnrollments(response.data.enrollments || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  // ========================
  // TUTOR/ADMIN FUNCTIONS
  // ========================

  // Fetch pending enrollments
  const fetchPendingEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${apiBase}/pending`,
        getAuthHeader()
      );
      setPendingEnrollments(response.data.enrollments || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending enrollments");
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify enrollment
  const verifyEnrollment = async (enrollmentId, verifierId, comments = "") => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${apiBase}/verify/${enrollmentId}`,
        {
          Userid: verifierId,
          verification_comments: comments
        },
        getAuthHeader()
      );
      await fetchPendingEnrollments();
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify enrollment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <NPTELContext.Provider
      value={{
        courses,
        enrollments,
        pendingEnrollments,
        loading,
        error,
        // Admin functions
        addCourse,
        updateCourse,
        deleteCourse,
        fetchAllCourses,
        // Student functions
        enrollCourse,
        updateEnrollment,
        deleteEnrollment,
        fetchStudentEnrollments,
        // Tutor/Admin functions
        fetchPendingEnrollments,
        verifyEnrollment,
        clearError,
      }}
    >
      {children}
    </NPTELContext.Provider>
  );
};