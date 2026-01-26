import StudentDetails from "../../models/StudentDetails.js";
import User from "../../models/User.js";
import Department from "../../models/Department.js";
import BankDetails from "../../models/BankDetails.js";
import RelationDetails from "../../models/RelationDetails.js";
import { sequelize } from "../../config/mysql.js";

export const getStudentDetails = async (req, res) => {
  try {
    const userId = req.user.Userid;
    console.log("📌 Fetching student details for Userid:", userId);

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
              attributes: ["bank_name", "branch_name", "address", "account_type", "account_no", "ifsc_code", "micr_code"],
              required: false
            },
            { 
              model: RelationDetails, 
              as: "relationDetails", 
              attributes: ["id", "relationship", "relation_name", "relation_age", "relation_qualification", "relation_occupation", "relation_phone", "relation_email", "relation_photo", "relation_income"],
              separate: true,
              order: [['id', 'ASC']],
              required: false
            },
            { 
              model: Department,
              attributes: ["Deptid", "Deptname"],
              required: false
            }
          ]
        },
        { 
          model: User,
          as: "staffAdvisor", 
          attributes: ["username"],
          required: false
        }
      ]
    });

    if (!student) {
      console.log("❌ Student not found for Userid:", userId);
      return res.status(404).json({ message: "Student not found" });
    }

    console.log("✅ Student details fetched successfully");
    res.json(student);
  } catch (error) {
    console.error("❌ Error fetching student details:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};

export const updateStudentDetails = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.Userid;
    if (!userId) {
      await transaction.rollback();
      return res.status(400).json({ message: "Missing Userid in token" });
    }

    console.log("📝 Updating student details for Userid:", userId);
    console.log("📝 Received data:", JSON.stringify(req.body, null, 2));

    const { 
      username, 
      email, 
      relations = [],
      bank_name,
      branch_name,
      bank_address,
      account_type,
      account_no,
      ifsc_code,
      micr_code,
      ...studentFields 
    } = req.body;

    // Find student
    const student = await StudentDetails.findOne({ 
      where: { Userid: userId }, 
      transaction 
    });
    
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ message: "Student not found" });
    }

    // Find user
    const user = await User.findOne({ 
      where: { Userid: userId }, 
      transaction 
    });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Map frontend field names to database column names
    const mappedFields = {};
    
    // Only include fields that exist in the database
    const allowedFields = [
      'batch', 'Semester', 'section', 'tutorEmail', 'date_of_birth',
      'personal_email', 'personal_phone', 'aadhar_card_no', 'mother_tongue',
      'caste', 'city', 'address', 'pincode', 'first_graduate', 'blood_group',
      'student_type', 'religion', 'community', 'gender', 'seat_type'
    ];

    allowedFields.forEach(field => {
      if (studentFields.hasOwnProperty(field)) {
        // Convert empty strings to null
        mappedFields[field] = studentFields[field] === "" ? null : studentFields[field];
      }
    });

    console.log("📝 Mapped fields for update:", mappedFields);

    // Update student details
    if (Object.keys(mappedFields).length > 0) {
      await student.update(mappedFields, { transaction });
      console.log("✅ Student details updated");
    }

    // Update user details
    const userUpdates = {};
    if (username && username !== user.username) userUpdates.username = username;
    if (email && email !== user.email) userUpdates.email = email;

    if (Object.keys(userUpdates).length > 0) {
      await user.update(userUpdates, { transaction });
      console.log("✅ User details updated");
    }

    // Update or create bank details
    if (bank_name) {
      const bankData = {
        bank_name,
        branch_name: branch_name || null,
        address: bank_address || null,
        account_type: account_type || 'Savings',
        account_no: account_no || null,
        ifsc_code: ifsc_code || null,
        micr_code: micr_code || null
      };

      const existingBankDetails = await BankDetails.findOne({ 
        where: { Userid: userId },
        transaction 
      });

      if (existingBankDetails) {
        await existingBankDetails.update(bankData, { transaction });
        console.log("✅ Bank details updated");
      } else {
        await BankDetails.create({ 
          Userid: userId, 
          ...bankData 
        }, { transaction });
        console.log("✅ Bank details created");
      }
    }

    // Update or create relation details
    if (relations && relations.length > 0) {
      console.log("📝 Processing", relations.length, "relations");

      for (const relation of relations) {
        if (!relation.relationship || relation.relationship === "") {
          console.log("⚠️ Skipping relation with empty relationship");
          continue;
        }

        const relationData = {
          relation_name: relation.name || null,
          relation_phone: relation.phone || null,
          relation_email: relation.email || null,
          relation_occupation: relation.occupation || null,
          relation_qualification: relation.qualification || null,
          relation_age: relation.age ? parseInt(relation.age) : null,
          relation_income: relation.income || '0',
          relation_photo: relation.photo || null
        };

        const existingRelation = await RelationDetails.findOne({
          where: { 
            Userid: userId, 
            relationship: relation.relationship 
          },
          transaction
        });

        if (existingRelation) {
          await existingRelation.update(relationData, { transaction });
          console.log(`✅ Relation updated: ${relation.relationship}`);
        } else {
          await RelationDetails.create({
            Userid: userId,
            relationship: relation.relationship,
            ...relationData
          }, { transaction });
          console.log(`✅ Relation created: ${relation.relationship}`);
        }
      }
    }

    await transaction.commit();
    console.log("✅ All updates committed successfully");
    
    res.status(200).json({ 
      message: "Student details updated successfully" 
    });

  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error updating student details:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};