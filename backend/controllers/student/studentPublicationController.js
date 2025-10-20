// controllers/student/studentPublicationController.js
import { User, StudentDetails, StudentPublication } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";
import { Op } from "sequelize";

// ========================
// MAIN PUBLICATION ENDPOINTS
// ========================

// Add new publication
export const addPublication = async (req, res) => {
  try {
    const {
      Userid,
      publication_type,
      publication_name,
      title,
      authors,
      index_type,
      doi,
      publisher,
      page_no,
      publication_date,
      impact_factor,
      publication_link,
      pdf_link,
      preprint_link,
      publication_status,
      abstract,
      keywords,
      volume,
      issue,
      journal_abbreviation,
      issn,
      isbn,
      contribution_description,
      corresponding_author,
      first_author,
    } = req.body;

    // Validate required fields
    if (!Userid || !publication_type || !title) {
      return res.status(400).json({ message: "Publication type, title, and Userid are required" });
    }

    // Validate publication type
    const validTypes = [
      'Journal',
      'Conference',
      'Book',
      'Book Chapter',
      'Workshop',
      'Thesis',
      'Preprint',
      'White Paper',
      'Patent',
      'Other',
    ];
    if (!validTypes.includes(publication_type)) {
      return res.status(400).json({ message: "Invalid publication type" });
    }

    // Validate index type
    const validIndexTypes = [
      'Scopus',
      'Web of Science',
      'PubMed',
      'IEEE Xplore',
      'ACM Digital Library',
      'SSRN',
      'Not Indexed',
      'Other',
    ];
    if (index_type && !validIndexTypes.includes(index_type)) {
      return res.status(400).json({ message: "Invalid index type" });
    }

    // Validate status
    const validStatuses = ['Draft', 'Under Review', 'Accepted', 'Published', 'Rejected', 'Withdrawn'];
    if (publication_status && !validStatuses.includes(publication_status)) {
      return res.status(400).json({ message: "Invalid publication status" });
    }

    // Validate URLs
    if (publication_link && !isValidUrl(publication_link)) {
      return res.status(400).json({ message: "Invalid publication link URL" });
    }
    if (pdf_link && !isValidUrl(pdf_link)) {
      return res.status(400).json({ message: "Invalid PDF link URL" });
    }
    if (preprint_link && !isValidUrl(preprint_link)) {
      return res.status(400).json({ message: "Invalid preprint link URL" });
    }

    // Validate impact factor
    if (impact_factor && impact_factor < 0) {
      return res.status(400).json({ message: "Impact factor cannot be negative" });
    }

    // Fetch user
    const user = await User.findByPk(Userid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });

    // Parse authors if provided as string
    let parsedAuthors = authors;
    if (typeof authors === 'string') {
      try {
        parsedAuthors = JSON.parse(authors);
      } catch (e) {
        return res.status(400).json({ message: "Authors must be a valid JSON array" });
      }
    }

    // Parse keywords if provided as string
    let parsedKeywords = keywords;
    if (typeof keywords === 'string') {
      try {
        parsedKeywords = JSON.parse(keywords);
      } catch (e) {
        return res.status(400).json({ message: "Keywords must be a valid JSON array" });
      }
    }

    // Create publication
    const publication = await StudentPublication.create({
      Userid,
      publication_type,
      publication_name,
      title,
      authors: parsedAuthors || [],
      index_type: index_type || 'Not Indexed',
      doi,
      publisher,
      page_no,
      publication_date,
      impact_factor,
      publication_link,
      pdf_link,
      preprint_link,
      publication_status: publication_status || 'Draft',
      status_date: new Date(),
      abstract,
      keywords: parsedKeywords || [],
      volume,
      issue,
      journal_abbreviation,
      issn,
      isbn,
      contribution_description,
      corresponding_author: corresponding_author || false,
      first_author: first_author || false,
      pending: true,
      tutor_verification_status: false,
      Created_by: Userid,
      Updated_by: Userid,
    });

    // Send email to tutor
    if (student && student.tutorEmail) {
      const authorsStr = Array.isArray(parsedAuthors) ? parsedAuthors.join(', ') : 'N/A';
      const emailText = `Dear Tutor,\n\nA student has submitted a new publication for verification.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nPublication Details:\nType: ${publication_type}\nTitle: ${title}\nAuthors: ${authorsStr}\nStatus: ${publication_status || 'Draft'}\nDOI: ${doi || "N/A"}\nPublisher: ${publisher || "N/A"}\nImpact Factor: ${impact_factor || "N/A"}\nIndex Type: ${index_type || "Not Indexed"}\nPublication Date: ${publication_date || "N/A"}\n\nThe publication is pending your verification.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "New Publication Submitted - Pending Verification",
        text: emailText,
      });
    }

    res.status(201).json({
      message: "Publication submitted successfully",
      publication,
    });
  } catch (error) {
    console.error("❌ Error adding publication:", error);
    res.status(500).json({ message: "Error adding publication", error: error.message });
  }
};

// Update publication
export const updatePublication = async (req, res) => {
  const { id } = req.params;
  const {
    publication_type,
    publication_name,
    title,
    authors,
    index_type,
    doi,
    publisher,
    page_no,
    publication_date,
    impact_factor,
    publication_link,
    pdf_link,
    preprint_link,
    publication_status,
    abstract,
    keywords,
    volume,
    issue,
    journal_abbreviation,
    issn,
    isbn,
    contribution_description,
    corresponding_author,
    first_author,
    Userid,
  } = req.body;

  try {
    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check authorization
    if (publication.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this publication" });
    }

    // Validate enums if provided
    const validTypes = [
      'Journal',
      'Conference',
      'Book',
      'Book Chapter',
      'Workshop',
      'Thesis',
      'Preprint',
      'White Paper',
      'Patent',
      'Other',
    ];
    const validIndexTypes = [
      'Scopus',
      'Web of Science',
      'PubMed',
      'IEEE Xplore',
      'ACM Digital Library',
      'SSRN',
      'Not Indexed',
      'Other',
    ];
    const validStatuses = ['Draft', 'Under Review', 'Accepted', 'Published', 'Rejected', 'Withdrawn'];

    if (publication_type && !validTypes.includes(publication_type)) {
      return res.status(400).json({ message: "Invalid publication type" });
    }
    if (index_type && !validIndexTypes.includes(index_type)) {
      return res.status(400).json({ message: "Invalid index type" });
    }
    if (publication_status && !validStatuses.includes(publication_status)) {
      return res.status(400).json({ message: "Invalid publication status" });
    }

    // Validate URLs
    if (publication_link && !isValidUrl(publication_link)) {
      return res.status(400).json({ message: "Invalid publication link URL" });
    }
    if (pdf_link && !isValidUrl(pdf_link)) {
      return res.status(400).json({ message: "Invalid PDF link URL" });
    }
    if (preprint_link && !isValidUrl(preprint_link)) {
      return res.status(400).json({ message: "Invalid preprint link URL" });
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });

    // Parse authors if provided as string
    let parsedAuthors = authors;
    if (authors && typeof authors === 'string') {
      try {
        parsedAuthors = JSON.parse(authors);
      } catch (e) {
        return res.status(400).json({ message: "Authors must be a valid JSON array" });
      }
    }

    // Parse keywords if provided as string
    let parsedKeywords = keywords;
    if (keywords && typeof keywords === 'string') {
      try {
        parsedKeywords = JSON.parse(keywords);
      } catch (e) {
        return res.status(400).json({ message: "Keywords must be a valid JSON array" });
      }
    }

    // Update fields
    publication.publication_type = publication_type ?? publication.publication_type;
    publication.publication_name = publication_name ?? publication.publication_name;
    publication.title = title ?? publication.title;
    publication.authors = parsedAuthors ?? publication.authors;
    publication.index_type = index_type ?? publication.index_type;
    publication.doi = doi ?? publication.doi;
    publication.publisher = publisher ?? publication.publisher;
    publication.page_no = page_no ?? publication.page_no;
    publication.publication_date = publication_date ?? publication.publication_date;
    publication.impact_factor = impact_factor ?? publication.impact_factor;
    publication.publication_link = publication_link ?? publication.publication_link;
    publication.pdf_link = pdf_link ?? publication.pdf_link;
    publication.preprint_link = preprint_link ?? publication.preprint_link;
    publication.publication_status = publication_status ?? publication.publication_status;
    publication.status_date = publication_status ? new Date() : publication.status_date;
    publication.abstract = abstract ?? publication.abstract;
    publication.keywords = parsedKeywords ?? publication.keywords;
    publication.volume = volume ?? publication.volume;
    publication.issue = issue ?? publication.issue;
    publication.journal_abbreviation = journal_abbreviation ?? publication.journal_abbreviation;
    publication.issn = issn ?? publication.issn;
    publication.isbn = isbn ?? publication.isbn;
    publication.contribution_description = contribution_description ?? publication.contribution_description;
    publication.corresponding_author = corresponding_author ?? publication.corresponding_author;
    publication.first_author = first_author ?? publication.first_author;
    publication.Updated_by = Userid;
    publication.pending = true;
    publication.tutor_verification_status = false;
    publication.Verified_by = null;
    publication.verified_at = null;

    await publication.save();

    // Send update email to tutor
    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nA student has updated their publication details.\n\nStudent: ${user?.username || "N/A"}\nRegno: ${student.regno}\n\nPublication:\nTitle: ${publication.title}\nType: ${publication.publication_type}\nStatus: ${publication.publication_status}\n\nThe publication is now pending re-verification.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        from: user?.email,
        to: student.tutorEmail,
        subject: "Publication Updated - Requires Re-verification",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Publication updated successfully",
      publication,
    });
  } catch (error) {
    console.error("❌ Error updating publication:", error);
    res.status(500).json({ message: "Error updating publication", error: error.message });
  }
};

// Get student's publications
export const getStudentPublications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId },
      order: [["publication_date", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching student publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};

// Get pending publications
export const getPendingPublications = async (req, res) => {
  try {
    const publications = await StudentPublication.findAll({
      where: { pending: true },
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedPublications = publications.map((pub) => {
      const { organizer, ...rest } = pub.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.email || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
      };
    });

    res.status(200).json({ success: true, count: formattedPublications.length, publications: formattedPublications });
  } catch (error) {
    console.error("Error fetching pending publications:", error);
    res.status(500).json({ message: "Error fetching pending publications" });
  }
};

// Get verified publications
export const getVerifiedPublications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { tutor_verification_status: true, Userid: userId },
      order: [["verified_at", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching verified publications:", error);
    res.status(500).json({ message: "Error fetching verified publications" });
  }
};

// Verify publication
export const verifyPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid, verification_comments } = req.body;

    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    publication.tutor_verification_status = true;
    publication.pending = false;
    publication.Verified_by = Userid;
    publication.verified_at = new Date();
    publication.verification_comments = verification_comments || null;

    await publication.save();

    // Send verification email to student
    const user = await User.findByPk(publication.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour publication has been verified.\n\nPublication: ${publication.title}\nType: ${publication.publication_type}\nStatus: ${publication.publication_status}\n\nComments: ${verification_comments || "None"}\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        to: user.email,
        subject: "Publication Verified",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Publication verified successfully", publication });
  } catch (error) {
    console.error("❌ Error verifying publication:", error);
    res.status(500).json({ message: "Error verifying publication", error: error.message });
  }
};

// Delete publication
export const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const { Userid } = req.body;

    const publication = await StudentPublication.findByPk(id);
    if (!publication) {
      return res.status(404).json({ message: "Publication not found" });
    }

    // Check authorization
    if (publication.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to delete this publication" });
    }

    const user = await User.findByPk(publication.Userid);
    const student = await StudentDetails.findOne({ where: { Userid: publication.Userid } });

    await publication.destroy();

    // Send deletion notification
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour publication has been deleted.\n\nTitle: ${publication.title}\n\nIf this was an error, please contact your tutor.\n\nBest Regards,\nPublication Management System`;

      await sendEmail({
        to: user.email,
        subject: "Publication Deleted",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Publication deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting publication:", error);
    res.status(500).json({ message: "Error deleting publication", error: error.message });
  }
};

// ========================
// ANALYTICS & STATISTICS
// ========================

// Get publication statistics
export const getPublicationStatistics = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId },
    });

    const stats = {
      totalPublications: publications.length,
      verifiedPublications: publications.filter(p => p.tutor_verification_status).length,
      publishedCount: publications.filter(p => p.publication_status === 'Published').length,
      byType: {},
      byIndexType: {},
      totalCitations: publications.reduce((sum, p) => sum + (p.citations_count || 0), 0),
      averageImpactFactor: publications.filter(p => p.impact_factor).length > 0
        ? (publications.reduce((sum, p) => sum + (parseFloat(p.impact_factor) || 0), 0) / publications.filter(p => p.impact_factor).length).toFixed(4)
        : 0,
      correspondingAuthorCount: publications.filter(p => p.corresponding_author).length,
      firstAuthorCount: publications.filter(p => p.first_author).length,
    };

    // Count by type
    publications.forEach(pub => {
      if (!stats.byType[pub.publication_type]) {
        stats.byType[pub.publication_type] = 0;
      }
      stats.byType[pub.publication_type]++;
    });

    // Count by index type
    publications.forEach(pub => {
      const indexType = pub.index_type || 'Not Indexed';
      if (!stats.byIndexType[indexType]) {
        stats.byIndexType[indexType] = 0;
      }
      stats.byIndexType[indexType]++;
    });

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching publication statistics:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};

// Get all publications (Admin/Tutor)
export const getAllPublications = async (req, res) => {
  try {
    const publications = await StudentPublication.findAll({
      include: [
        {
          model: User,
          as: "organizer",
          attributes: ["Userid", "username", "email"],
          include: [
            {
              model: StudentDetails,
              as: "studentDetails",
              attributes: ["regno", "staffId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formatted = publications.map((pub) => {
      const { organizer, ...rest } = pub.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        email: organizer?.email || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
      };
    });

    res.status(200).json({ success: true, count: formatted.length, publications: formatted });
  } catch (error) {
    console.error("Error fetching all publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};

// Search publications by type
export const searchByPublicationType = async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!type) {
      return res.status(400).json({ message: "Publication type is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId, publication_type: type },
      order: [["publication_date", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error searching publications:", error);
    res.status(500).json({ message: "Error searching publications" });
  }
};

// Get high impact publications
export const getHighImpactPublications = async (req, res) => {
  try {
    const { minImpactFactor = 2.0 } = req.query;
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: {
        Userid: userId,
        impact_factor: {
          [Op.gte]: parseFloat(minImpactFactor),
        },
      },
      order: [["impact_factor", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching high impact publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};

// Get indexed publications
export const getIndexedPublications = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: {
        Userid: userId,
        index_type: {
          [Op.ne]: 'Not Indexed',
        },
      },
      order: [["publication_date", "DESC"]],
    });

    res.status(200).json({ success: true, count: publications.length, publications });
  } catch (error) {
    console.error("Error fetching indexed publications:", error);
    res.status(500).json({ message: "Error fetching publications" });
  }
};

// Get publication metrics by year
export const getPublicationMetricsByYear = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId },
    });

    const metricsByYear = {};

    publications.forEach(pub => {
      if (pub.publication_date) {
        const year = new Date(pub.publication_date).getFullYear();
        if (!metricsByYear[year]) {
          metricsByYear[year] = {
            count: 0,
            published: 0,
            indexed: 0,
            highImpact: 0,
            totalCitations: 0,
          };
        }
        metricsByYear[year].count++;
        if (pub.publication_status === 'Published') metricsByYear[year].published++;
        if (pub.index_type !== 'Not Indexed') metricsByYear[year].indexed++;
        if (pub.impact_factor && pub.impact_factor >= 2.0) metricsByYear[year].highImpact++;
        metricsByYear[year].totalCitations += pub.citations_count || 0;
      }
    });

    res.status(200).json({ success: true, metricsByYear });
  } catch (error) {
    console.error("Error fetching metrics by year:", error);
    res.status(500).json({ message: "Error fetching metrics" });
  }
};

// Get publication portfolio
export const getPublicationPortfolio = async (req, res) => {
  try {
    const userId = req.user?.Userid || req.query.UserId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const publications = await StudentPublication.findAll({
      where: { Userid: userId, tutor_verification_status: true },
    });

    const portfolio = {
      totalPublications: publications.length,
      publishedCount: publications.filter(p => p.publication_status === 'Published').length,
      underReviewCount: publications.filter(p => p.publication_status === 'Under Review').length,
      acceptedCount: publications.filter(p => p.publication_status === 'Accepted').length,
      totalCitations: publications.reduce((sum, p) => sum + (p.citations_count || 0), 0),
      averageImpactFactor: publications.filter(p => p.impact_factor).length > 0
        ? (publications.reduce((sum, p) => sum + (parseFloat(p.impact_factor) || 0), 0) / publications.filter(p => p.impact_factor).length).toFixed(4)
        : 0,
      correspondingAuthorships: publications.filter(p => p.corresponding_author).length,
      firstAuthorships: publications.filter(p => p.first_author).length,
      indexedPublications: publications.filter(p => p.index_type !== 'Not Indexed').length,
      scopusIndexed: publications.filter(p => p.index_type === 'Scopus').length,
      webOfScienceIndexed: publications.filter(p => p.index_type === 'Web of Science').length,
      publicationsByType: {},
      recentPublications: publications.slice(0, 5),
    };

    publications.forEach(pub => {
      if (!portfolio.publicationsByType[pub.publication_type]) {
        portfolio.publicationsByType[pub.publication_type] = 0;
      }
      portfolio.publicationsByType[pub.publication_type]++;
    });

    res.status(200).json({ success: true, portfolio });
  } catch (error) {
    console.error("Error fetching publication portfolio:", error);
    res.status(500).json({ message: "Error fetching portfolio" });
  }
};

// Helper function to validate URLs
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}