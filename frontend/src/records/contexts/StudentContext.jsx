import { createContext, useContext, useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext"; // Import useAppContext

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const { departments } = useAppContext(); // Consume departments from AppContext
  const [loading, setLoading] = useState(true);
  const [usersWithDepartments, setUsersWithDepartments] = useState([]);

  const backendUrl = "http://localhost:4000";

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch students, staff, and users with department details in parallel
        const [studentsRes, staffRes, usersWithDeptRes] = await Promise.all([
          axios.get(`${backendUrl}/api/students`, config),
          axios.get(`${backendUrl}/api/get-staff`, {
            params: { role: "Staff" },
            headers: config.headers,
          }),
          axios.get(`${backendUrl}/api/department-counts`, config),
        ]);

        setStudents(studentsRes.data || []);
        setStaff(staffRes.data || []);
        setUsersWithDepartments(usersWithDeptRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate batch-wise student counts
  const batchWiseCounts = useMemo(() => {
    const counts = {};
    students.forEach((student) => {
      const deptId = student.Deptid || "Unknown";

      // Find department acronym using Deptid
      const department = departments.find((dept) => dept.Deptid === deptId);
     
      const deptAcronym = department ? department.Deptacronym : "Unknown";

      const batch = student.batch || "Unknown";

      if (!counts[deptAcronym]) {
        counts[deptAcronym] = {};
      }

      counts[deptAcronym][batch] = (counts[deptAcronym][batch] || 0) + 1;
    });

    return counts;
  }, [students, departments]);

  // Calculate department-wise student and staff counts
  const departmentWiseCounts = useMemo(() => {
    const deptStudentCounts = {};
    const deptStaffCounts = {};

    usersWithDepartments.forEach((user) => {
      const deptAcronym = user.deptAcronym || "Unknown";

      if (user.students !== undefined && user.students !== null) {
        deptStudentCounts[deptAcronym] = (deptStudentCounts[deptAcronym] || 0) + user.students;
      }
      if (user.staff !== undefined && user.staff !== null) {
        deptStaffCounts[deptAcronym] = (deptStaffCounts[deptAcronym] || 0) + user.staff;
      }
    });

    return { deptStudentCounts, deptStaffCounts };
  }, [usersWithDepartments]);

  return (
    <StudentContext.Provider
      value={{
        students,
        staff,
        departments,
        loading,
        batchWiseCounts,
        usersWithDepartments,
        departmentWiseCounts,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);