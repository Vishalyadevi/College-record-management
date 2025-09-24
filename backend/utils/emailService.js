import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error("❌ Missing required environment variables: EMAIL_USER and EMAIL_PASS");
}

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email using Nodemailer.
 * @param {Object} mailOptions - Email details.
 * @param {string} mailOptions.from - Sender's email.
 * @param {string} mailOptions.to - Recipient's email.
 * @param {string} mailOptions.subject - Email subject.
 * @param {string} mailOptions.text - Plain text email content.
 * @param {string} mailOptions.html - HTML email content.
 * @param {Array} mailOptions.attachments - Email attachments.
 * @returns {Object} - Success or failure response.
 */
export const sendEmail = async ({ from, to, subject, text, html, attachments }) => {
  try {
    const mailOptions = {
      from: from || process.env.EMAIL_USER, // Use default sender if not provided
      to,
      subject,
      text, // Plain text body
      html, // HTML body
      attachments, // Array of attachments
    };

    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      throw new Error("❌ Missing required email fields: to, subject, and text/html");
    }

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);

    return { success: true, response: info.response };
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);

    return { success: false, error: error.message };
  }
};