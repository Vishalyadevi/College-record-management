// certificateController.js
import { pool } from "../../db/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all certificates for a user
export const getCertificates = async (req, res) => {
  const { UserId } = req.query;

  try {
    const [certificates] = await pool.query(
      `SELECT * FROM certificates WHERE user_id = ? ORDER BY upload_date DESC`,
      [UserId]
    );

    res.status(200).json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates", error: error.message });
  }
};

// Upload certificate
export const uploadCertificate = async (req, res) => {
  const { category, certificateType, UserId } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = `uploads/certificates/${file.filename}`;
    
    const [result] = await pool.query(
      `INSERT INTO certificates (user_id, category, certificate_type, file_name, file_path, upload_date) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [UserId, category, certificateType, file.originalname, filePath]
    );

    const [newCertificate] = await pool.query(
      `SELECT * FROM certificates WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(newCertificate[0]);
  } catch (error) {
    console.error("Error uploading certificate:", error);
    
    // Delete file if database insertion fails
    if (file) {
      const filePath = path.join(__dirname, "../../uploads/certificates", file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: "Failed to upload certificate", error: error.message });
  }
};

// Delete certificate
export const deleteCertificate = async (req, res) => {
  const { id } = req.params;

  try {
    // Get file path before deletion
    const [certificate] = await pool.query(
      `SELECT file_path FROM certificates WHERE id = ?`,
      [id]
    );

    if (certificate.length === 0) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Delete from database
    await pool.query(`DELETE FROM certificates WHERE id = ?`, [id]);

    // Delete file from filesystem
    const filePath = path.join(__dirname, "../../", certificate[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({ message: "Failed to delete certificate", error: error.message });
  }
};