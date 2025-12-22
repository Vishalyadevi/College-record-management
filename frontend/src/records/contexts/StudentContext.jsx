import { createContext, useContext, useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useAppContext } from "./AppContext";

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const { departments } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [usersWithDepartments, setUsersWithDepartments] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const backendUrl = "http://localhost:4000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");
        const userDeptId = localStorage.getItem("deptid");

        // Check if user is authenticated
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          console.log("User not authenticated - skipping data fetch");
          return;
        }

        setIsAuthenticated(true);

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Fetch all data in parallel
        const [studentsRes, staffRes, usersWithDeptRes] = await Promise.all([
          axios.get(`${backendUrl}/api/students`, config),
          axios.get(`${backendUrl}/api/get-staff`, {
            params: { role: "Staff" },
            headers: config.headers,
          }),
          axios.get(`${backendUrl}/api/department-counts`, config),
        ]);

        // Extract data safely
        let allStudents = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : studentsRes.data.students || [];
        
        let allStaff = Array.isArray(staffRes.data)
          ? staffRes.data
          : staffRes.data.staff || [];
        
        let allUsersWithDept = Array.isArray(usersWithDeptRes.data)
          ? usersWithDeptRes.data
          : usersWithDeptRes.data.users || [];

        // Apply role-based filtering
        if (userRole === "DeptAdmin" && userDeptId) {
          const deptIdNum = parseInt(userDeptId);
          
          // Filter students by department
          allStudents = allStudents.filter(student => student.Deptid === deptIdNum);
          
          // Filter staff by department
          allStaff = allStaff.filter(staffMember => staffMember.Deptid === deptIdNum);
          
          // Filter department counts by department
          allUsersWithDept = allUsersWithDept.filter(user => user.Deptid === deptIdNum);
        }
        // SuperAdmin sees all data (no filtering)

        setStudents(allStudents);
        setStaff(allStaff);
        setUsersWithDepartments(allUsersWithDept);
      } catch (error) {
        console.error(
          "Error fetching data:",
          error.response?.data || error.message
        );
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate batch-wise student counts
  const batchWiseCounts = useMemo(() => {
    const counts = {};
    (Array.isArray(students) ? students : []).forEach((student) => {
      const deptId = student.Deptid || "Unknown";
      const department = (Array.isArray(departments) ? departments : []).find(
        (dept) => dept.Deptid === deptId
      );

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

    (Array.isArray(usersWithDepartments)
      ? usersWithDepartments
      : []
    ).forEach((user) => {
      const deptAcronym = user.deptAcronym || "Unknown";

      if (user.students !== undefined && user.students !== null) {
        deptStudentCounts[deptAcronym] =
          (deptStudentCounts[deptAcronym] || 0) + user.students;
      }

      if (user.staff !== undefined && user.staff !== null) {
        deptStaffCounts[deptAcronym] =
          (deptStaffCounts[deptAcronym] || 0) + user.staff;
      }
    });

    return { deptStudentCounts, deptStaffCounts };
  }, [usersWithDepartments]);

  // Calculate city-wise student distribution
  const cityWiseCounts = useMemo(() => {
    const counts = {};
    
    (Array.isArray(students) ? students : []).forEach((student) => {
      const city = student.city || "Not Specified";
      counts[city] = (counts[city] || 0) + 1;
    });

    // Sort by count (descending) and return top cities
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [city, count]) => {
        acc[city] = count;
        return acc;
      }, {});
  }, [students]);

  // Get total student count
  const totalStudents = useMemo(() => {
    return Array.isArray(students) ? students.length : 0;
  }, [students]);

  // Get total staff count
  const totalStaff = useMemo(() => {
    return Array.isArray(staff) ? staff.length : 0;
  }, [staff]);

  // Get students by city
  const getStudentsByCity = (city) => {
    return (Array.isArray(students) ? students : []).filter(
      (student) => student.city === city
    );
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        staff,
        departments,
        loading,
        isAuthenticated,
        batchWiseCounts,
        usersWithDepartments,
        departmentWiseCounts,
        cityWiseCounts,
        totalStudents,
        totalStaff,
        getStudentsByCity,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700">Loading data...</h3>
          </div>
        </div>
      ) : (
        children
      )}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);