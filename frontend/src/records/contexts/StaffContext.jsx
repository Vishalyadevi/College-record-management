import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const StaffContext = createContext();

export const StaffProvider = ({ children }) => {
  const backendUrl = "http://localhost:4000";

  const [staffs, setStaffs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("userRole");
        const userDeptId = localStorage.getItem("deptid");

        // Fetch departments first
        const deptRes = await axios.get(`${backendUrl}/api/departments`);
        let allDepartments = deptRes.data || [];

        // Fetch staff data
        const staffRes = await axios.get(`${backendUrl}/api/staffs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let allStaffs = staffRes.data || [];

        // Filter based on user role
        if (userRole === "DeptAdmin" && userDeptId) {
          // DeptAdmin sees only their department
          const deptIdNum = parseInt(userDeptId);
          allStaffs = allStaffs.filter(staff => staff.Deptid === deptIdNum);
          allDepartments = allDepartments.filter(dept => dept.Deptid === deptIdNum);
        }
        // SuperAdmin sees everything (no filtering needed)

        setStaffs(allStaffs);
        setDepartments(allDepartments);
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
        toast.error("Failed to load data");
        setError(err.response?.data?.error || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <StaffContext.Provider value={{ staffs, departments, loading, error, setStaffs }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => useContext(StaffContext);