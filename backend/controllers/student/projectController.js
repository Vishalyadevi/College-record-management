// controllers/student/projectController.js
import { User, StudentDetails, Project } from "../../models/index.js";
import { sendEmail } from "../../utils/emailService.js";

// Add a new project
export const addProject = async (req, res) => {
  try {
    const {
      title,
      domain,
      link,
      description,
      techstack,
      start_date,
      end_date,
      image_url,
      github_link,
      team_members,
      status,
      Userid,
    } = req.body;

    // Validate required fields
    if (!Userid || !title || !domain || !description) {
      return res.status(400).json({ message: "Title, domain, description, and Userid are required" });
    }

    // Validate domain enum
    const validDomains = [
      'Web Development',
      'Mobile Development',
      'Machine Learning',
      'Data Science',
      'Artificial Intelligence',
      'Cloud Computing',
      'IoT',
      'Blockchain',
      'Cybersecurity',
      'Game Development',
      'Desktop Application',
      'DevOps',
      'Other',
    ];

    if (!validDomains.includes(domain)) {
      return res.status(400).json({ message: "Invalid domain" });
    }

    // Validate status if provided
    const validStatuses = ['In Progress', 'Completed', 'On Hold', 'Archived'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid project status" });
    }

    // Validate URLs if provided
    if (link && !isValidUrl(link)) {
      return res.status(400).json({ message: "Invalid project link URL" });
    }
    if (github_link && !isValidUrl(github_link)) {
      return res.status(400).json({ message: "Invalid GitHub link URL" });
    }

    // Validate techstack is array
    let techs = techstack;
    if (typeof techstack === 'string') {
      try {
        techs = JSON.parse(techstack);
      } catch (e) {
        return res.status(400).json({ message: "Techstack must be a valid JSON array" });
      }
    }

    // Fetch user details
    const user = await User.findByPk(Userid);
    if (!user || !user.email) {
      return res.status(404).json({ message: "Student email not found" });
    }

    // Fetch student details
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!student || !student.tutorEmail) {
      return res.status(404).json({ message: "Tutor email not found" });
    }

    // Create project
    const project = await Project.create({
      Userid,
      title,
      domain,
      link: link || null,
      description,
      techstack: techs || [],
      start_date: start_date || null,
      end_date: end_date || null,
      image_url: image_url || null,
      github_link: github_link || null,
      team_members: team_members || 1,
      status: status || 'In Progress',
      pending: true,
      tutor_approval_status: false,
      Approved_by: null,
      approved_at: null,
      Created_by: user.Userid,
      Updated_by: user.Userid,
    });

    // Send email to tutor
    const techstackStr = Array.isArray(techs) ? techs.join(', ') : 'Not specified';
    const emailText = `Dear Tutor,\n\nA student has submitted a new project for your approval.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nProject Details:\nTitle: ${title}\nDomain: ${domain}\nDescription: ${description}\nTechstack: ${techstackStr}\nLink: ${link || "N/A"}\nGitHub Link: ${github_link || "N/A"}\nTeam Members: ${team_members || 1}\nStatus: ${status || "In Progress"}\nStart Date: ${start_date || "N/A"}\nEnd Date: ${end_date || "N/A"}\n\nThe project is currently pending your approval. Please review and approve or reject.\n\nBest Regards,\nProject Management System`;

    await sendEmail({
      from: user.email,
      to: student.tutorEmail,
      subject: "New Project Submitted - Pending Approval",
      text: emailText,
    });

    res.status(201).json({
      message: "Project submitted for approval. Tutor notified.",
      project,
    });
  } catch (error) {
    console.error("❌ Error adding project:", error);
    res.status(500).json({ message: "Error adding project", error: error.message });
  }
};

// Update project
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    domain,
    link,
    description,
    techstack,
    start_date,
    end_date,
    image_url,
    github_link,
    team_members,
    status,
    Userid,
  } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check authorization
    if (project.Userid !== parseInt(Userid)) {
      return res.status(403).json({ message: "Unauthorized to update this project" });
    }

    // Validate enums if provided
    const validDomains = [
      'Web Development',
      'Mobile Development',
      'Machine Learning',
      'Data Science',
      'Artificial Intelligence',
      'Cloud Computing',
      'IoT',
      'Blockchain',
      'Cybersecurity',
      'Game Development',
      'Desktop Application',
      'DevOps',
      'Other',
    ];
    const validStatuses = ['In Progress', 'Completed', 'On Hold', 'Archived'];

    if (domain && !validDomains.includes(domain)) {
      return res.status(400).json({ message: "Invalid domain" });
    }
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid project status" });
    }

    // Validate URLs if provided
    if (link && !isValidUrl(link)) {
      return res.status(400).json({ message: "Invalid project link URL" });
    }
    if (github_link && !isValidUrl(github_link)) {
      return res.status(400).json({ message: "Invalid GitHub link URL" });
    }

    const user = await User.findByPk(Userid);
    const student = await StudentDetails.findOne({ where: { Userid } });
    if (!user || !student) {
      return res.status(404).json({ message: "User or Student details not found" });
    }

    // Parse techstack if provided as string
    let techs = techstack;
    if (techstack) {
      if (typeof techstack === 'string') {
        try {
          techs = JSON.parse(techstack);
        } catch (e) {
          return res.status(400).json({ message: "Techstack must be a valid JSON array" });
        }
      }
    }

    // Update fields
    project.title = title ?? project.title;
    project.domain = domain ?? project.domain;
    project.link = link ?? project.link;
    project.description = description ?? project.description;
    project.techstack = techs ?? project.techstack;
    project.start_date = start_date ?? project.start_date;
    project.end_date = end_date ?? project.end_date;
    project.image_url = image_url ?? project.image_url;
    project.github_link = github_link ?? project.github_link;
    project.team_members = team_members ?? project.team_members;
    project.status = status ?? project.status;
    project.Updated_by = Userid;
    project.pending = true;
    project.tutor_approval_status = false;
    project.Approved_by = null;
    project.approved_at = null;

    await project.save();

    // Send update email to tutor
    if (student.tutorEmail) {
      const techstackStr = Array.isArray(project.techstack) ? project.techstack.join(', ') : 'Not specified';
      const emailText = `Dear Tutor,\n\nA student has updated their project details.\n\nStudent Details:\nRegno: ${student.regno}\nName: ${user.username || "N/A"}\n\nUpdated Project Details:\nTitle: ${project.title}\nDomain: ${project.domain}\nDescription: ${project.description}\nTechstack: ${techstackStr}\nStatus: ${project.status}\n\nThis project is now pending approval. Please review the updated details.\n\nBest Regards,\nProject Management System`;

      await sendEmail({
        from: user.email,
        to: student.tutorEmail,
        subject: "Project Updated - Requires Review",
        text: emailText,
      });
    }

    res.status(200).json({
      message: "Project updated successfully. Tutor notified.",
      project,
    });
  } catch (error) {
    console.error("❌ Error updating project:", error);
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};

// Get pending projects
export const getPendingProjects = async (req, res) => {
  try {
    const pendingProjects = await Project.findAll({
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

    const formattedProjects = pendingProjects.map((project) => {
      const { organizer, ...rest } = project.get({ plain: true });
      return {
        ...rest,
        username: organizer?.username || "N/A",
        regno: organizer?.studentDetails?.regno || "N/A",
        staffId: organizer?.studentDetails?.staffId || "N/A",
      };
    });

    res.status(200).json({ success: true, projects: formattedProjects });
  } catch (error) {
    console.error("Error fetching pending projects:", error.message);
    res.status(500).json({ success: false, message: "Error fetching pending projects" });
  }
};

// Get approved projects
export const getApprovedProjects = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const approvedProjects = await Project.findAll({
      where: { tutor_approval_status: true, Userid: userId },
      order: [["approved_at", "DESC"]],
    });

    return res.status(200).json({ success: true, projects: approvedProjects });
  } catch (error) {
    console.error("Error fetching approved projects:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Approve project
export const approveProject = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments, rating } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    project.tutor_approval_status = true;
    project.pending = false;
    project.Approved_by = Userid;
    project.approved_at = new Date();
    project.comments = comments || null;
    project.rating = rating || null;

    await project.save();

    // Send approval email to student
    const user = await User.findByPk(project.Userid);
    if (user && user.email) {
      const techstackStr = Array.isArray(project.techstack) ? project.techstack.join(', ') : 'Not specified';
      const emailText = `Dear ${user.username},\n\nYour project has been approved!\n\nProject: ${project.title}\nDomain: ${project.domain}\nTechstack: ${techstackStr}\nRating: ${rating ? rating + '/5' : "Not rated"}\n\nComments: ${comments || "None"}\n\nWell done on your excellent work!\n\nBest Regards,\nProject Management System`;

      await sendEmail({
        to: user.email,
        subject: "Project Approved Successfully",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Project approved successfully", project });
  } catch (error) {
    console.error("❌ Error approving project:", error);
    res.status(500).json({ message: "Error approving project", error: error.message });
  }
};

// Reject project
export const rejectProject = async (req, res) => {
  const { id } = req.params;
  const { Userid, comments } = req.body;

  try {
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.tutor_approval_status = false;
    project.pending = false;
    project.Approved_by = Userid;
    project.approved_at = new Date();
    project.comments = comments || "Rejected";

    await project.save();

    // Send rejection email to student
    const user = await User.findByPk(project.Userid);
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour project has been rejected.\n\nProject: ${project.title}\nDomain: ${project.domain}\n\nReason: ${comments || "No comments provided"}\n\nYou can update and resubmit your project after making necessary changes.\n\nBest Regards,\nProject Management System`;

      await sendEmail({
        to: user.email,
        subject: "Project Rejected - Please Review",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Project rejected successfully", project });
  } catch (error) {
    console.error("❌ Error rejecting project:", error);
    res.status(500).json({ message: "Error rejecting project", error: error.message });
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const student = await StudentDetails.findOne({ where: { Userid: project.Userid } });
    const user = await User.findByPk(project.Userid);

    await project.destroy();

    // Send deletion notification to student
    if (user && user.email) {
      const emailText = `Dear ${user.username},\n\nYour project has been deleted.\n\nProject Title: ${project.title}\nDomain: ${project.domain}\n\nIf this was an error, please contact your tutor.\n\nBest Regards,\nProject Management System`;

      await sendEmail({
        to: user.email,
        subject: "Project Deleted Notification",
        text: emailText,
      });
    }

    // Send deletion notification to tutor
    if (student && student.tutorEmail) {
      const emailText = `Dear Tutor,\n\nThe following project has been deleted:\n\nStudent: ${user?.username || "N/A"}\nRegno: ${student.regno}\nProject: ${project.title}\nDomain: ${project.domain}\n\nBest Regards,\nProject Management System`;

      await sendEmail({
        to: student.tutorEmail,
        subject: "Project Deleted Notification",
        text: emailText,
      });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};

// Get all projects for a student
export const getStudentProjects = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching student projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get projects by domain
export const getProjectsByDomain = async (req, res) => {
  const { domain } = req.params;
  const userId = req.user?.Userid || req.query.UserId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId, domain },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("Error fetching projects by domain:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get project statistics
export const getProjectStatistics = async (req, res) => {
  const userId = req.user?.Userid || req.query.UserId;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const projects = await Project.findAll({
      where: { Userid: userId, tutor_approval_status: true },
    });

    const stats = {
      totalProjects: projects.length,
      completedProjects: projects.filter(p => p.status === 'Completed').length,
      inProgressProjects: projects.filter(p => p.status === 'In Progress').length,
      onHoldProjects: projects.filter(p => p.status === 'On Hold').length,
      archivedProjects: projects.filter(p => p.status === 'Archived').length,
      averageRating: projects.filter(p => p.rating).length > 0
        ? (projects.reduce((sum, p) => sum + (p.rating || 0), 0) / projects.filter(p => p.rating).length).toFixed(2)
        : 0,
      byDomain: {},
      topTechnologies: {},
    };

    // Count by domain
    projects.forEach(project => {
      if (!stats.byDomain[project.domain]) {
        stats.byDomain[project.domain] = 0;
      }
      stats.byDomain[project.domain]++;
    });

    // Count technologies
    projects.forEach(project => {
      if (Array.isArray(project.techstack)) {
        project.techstack.forEach(tech => {
          if (!stats.topTechnologies[tech]) {
            stats.topTechnologies[tech] = 0;
          }
          stats.topTechnologies[tech]++;
        });
      }
    });

    res.status(200).json({ success: true, statistics: stats });
  } catch (error) {
    console.error("Error fetching project statistics:", error);
    res.status(500).json({ message: "Internal server error" });
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