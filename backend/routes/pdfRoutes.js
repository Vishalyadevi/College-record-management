const express = require('express');
const router = express.Router();
const { generateFacultyProfilePDF, fetchFacultyData } = require('../pdfGenerator');

/**
 * @route   GET /api/pdf/faculty-profile/:userId
 * @desc    Generate and download faculty profile PDF
 * @access  Private (add authentication middleware as needed)
 */
router.get('/faculty-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    // Generate PDF
    const pdfBuffer = await generateFacultyProfilePDF(parseInt(userId));

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=faculty_profile_${userId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.byteLength);

    // Send PDF buffer
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Handle specific errors
    if (error.message.includes('No data found')) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/pdf/preview-data/:userId
 * @desc    Preview faculty data before PDF generation (for debugging)
 * @access  Private
 */
router.get('/preview-data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID provided'
      });
    }

    const data = await fetchFacultyData(parseInt(userId));

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching faculty data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/pdf/faculty-profile
 * @desc    Generate PDF for current logged-in user (from session/token)
 * @access  Private
 */
router.post('/faculty-profile', async (req, res) => {
  try {
    // Assuming you have authentication middleware that sets req.user
    const userId = req.user?.Userid || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const pdfBuffer = await generateFacultyProfilePDF(userId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=my_faculty_profile.pdf`);
    res.setHeader('Content-Length', pdfBuffer.byteLength);

    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;