import React, { useState, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { FaPlus, FaSpinner, FaUndo } from "react-icons/fa";
import { useAppContext } from "../../contexts/AppContext";


const FormField = React.memo(({ label, name, value, onChange, type = "text", options = [], required = false, placeholder = "" }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="font-medium text-gray-700 mb-1">{label}</label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
});

const AddUser = () => {
  const { backendUrl, departments, staffs } = useAppContext();

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

  const focusedFieldRef = useRef(null);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
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
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...formData };

      const token = localStorage.getItem("token"); 
      if (!token) {
        toast.error("Unauthorized: Token not provided");
        setLoading(false);
        return;
      }
      if (payload.password !== payload.confirmPassword) {
        toast.error("Passwords do not match!");
        setLoading(false);
        return;
      }

    
      delete payload.confirmPassword;

      const response = await axios.post(
        `${backendUrl}/api/add-user`,
        { ...formData },
        {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      toast.success(response.data.message);
      resetForm(); 
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Memoize the fields to prevent unnecessary re-renders
  const fields = useMemo(() => {
    const commonFields = [
      { label: "Name", name: "username", type: "text", placeholder: "Enter Name", required: true },
      { label: "Email", name: "email", type: "email", placeholder: "Enter Email", required: true },
      { label: "Password", name: "password", type: "password", placeholder: "Enter Password", required: true },
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
                        ? departments
                            .filter((dep) => ["AIDS", "IT"].includes(dep.Deptacronym))
                            .map((d) => ({ value: d.Deptid, label: d.Deptname }))
                        : departments
                            .filter((dep) => ["CSE", "ECE", "EEE", "Civil", "Mech"].includes(dep.Deptacronym))
                            .map((d) => ({ value: d.Deptid, label: d.Deptname })),
                    placeholder: "Select Department",
                    required: true,
                  },
                ]
              : []),
            { label: "Batch", name: "batch", type: "text", placeholder: "Enter Batch", required: true },
            {
              label: "Tutor",
              name: "TutorId", 
              type: "select",
              options: staffs.map((s) => ({ value: s.id, label: s.name })), 
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
              options: departments.map((d) => ({ value: d.Deptid, label: d.Deptname })), // Show all departments for Staff
              placeholder: "Select Department",
              required: true,
            },
          ]
        : [];

    return [...commonFields, ...roleSpecificFields];
  }, [formData.role, formData.course, departments, staffs]);

  // Split fields into two columns for even distribution
  const midPoint = Math.ceil(fields.length / 2);
  const leftFields = fields.slice(0, midPoint);
  const rightFields = fields.slice(midPoint);

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-purple-50 to-blue-purple-100 overflow-hidden fixed left-60 right-10 top-12">
      <div className="flex-1 p-6 overflow-auto">
        <form
          onSubmit={onSubmitHandler}
          className="mx-auto w-full max-w-4xl h-[calc(100vh-3rem)] overflow-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <p className="text-2xl font-semibold text-blue-purple-800">Add User</p>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gradient-to-r from-blue-purple-500 to-blue-purple-600 text-white p-3 rounded-lg shadow-lg hover:from-blue-purple-600 hover:to-blue-purple-700 transition-all flex items-center"
              >
                <FaUndo className="text-lg" />
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-purple-500 to-blue-purple-600 text-white p-3 rounded-lg shadow-lg hover:from-blue-purple-600 hover:to-blue-purple-700 transition-all flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <FaSpinner className="animate-spin text-lg" />
                ) : (
                  <FaPlus className="text-lg" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white p-8 border border-blue-purple-200 rounded-lg shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-blue-purple-700">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={onChangeHandler}
                  type="select"
                  options={["Student", "Staff"]}
                  required
                  placeholder="Select Role"
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
                  />
                ))}
              </div>

              {/* Right Column */}
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