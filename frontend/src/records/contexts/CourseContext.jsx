import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseContext = createContext();

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [gpaData, setGpaData] = useState({});
  const [marksheets, setMarksheets] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("token");
  const UserId = localStorage.getItem("userId");

  // Initialize marksheets for all semesters
  const initializeMarksheets = useCallback(() => {
    const initialMarksheets = {};
    for (let i = 1; i <= 8; i++) {
      initialMarksheets[i] = null;
    }
    return initialMarksheets;
  }, []);

  // Fetch all courses
  const fetchCourses = useCallback(async () => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    try {
      setLoading(true);
      setError(null);
      
      const [coursesResponse, gpaResponse] = await Promise.all([
        axios.get(`${backendUrl}/api/courses-enrollment?UserId=${UserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${backendUrl}/api/gpa?UserId=${UserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      ]);
      
      // Handle courses response
      let coursesData = [];
      if (Array.isArray(coursesResponse.data)) {
        coursesData = coursesResponse.data;
      } else if (coursesResponse.data?.courses) {
        coursesData = coursesResponse.data.courses;
      } else if (coursesResponse.data?.data) {
        coursesData = coursesResponse.data.data;
      }

      setCourses(coursesData);

      // Handle GPA response
      const gpaData = gpaResponse.data?.data || gpaResponse.data || {};
      setGpaData(gpaData);

    } catch (err) {
      console.error("Error fetching course data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      toast.error("Failed to fetch course data");
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  // Fetch marksheets
  const fetchMarksheets = useCallback(async () => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/marksheets?UserId=${UserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const marksheetsData = response.data?.data || response.data || {};
      
      // Merge with initialized marksheets
      setMarksheets({
        ...initializeMarksheets(),
        ...marksheetsData
      });
    } catch (err) {
      console.error("Failed to fetch marksheets:", err);
      setError(err.message);
      setMarksheets(initializeMarksheets());
      toast.error("Failed to fetch marksheets");
    } finally {
      setLoading(false);
    }
  }, [token, UserId, initializeMarksheets]);

  // Add new course
  const addCourse = useCallback(async (courseData) => {
    if (!token) return toast.error("Unauthorized: No token found");
    console.log(courseData)
    try {
      setLoading(true);
      const response = await axios.post(`${backendUrl}/api/add-course-enrollment`, {
        ...courseData,
        UserId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const newCourse = response.data?.data || response.data;
      if (newCourse) {
        setCourses(prev => [...prev, newCourse]);
        toast.success("Course added successfully!");
      }
      return newCourse;
    } catch (err) {
      console.error("Error adding course:", err);
      setError(err.response?.data?.message || err.message || 'Failed to add course');
      toast.error("Failed to add course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  // Update course
  const updateCourse = useCallback(async (id, courseData) => {
    if (!token) return toast.error("Unauthorized: No token found");

    try {
      setLoading(true);
      const response = await axios.put(`${backendUrl}/api/courses/${id}`, courseData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const updatedCourse = response.data?.data || response.data;
      if (updatedCourse) {
        setCourses(prev => prev.map(course => 
          course.id === id ? updatedCourse : course
        ));
        toast.success("Course updated successfully!");
      }
      return updatedCourse;
    } catch (err) {
      console.error("Error updating course:", err);
      setError(err.response?.data?.message || err.message || 'Failed to update course');
      toast.error("Failed to update course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Delete course
  const deleteCourse = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    try {
      setLoading(true);
      await axios.delete(`${backendUrl}/api/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(prev => prev.filter(course => course.id !== id));
      toast.success("Course deleted successfully!");
      return true;
    } catch (err) {
      console.error("Error deleting course:", err);
      setError(err.response?.data?.message || err.message || 'Failed to delete course');
      toast.error("Failed to delete course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update GPA
  const updateGPA = useCallback(async (gpaData) => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    try {
      setLoading(true);
      const response = await axios.put(`${backendUrl}/api/gpa`, {
        ...gpaData,
        UserId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const updatedGPA = response.data?.data || response.data;
      if (updatedGPA) {
        setGpaData(updatedGPA);
        toast.success("GPA updated successfully!");
      }
      return updatedGPA;
    } catch (err) {
      console.error("Error updating GPA:", err);
      setError(err.response?.data?.message || err.message || 'Failed to update GPA');
      toast.error("Failed to update GPA");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  // Upload marksheet
  const uploadMarksheet = useCallback(async (semester, file) => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('marksheet', file);
      formData.append('UserId', UserId);
      formData.append('semester', semester);
      
      const response = await axios.post(`${backendUrl}/api/marksheets`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const fileName = response.data?.fileName || response.data?.data?.fileName;
      if (fileName) {
        setMarksheets(prev => ({
          ...prev,
          [semester]: fileName
        }));
        toast.success("Marksheet uploaded successfully!");
        return fileName;
      }
    } catch (err) {
      console.error("Error uploading marksheet:", err);
      setError(err.response?.data?.message || err.message || 'Failed to upload marksheet');
      toast.error("Failed to upload marksheet");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  // Delete marksheet
  const deleteMarksheet = useCallback(async (semester) => {
    if (!token || !UserId) return toast.error("Unauthorized: No token or user ID found");

    try {
      setLoading(true);
      await axios.delete(`${backendUrl}/api/marksheets/${semester}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { UserId }
      });
      setMarksheets(prev => ({
        ...prev,
        [semester]: null
      }));
      toast.success("Marksheet deleted successfully!");
      return true;
    } catch (err) {
      console.error("Error deleting marksheet:", err);
      setError(err.response?.data?.message || err.message || 'Failed to delete marksheet');
      toast.error("Failed to delete marksheet");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, UserId]);

  // Approve course
  const approveCourse = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    try {
      setLoading(true);
      const response = await axios.patch(`${backendUrl}/api/courses/${id}/approve`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const approvedCourse = response.data?.data || response.data;
      if (approvedCourse) {
        setCourses(prev => prev.map(course => 
          course.id === id ? approvedCourse : course
        ));
        toast.success("Course approved successfully!");
      }
      return approvedCourse;
    } catch (err) {
      console.error("Error approving course:", err);
      setError(err.response?.data?.message || err.message || 'Failed to approve course');
      toast.error("Failed to approve course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Reject course
  const rejectCourse = useCallback(async (id) => {
    if (!token) return toast.error("Unauthorized: No token found");

    try {
      setLoading(true);
      const response = await axios.patch(`${backendUrl}/api/courses/${id}/reject`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const rejectedCourse = response.data?.data || response.data;
      if (rejectedCourse) {
        setCourses(prev => prev.map(course => 
          course.id === id ? rejectedCourse : course
        ));
        toast.success("Course rejected successfully!");
      }
      return rejectedCourse;
    } catch (err) {
      console.error("Error rejecting course:", err);
      setError(err.response?.data?.message || err.message || 'Failed to reject course');
      toast.error("Failed to reject course");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
    fetchMarksheets();
  }, [fetchCourses, fetchMarksheets]);

  return (
    <CourseContext.Provider
      value={{
        courses,
        gpaData,
        marksheets,
        loading,
        error,
        fetchCourses,
        fetchMarksheets,
        addCourse,
        updateCourse,
        deleteCourse,
        updateGPA,
        uploadMarksheet,
        deleteMarksheet,
        approveCourse,
        rejectCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => useContext(CourseContext);