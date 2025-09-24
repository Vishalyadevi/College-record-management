import { BulkUploadHistory, DownloadHistory, User,Department } from "../../models/index.js";

// Fetch bulk upload history
export const getBulkHistory = async (req, res) => {
   
    
  try {
    const bulkHistory = await BulkUploadHistory.findAll({
      order: [["created_at", "DESC"]],
      include: [{ model: User, attributes: ["username"] }],
    });
   
    res.json(bulkHistory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bulk history", error });
  }
};

// Fetch file upload history
export const getUploadHistory = async (req, res) => {
  try {
    const uploadHistory = await DownloadHistory.findAll({
      order: [["created_at", "DESC"]],
      include: [{ model: User, attributes: ["username"] }], // Include user details
    });
    res.json(uploadHistory);
  } catch (error) {
    res.status(500).json({ message: "Error fetching upload history", error });
  }
};

// Fetch department-wise counts (students and staff)
export const getDepartmentWiseCounts = async (req, res) => {
  try {
    // Fetch all users with their department details
    const users = await User.findAll({
      attributes: ["role", "Deptid"], // Only fetch necessary fields
      include: [
        {
          model: Department,
          attributes: ["Deptname", "Deptacronym"], // Include department name and acronym
        },
      ],
    });

    // Calculate department-wise counts
    const departmentCounts = {};

    users.forEach((user) => {
      const deptAcronym = user.Department?.Deptacronym || "Unknown"; // Use department acronym or "Unknown" if not available
      const role = user.role; // Role can be "Student", "Staff", or "Admin"

      // Initialize the department object if it doesn't exist
      if (!departmentCounts[deptAcronym]) {
        departmentCounts[deptAcronym] = {
          students: 0,
          staff: 0,
        };
      }

      // Increment counts based on role
      if (role === "Student") {
        departmentCounts[deptAcronym].students += 1;
      } else if (role === "Staff") {
        departmentCounts[deptAcronym].staff += 1;
      }
    });

    // Convert the result to an array of objects for easier frontend consumption
    const result = Object.keys(departmentCounts).map((deptAcronym) => ({
      deptAcronym,
      students: departmentCounts[deptAcronym].students,
      staff: departmentCounts[deptAcronym].staff,
    }));

    //console.log(result);
    res.json(result); // Send the response as JSON
  } catch (error) {
    console.error("Error fetching department-wise counts:", error);
    res.status(500).json({ message: "Error fetching department-wise counts", error });
  }
};