import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const StaffContext = createContext();

export const StaffProvider = ({ children }) => {
  const backendUrl = "http://localhost:4000"; // Ensure backend URL is defined

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
        const [staffRes, deptRes] = await Promise.all([
          axios.get(`${backendUrl}/api/staffs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${backendUrl}/api/departments`),
        ]);

        setStaffs(staffRes.data || []);
        
        setDepartments(deptRes.data || []);
       
      } catch (err) {
        console.error("Error fetching data:", err.response?.data || err.message);
        toast.error("Failed to load data");
        setError(err.response?.data?.error || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Removed `backendUrl` dependency to avoid unnecessary re-renders

  return (
    <StaffContext.Provider value={{ staffs, departments, loading, error, setStaffs }}>
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => useContext(StaffContext);