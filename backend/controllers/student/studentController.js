import StudentDetails from "../../models/StudentDetails.js";
import User from "../../models/User.js";
import Department from "../../models/Department.js";

import BankDetails from "../../models/BankDetails.js";
import RelationDetails from "../../models/RelationDetails.js";

import { Sequelize } from "sequelize";
import { sequelize } from "../../config/mysql.js"; // Import the Sequelize instance from your database config



export const getStudentDetails = async (req, res) => {
    try {
      const userId = req.user.Userid; // Extracted from token middleware
  
      const student = await StudentDetails.findOne({
        where: { Userid: userId },
        include: [
          { 
            model: User, 
            as: "studentUser", 
            attributes: ["Userid", "username", "email", "role", "status"], 
            include: [
              { 
                model: BankDetails, 
                as: "bankDetails", 
                attributes: ["bank_name", "branch_name","address","account_type", "account_no", "ifsc_code","micr_code"] 
              },
              { 
                model: RelationDetails, 
                as: "relationDetails", 
                attributes: ["relationship", "relation_name", "relation_age", "relation_qualification","relation_occupation","relation_phone","relation_email","relation_photo","relation_income"] ,
                order: [['id', 'ASC']], 
                separate:true,
              },
              { 
                model: Department,  // Fetch Department directly without alias
                attributes: ["Deptid", "Deptname"]
              }
            ]
          },
          { 
            model: User,  // Fetch staff details using staffId
            as: "staffAdvisor", 
            attributes: ["username"]
          }
        ]
      });
       //console.log(student)
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
  
      res.json(student); // Send full details
    } catch (error) {
      console.error("Error fetching student details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  
  export const updateStudentDetails = async (req, res) => {
    const transaction = await sequelize.transaction(); // Start a transaction
    try {
      const userId = req.user.Userid;
      if (!userId) {
        return res.status(400).json({ message: "Missing Userid in token" });
      }
  
      console.log("🔹 Received data at backend:", JSON.stringify(req.body, null, 2));
  
      let { username, email, studentUser, relations = [], ...otherFields } = req.body;
  
      // Convert empty fields to `null`
      Object.keys(otherFields).forEach((key) => {
        if (otherFields[key] === "") {
          otherFields[key] = null;
        }
      });
  
      console.log("🔹 Cleaned data before update:", otherFields);
  
      // Find student and user by Userid
      const student = await StudentDetails.findOne({ where: { Userid: userId }, transaction });
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      const user = await User.findOne({ where: { Userid: userId }, transaction });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      console.log("🔹 Found Student & User. Updating details...");
  
      // ✅ Update student & user data
      await student.update(otherFields, { transaction });
      await user.update({ username, email }, { transaction });
  
      // Extract bank details (check both top-level and nested inside studentUser)
const bankDetails = req.body.studentUser?.bankDetails || {
  bank_name: req.body.bank_name,
  branch_name: req.body.branch_name,
  address: req.body.bank_address,
  account_type: req.body.account_type,
  account_no: req.body.account_no,
  ifsc_code: req.body.ifsc_code,
  micr_code: req.body.micr_code,
};

// Update bank details if provided
if (bankDetails?.bank_name) {
  console.log("🔹 Updating bank details in separate table...", bankDetails);

  const existingBankDetails = await BankDetails.findOne({ where: { Userid: userId } });

  if (existingBankDetails) {
    await existingBankDetails.update(bankDetails);
    console.log("✅ Bank details updated successfully!");
  } else {
    await BankDetails.create({ Userid: userId, ...bankDetails });
    console.log("✅ New bank details added!");
  }
} else {
  console.log("⚠️ No bank details provided. Skipping update.");
}

      
  
      // ✅ Update Relation Details
      if (relations.length > 0) {
        console.log("🔹 Updating relation details in separate table...");
  
        for (const relation of relations) {
          const existingRelation = await RelationDetails.findOne({
            where: { Userid: userId, relationship: relation.relationship },
           
            transaction,
          });
  
          if (existingRelation) {
            await existingRelation.update(
              {
                relation_name: relation.name,
                relation_phone: relation.phone,
                relation_email: relation.email||null,
                relation_occupation: relation.occupation,
                relation_qualification: relation.qualification,
                relation_age: relation.age,
                relation_income: relation.income,
                relation_photo: relation.relation_photo || null,
              },
              { transaction }
            );
            console.log(`✅ Relation details updated for ${relation.relationship}!`);
          } else {
            await RelationDetails.create(
              {
                Userid: userId,
                relationship: relation.relationship,
                relation_name: relation.name,
                relation_phone: relation.phone,
                relation_email: relation.email||null,
                relation_occupation: relation.occupation,
                relation_qualification: relation.qualification,
                relation_age: relation.age,
                relation_income: relation.income,
                relation_photo: relation.relation_photo || null,
              },
              { transaction }
            );
            console.log(`✅ New relation details added for ${relation.relationship}!`);
          }
        }
      } else {
        console.log("⚠️ No relation details provided. Skipping update.");
      }
  
      // ✅ Commit the transaction
      await transaction.commit();
      console.log("✅ Update successful!");
      res.status(200).json({ message: "Updated successfully" });
  
    } catch (error) {
      await transaction.rollback(); // Rollback transaction in case of error
      console.error("❌ Error updating student details:", error);
      res.status(500).json({ message: "Internal server error", error });
    }
  };
  