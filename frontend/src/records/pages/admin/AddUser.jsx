import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { FaPlus, FaSpinner, FaUndo } from "react-icons/fa";
import { useAppContext } from "../../contexts/AppContext";
import { useUser } from "../../contexts/UserContext";

const FormField = React.memo(({ label, name, value, onChange, type = "text", options = [], required = false, placeholder = "", disabled = false }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
            typeof opt === "object" ? (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      )}
    </div>
  );
});

const AddUser = () => {
  const { backendUrl, departments, staffs } = useAppContext();
  const { user } = useUser();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    regno: "",
    year: "1st YEAR",
    course: "",
    Deptid: "",
    batch: "",
    staffId: "",
    TutorId: "",
  });

  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);

  // Determine available roles and departments based on current user's role
  useEffect(() => {
    if (!user) return;

    const rolePermissions = {
      SuperAdmin: ["Student", "Staff", "DeptAdmin", "IrAdmin", "PgAdmin", "AcademicAdmin", "NewgenAdmin", "PlacementAdmin"],
      DeptAdmin: ["Student", "Staff"],
      AcademicAdmin: ["Student", "Staff"],
      IrAdmin: ["Student"],
      PgAdmin: ["Student"],
      NewgenAdmin: ["Student"],
      PlacementAdmin: ["Student"],
      Staff: [],
    };

    setAvailableRoles(rolePermissions[user.role] || []);

    // Filter departments based on user role
    if (user.role === "DeptAdmin" && user.Deptid) {
      // DeptAdmin can only add users to their own department
      const userDept = departments.filter(dept => dept.Deptid === user.Deptid);
      setFilteredDepartments(userDept);
      
      // Auto-set department for DeptAdmin
      if (userDept.length > 0) {
        setFormData(prev => ({ ...prev, Deptid: userDept[0].Deptid }));
      }
    } else {
      // SuperAdmin and others see all departments
      setFilteredDepartments(departments);
    }

    // Filter staff based on user department
    if (user.role === "DeptAdmin" && user.Deptid) {
      const deptStaffs = staffs.filter(staff => staff.Deptid === user.Deptid);
      setFilteredStaffs(deptStaffs);
    } else {
      setFilteredStaffs(staffs);
    }
  }, [user, departments, staffs]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    const defaultDeptId = user?.role === "DeptAdmin" && user?.Deptid ? user.Deptid : "";
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
      regno: "",
      year: "1st YEAR",
      course: "",
      Deptid: defaultDeptId,
      batch: "",
      staffId: "",
      TutorId: "",
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return false;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address!");
      return false;
    }

    if (formData.role === "Student") {
      if (!formData.regno || !formData.year || !formData.course || !formData.Deptid || !formData.batch) {
        toast.error("All student fields are required!");
        return false;
      }
      if (!formData.TutorId) {
        toast.error("Please select a tutor for the student!");
        return false;
      }
    }

    if (formData.role === "Staff") {
      if (!formData.staffId || !formData.Deptid) {
        toast.error("Staff ID and Department are required!");
        return false;
      }
    }

    return true;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized: Please login again");
        setLoading(false);
        return;
      }

      // Create payload - start with a clean object
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      // Add role-specific fields
      if (formData.role === "Student") {
        payload.regno = formData.regno.trim();
        payload.year = formData.year;
        payload.course = formData.course;
        payload.Deptid = parseInt(formData.Deptid); // Convert to number
        payload.batch = formData.batch.trim();
        payload.TutorId = parseInt(formData.TutorId); // Send as TutorId, not staffId
        
        // Debug: Log the tutor mapping
        console.log("Student payload - TutorId:", formData.TutorId);
      } 
      else if (formData.role === "Staff") {
        payload.staffId = formData.staffId.trim();
        payload.Deptid = parseInt(formData.Deptid); // Convert to number
      } 
      else if (["DeptAdmin", "IrAdmin", "PgAdmin", "AcademicAdmin", "NewgenAdmin", "PlacementAdmin"].includes(formData.role)) {
        payload.Deptid = parseInt(formData.Deptid); // Convert to number
      }

      console.log("=== FULL PAYLOAD DETAILS ===");
      console.log("Payload being sent:", payload);
      console.log("Payload keys:", Object.keys(payload));
      console.log("Payload values:", Object.values(payload));
      console.log("===========================");

      const response = await axios.post(
        `${backendUrl}/api/add-user`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(response.data.message || "User added successfully!");
      resetForm();
    } catch (error) {
      console.error("=== ERROR DETAILS ===");
      console.error("Full error:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      console.error("Error message:", error.response?.data?.message);
      console.error("====================");
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to add user. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fields = useMemo(() => {
    const commonFields = [
      { label: "Name", name: "username", type: "text", placeholder: "Enter Full Name", required: true },
      { label: "Email", name: "email", type: "email", placeholder: "Enter Email Address", required: true },
      { label: "Password", name: "password", type: "password", placeholder: "Enter Password (min 6 characters)", required: true },
      { label: "Confirm Password", name: "confirmPassword", type: "password", placeholder: "Confirm Password", required: true },
    ];

    const roleSpecificFields =
      formData.role === "Student"
        ? [
            { label: "Register Number", name: "regno", type: "text", placeholder: "Enter Register Number", required: true },
            { label: "Year", name: "year", type: "select", options: ["1st YEAR", "2nd YEAR", "3rd YEAR", "4th YEAR"], placeholder: "Select Year", required: true },
            { label: "Course", name: "course", type: "select", options: ["B.E", "B.TECH"], placeholder: "Select Course", required: true },
            ...(formData.course
              ? [
                  {
                    label: "Department",
                    name: "Deptid",
                    type: "select",
                    options:
                      formData.course === "B.TECH"
                        ? filteredDepartments
                            .filter((dep) => ["AIDS", "IT"].includes(dep.Deptacronym))
                            .map((d) => ({ value: d.Deptid, label: d.Deptname }))
                        : filteredDepartments
                            .filter((dep) => ["CSE", "ECE", "EEE", "Civil", "Mech"].includes(dep.Deptacronym))
                            .map((d) => ({ value: d.Deptid, label: d.Deptname })),
                    placeholder: "Select Department",
                    required: true,
                    disabled: user?.role === "DeptAdmin"
                  },
                ]
              : []),
            { label: "Batch", name: "batch", type: "text", placeholder: "Enter Batch (e.g., 2021-2025)", required: true },
            {
              label: "Tutor",
              name: "TutorId",
              type: "select",
              options: filteredStaffs.map((s) => ({ value: s.id, label: s.name })),
              placeholder: "Select Tutor",
              required: true,
            },
          ]
        : formData.role === "Staff"
        ? [
            {
              label: "Staff ID",
              name: "staffId",
              type: "text",
              placeholder: "Enter Staff ID",
              required: true,
            },
            {
              label: "Department",
              name: "Deptid",
              type: "select",
              options: filteredDepartments.map((d) => ({ value: d.Deptid, label: d.Deptname })),
              placeholder: "Select Department",
              required: true,
              disabled: user?.role === "DeptAdmin"
            },
          ]
        : formData.role === "DeptAdmin" ||
          formData.role === "IrAdmin" ||
          formData.role === "PgAdmin" ||
          formData.role === "AcademicAdmin" ||
          formData.role === "NewgenAdmin" ||
          formData.role === "PlacementAdmin"
        ? [
            {
              label: "Department",
              name: "Deptid",
              type: "select",
              options: filteredDepartments.map((d) => ({ value: d.Deptid, label: d.Deptname })),
              placeholder: "Select Department",
              required: true,
              disabled: user?.role === "DeptAdmin"
            },
          ]
        : [];

    return [...commonFields, ...roleSpecificFields];
  }, [formData.role, formData.course, filteredDepartments, filteredStaffs, user]);

  const midPoint = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, midPoint);
  const rightFields = fields.slice(midPoint);

  if (availableRoles.length === 0 && user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to add users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden fixed left-60 right-10 top-12">
      <div className="flex-1 p-6 overflow-auto">
        <form
          onSubmit={onSubmitHandler}
          className="mx-auto w-full max-w-4xl h-[calc(100vh-3rem)] overflow-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <p className="text-2xl font-semibold text-gray-800">
              Add New User
              {user?.role === "DeptAdmin" && (
                <span className="text-sm text-gray-500 ml-2">
                  (Limited to {filteredDepartments[0]?.Deptname})
                </span>
              )}
            </p>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all flex items-center"
                disabled={loading}
              >
                <FaUndo className="text-lg" />
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin text-lg mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus className="text-lg mr-2" />
                    Add User
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 border border-gray-200 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-700">
              <div className="space-y-4">
                <FormField
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={onChangeHandler}
                  type="select"
                  options={availableRoles}
                  required
                  placeholder="Select User Role"
                />
                {leftFields.map((field) => (
                  <FormField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={onChangeHandler}
                    type={field.type}
                    options={field.options}
                    required={field.required}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                  />
                ))}
              </div>

              <div className="space-y-4">
                {rightFields.map((field) => (
                  <FormField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={onChangeHandler}
                    type={field.type}
                    options={field.options}
                    required={field.required}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                  />
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;