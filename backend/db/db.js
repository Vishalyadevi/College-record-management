import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Vishal2005#',
  database: process.env.DB_NAME || 'college_records'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

testConnection();
initializeDatabase();

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Initialize database (create tables if they don't exist)
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    // Create department table to match Sequelize model (without autoIncrement since Sequelize model doesn't have it)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS department (
        Deptid INT PRIMARY KEY,
        Deptname VARCHAR(100) NOT NULL,
        Deptacronym VARCHAR(10) NOT NULL
      )
    `);

    // Insert default departments if they don't exist (with manual IDs since no autoIncrement)
    await connection.query(`
      INSERT IGNORE INTO department (Deptid, Deptname, Deptacronym) VALUES 
      (1, 'Computer Science Engineering', 'CSE'),
      (2, 'Information Technology', 'IT'),
      (3, 'Electronics and Communication Engineering', 'ECE'),
      (4, 'Mechanical Engineering', 'MECH'),
      (5, 'Civil Engineering', 'CIVIL'),
      (6, 'Electrical and Electronics Engineering', 'EEE')
    `);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        Userid INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('Student', 'Staff', 'Admin') NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        staffId INT UNIQUE,
        Deptid INT NOT NULL,
        image VARCHAR(500) DEFAULT '/uploads/default.jpg',
        resetPasswordToken VARCHAR(255),
        resetPasswordExpires DATETIME,
        skillrackProfile VARCHAR(255),
        Created_by INT,
        Updated_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Foreign key constraints
        CONSTRAINT fk_user_department FOREIGN KEY (Deptid) REFERENCES department(Deptid) ON DELETE RESTRICT,
        CONSTRAINT fk_user_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_user_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

     await connection.query(`
      CREATE TABLE IF NOT EXISTS student_education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    regno VARCHAR(50) NOT NULL,
    
    -- 10th & 12th Standard
    tenth_percentage DECIMAL(5,2),
    twelfth_percentage DECIMAL(5,2),
    
    -- UG Semester-wise GPA (from existing courses table)
    ug_sem1_gpa DECIMAL(3,2),
    ug_sem2_gpa DECIMAL(3,2),
    ug_sem3_gpa DECIMAL(3,2),
    ug_sem4_gpa DECIMAL(3,2),
    ug_sem5_gpa DECIMAL(3,2),
    ug_sem6_gpa DECIMAL(3,2),
    ug_sem7_gpa DECIMAL(3,2),
    ug_sem8_gpa DECIMAL(3,2),
    ug_cgpa DECIMAL(3,2),
    
    -- Arrears
    has_arrears ENUM('Yes', 'No') DEFAULT 'No',
    no_of_arrears INT DEFAULT 0,
    
    -- PG Details (if applicable)
    has_pg ENUM('Yes', 'No') DEFAULT 'No',
    pg_sem1_gpa DECIMAL(3,2),
    pg_sem2_gpa DECIMAL(3,2),
    pg_sem3_gpa DECIMAL(3,2),
    pg_sem4_gpa DECIMAL(3,2),
    pg_cgpa DECIMAL(3,2),
    
    -- System fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userid) REFERENCES users(Userid) ON DELETE CASCADE,
    INDEX idx_userid (userid),
    INDEX idx_regno (regno)
)
   `); 



    await connection.query(`
      CREATE TABLE IF NOT EXISTS personal_information (
        id INT PRIMARY KEY AUTO_INCREMENT,
        Userid INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE NOT NULL,
        age INT,
        gender ENUM('Male', 'Female', 'Other') NOT NULL,
        email VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(10) NOT NULL,
        communication_address TEXT NOT NULL,
        permanent_address TEXT NOT NULL,
        religion VARCHAR(100) NOT NULL,
        community VARCHAR(100) NOT NULL,
        caste VARCHAR(100) NOT NULL,
        post VARCHAR(255) NOT NULL,
        applied_date DATE,
        anna_university_faculty_id VARCHAR(100),
        aicte_faculty_id VARCHAR(100),
        orcid VARCHAR(100),
        researcher_id VARCHAR(100),
        google_scholar_id VARCHAR(100),
        scopus_profile VARCHAR(255),
        vidwan_profile VARCHAR(255),
        supervisor_id INT,
        h_index INT,
        citation_index INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        -- Constraints
        UNIQUE KEY unique_user_personal_info (Userid),
        UNIQUE KEY unique_email (email),
        
        -- Indexes for better performance
        INDEX idx_email (email),
        INDEX idx_post (post),
        INDEX idx_Userid (Userid),
        INDEX idx_full_name (full_name),
        
        -- Foreign key constraint
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        
        -- Check constraints for data validation
        CHECK (age >= 0 AND age <= 150),
        CHECK (h_index >= 0),
        CHECK (citation_index >= 0),
        CHECK (LENGTH(mobile_number) = 10),
        CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS consultancy_proposals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        pi_name VARCHAR(255) NOT NULL,
        co_pi_names TEXT,
        project_title VARCHAR(500) NOT NULL,
        industry VARCHAR(255) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        proof TEXT,
        organization_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create payment details table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES consultancy_proposals(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_proposals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        pi_name VARCHAR(100) NOT NULL,
        co_pi_names TEXT,
        project_title VARCHAR(255) NOT NULL,
        funding_agency VARCHAR(100) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        proof TEXT,
        organization_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_payment_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES project_proposals(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS events_attended (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        programme_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        mode ENUM('Online','Offline','Hybrid') NOT NULL,
        organized_by VARCHAR(100) NOT NULL,
        participants INT NOT NULL,
        financial_support BOOLEAN DEFAULT FALSE,
        support_amount DECIMAL(10,2),
        permission_letter_link TEXT,
        certificate_link TEXT,
        financial_proof_link TEXT,
        programme_report_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create industry_knowhow table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS industry_knowhow (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        internship_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(100) NOT NULL,
        outcomes TEXT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        venue VARCHAR(100) NOT NULL,
        participants INT NOT NULL,
        financial_support BOOLEAN DEFAULT FALSE,
        support_amount DECIMAL(10,2),
        certificate_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create certification_courses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS certification_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        forum VARCHAR(100) NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        days INT NOT NULL,
        certification_date DATE NOT NULL,
        certificate_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create book_chapters table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS book_chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        publication_type ENUM('journal', 'book_chapter', 'conference') NOT NULL DEFAULT 'book_chapter',
        publication_name VARCHAR(255) NOT NULL COMMENT 'Journal name, Book name, or Conference name',
        publication_title VARCHAR(500) NOT NULL COMMENT 'Title of the article/chapter/paper',
        authors TEXT NOT NULL COMMENT 'Comma separated list of authors',
        index_type ENUM('Scopus', 'SCI', 'SCIE', 'SSCI', 'A&HCI', 'ESCI', 'UGC CARE', 'Other') NOT NULL,
        doi VARCHAR(100) NULL COMMENT 'Digital Object Identifier',
        citations INT DEFAULT 0 COMMENT 'Number of citations',
        publisher VARCHAR(200) NULL COMMENT 'Publisher name',
        page_no VARCHAR(50) NULL COMMENT 'Page numbers (e.g., 123-130)',
        publication_date DATE NOT NULL COMMENT 'Publication date',
        impact_factor DECIMAL(6,3) NULL COMMENT 'Journal impact factor',
        publication_link VARCHAR(500) NULL COMMENT 'URL to the publication',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        
        -- Indexes for better performance
        INDEX idx_user_publication_type (Userid, publication_type),
        INDEX idx_publication_date (publication_date),
        INDEX idx_index_type (index_type),
        INDEX idx_created_at (created_at)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS h_index (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        faculty_name VARCHAR(100) NOT NULL,
        citations INT NOT NULL,
        h_index INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create proposals_submitted table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS proposals_submitted (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        faculty_name VARCHAR(100) NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        register_number VARCHAR(50),
        project_title VARCHAR(255) NOT NULL,
        funding_agency VARCHAR(100) NOT NULL,
        project_duration VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        proof_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create resource_person table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resource_person (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        program_specification VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        venue VARCHAR(100) NOT NULL,
        event_date DATE NOT NULL,
        proof_link TEXT,
        photo_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS education (
        id INT PRIMARY KEY AUTO_INCREMENT,
        Userid INT NOT NULL,
        
        -- 10th Standard fields
        tenth_institution VARCHAR(255),
        tenth_university VARCHAR(255),
        tenth_medium VARCHAR(100),
        tenth_cgpa_percentage VARCHAR(50),
        tenth_first_attempt ENUM('Yes', 'No'),
        tenth_year YEAR,
        
        -- 12th Standard fields
        twelfth_institution VARCHAR(255),
        twelfth_university VARCHAR(255),
        twelfth_medium VARCHAR(100),
        twelfth_cgpa_percentage VARCHAR(50),
        twelfth_first_attempt ENUM('Yes', 'No'),
        twelfth_year YEAR,
        
        -- Undergraduate fields
        ug_institution VARCHAR(255),
        ug_university VARCHAR(255),
        ug_medium VARCHAR(100),
        ug_specialization VARCHAR(255),
        ug_degree VARCHAR(255),
        ug_cgpa_percentage VARCHAR(50),
        ug_first_attempt ENUM('Yes', 'No'),
        ug_year YEAR,
        
        -- Postgraduate fields
        pg_institution VARCHAR(255),
        pg_university VARCHAR(255),
        pg_medium VARCHAR(100),
        pg_specialization VARCHAR(255),
        pg_degree VARCHAR(255),
        pg_cgpa_percentage VARCHAR(50),
        pg_first_attempt ENUM('Yes', 'No'),
        pg_year YEAR,
        
        -- MPhil fields
        mphil_institution VARCHAR(255),
        mphil_university VARCHAR(255),
        mphil_medium VARCHAR(100),
        mphil_specialization VARCHAR(255),
        mphil_degree VARCHAR(255),
        mphil_cgpa_percentage VARCHAR(50),
        mphil_first_attempt ENUM('Yes', 'No'),
        mphil_year YEAR,
        
        -- PhD fields
        phd_university VARCHAR(255),
        phd_title VARCHAR(500),
        phd_guide_name VARCHAR(255),
        phd_college VARCHAR(255),
        phd_status ENUM('Ongoing', 'Completed', 'Submitted', 'Awarded'),
        phd_registration_year YEAR,
        phd_completion_year YEAR,
        phd_publications_during TEXT,
        phd_publications_post TEXT,
        phd_post_experience TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        INDEX idx_Userid (Userid)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS scholars (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        scholar_name VARCHAR(100) NOT NULL,
        scholar_type VARCHAR(20) NOT NULL,
        institute VARCHAR(150),
        university VARCHAR(150),
        title VARCHAR(255),
        domain VARCHAR(100),
        phd_registered_year YEAR,
        completed_year YEAR,
        status VARCHAR(50),
        publications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create seed_money table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS seed_money (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        project_title VARCHAR(255) NOT NULL,
        project_duration VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        outcomes TEXT NOT NULL,
        proof_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create recognition_appreciation table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recognition_appreciation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        program_name VARCHAR(255) NOT NULL,
        recognition_date DATE NOT NULL,
        proof_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create patent_product table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS patent_product (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        project_title VARCHAR(255) NOT NULL,
        patent_status VARCHAR(50) NOT NULL,
        month_year VARCHAR(50) NOT NULL,
        patent_proof_link TEXT,
        working_model BOOLEAN DEFAULT FALSE,
        working_model_proof_link TEXT,
        prototype_developed BOOLEAN DEFAULT FALSE,
        prototype_proof_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS project_mentors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        project_title VARCHAR(255) NOT NULL,
        student_details TEXT NOT NULL,
        event_details VARCHAR(255) NOT NULL,
        participation_status VARCHAR(100) NOT NULL,
        certificate_link TEXT,
        proof_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create sponsored_research table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sponsored_research (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        pi_name VARCHAR(100) NOT NULL,
        co_pi_names TEXT,
        project_title VARCHAR(255) NOT NULL,
        funding_agency VARCHAR(100) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        proof TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create events_organized table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events_organized (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        program_name VARCHAR(255) NOT NULL,
        program_title VARCHAR(255) NOT NULL,
        coordinator_name VARCHAR(100) NOT NULL,
        co_coordinator_names TEXT,
        speaker_details TEXT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        days INT NOT NULL,
        sponsored_by VARCHAR(100),
        amount_sanctioned DECIMAL(10,2),
        participants INT NOT NULL,
        proof_link TEXT,
        documentation_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);
await connection.execute(`
    CREATE TABLE IF NOT EXISTS Batch (
        batchId INT PRIMARY KEY AUTO_INCREMENT,
        degree VARCHAR(50) NOT NULL,
        branch VARCHAR(100) NOT NULL,
        batch VARCHAR(4) NOT NULL,
        batchYears VARCHAR(20) NOT NULL,
        isActive ENUM('YES','NO') DEFAULT 'YES',
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_batch (degree, branch, batch)
    )
`);

// 10) Semester - Stores semesters for each batch
await connection.execute(`
    CREATE TABLE IF NOT EXISTS Semester (
        semesterId INT PRIMARY KEY AUTO_INCREMENT,
        batchId INT NOT NULL,
        semesterNumber INT NOT NULL CHECK (semesterNumber BETWEEN 1 AND 8),
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        isActive ENUM('YES','NO') DEFAULT 'YES',
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_sem_batch FOREIGN KEY (batchId) REFERENCES Batch(batchId)
            ON UPDATE CASCADE ON DELETE RESTRICT,
        UNIQUE (batchId, semesterNumber)
    )
`);

// 11) Course - Stores course details for each semester
await connection.execute(`
    CREATE TABLE IF NOT EXISTS Course (
        courseId INT PRIMARY KEY AUTO_INCREMENT,
        courseCode VARCHAR(20) NOT NULL UNIQUE,
        semesterId INT NOT NULL,
        courseTitle VARCHAR(255) NOT NULL,
        category ENUM('HSMC','BSC','ESC','PEC','OEC','EEC') NOT NULL,
        type ENUM('THEORY','INTEGRATED','PRACTICAL','EXPERIENTIAL LEARNING') NOT NULL,
        lectureHours INT DEFAULT 0,
        tutorialHours INT DEFAULT 0,
        practicalHours INT DEFAULT 0,
        experientialHours INT DEFAULT 0,
        totalContactPeriods INT NOT NULL,
        credits INT NOT NULL,
        minMark INT NOT NULL,
        maxMark INT NOT NULL,
        isActive ENUM('YES','NO') DEFAULT 'YES',
        createdBy VARCHAR(100),
        updatedBy VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_course_sem FOREIGN KEY (semesterId) REFERENCES Semester(semesterId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 12) Section - Stores sections for each course
await connection.execute(`
    CREATE TABLE IF NOT EXISTS Section (
        sectionId INT PRIMARY KEY AUTO_INCREMENT,
        courseCode VARCHAR(20) NOT NULL,
        sectionName VARCHAR(10) NOT NULL,
        isActive ENUM('YES','NO') DEFAULT 'YES',
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_section_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE RESTRICT,
        UNIQUE (courseCode, sectionName)
    )
`);

// 13) StudentCourse - Enrolls students in courses with sections (using regno)
await connection.execute(`
    CREATE TABLE IF NOT EXISTS StudentCourse (
        studentCourseId INT PRIMARY KEY AUTO_INCREMENT,
        regno VARCHAR(50) NOT NULL,
        courseCode VARCHAR(20) NOT NULL,
        sectionId INT NOT NULL,
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (regno, courseCode, sectionId),
        CONSTRAINT fk_sc_student FOREIGN KEY (regno) REFERENCES student_details(regno)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_sc_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_sc_section FOREIGN KEY (sectionId) REFERENCES Section(sectionId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 14) StaffCourse - Assigns staff to courses and sections
await connection.execute(`
    CREATE TABLE IF NOT EXISTS StaffCourse (
        staffCourseId INT PRIMARY KEY AUTO_INCREMENT,
        staffId INT NOT NULL,
        courseCode VARCHAR(20) NOT NULL,
        sectionId INT NOT NULL,
        Deptid INT NOT NULL,
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE (staffId, courseCode, sectionId, Deptid),
        CONSTRAINT fk_stc_staff FOREIGN KEY (staffId) REFERENCES users(staffId)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_stc_dept FOREIGN KEY (Deptid) REFERENCES department(Deptid)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_stc_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_stc_section FOREIGN KEY (sectionId) REFERENCES Section(sectionId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 15) CourseOutcome - Stores course outcomes
await connection.execute(`
    CREATE TABLE IF NOT EXISTS CourseOutcome (
        coId INT PRIMARY KEY AUTO_INCREMENT,
        courseCode VARCHAR(20) NOT NULL,
        coNumber VARCHAR(10) NOT NULL,
        UNIQUE (courseCode, coNumber),
        CONSTRAINT fk_co_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 16) COTool - Stores evaluation tools for course outcomes
await connection.execute(`
    CREATE TABLE IF NOT EXISTS COTool (
        toolId INT PRIMARY KEY AUTO_INCREMENT,
        coId INT NOT NULL,
        toolName VARCHAR(100) NOT NULL,
        weightage INT NOT NULL CHECK (weightage BETWEEN 0 AND 100),
        UNIQUE (coId, toolName),
        CONSTRAINT fk_tool_co FOREIGN KEY (coId) REFERENCES CourseOutcome(coId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 17) StudentCOTool - Stores student marks for each evaluation tool (using regno)
await connection.execute(`
    CREATE TABLE IF NOT EXISTS StudentCOTool (
        studentToolId INT PRIMARY KEY AUTO_INCREMENT,
        regno VARCHAR(50) NOT NULL,
        toolId INT NOT NULL,
        marksObtained INT NOT NULL CHECK (marksObtained >= 0),
        UNIQUE (regno, toolId),
        CONSTRAINT fk_sct_student FOREIGN KEY (regno) REFERENCES student_details(regno)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_sct_tool FOREIGN KEY (toolId) REFERENCES COTool(toolId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 18) Timetable - Stores class schedules
await connection.execute(`
    CREATE TABLE IF NOT EXISTS Timetable (
        timetableId INT PRIMARY KEY AUTO_INCREMENT,
        courseCode VARCHAR(20) NOT NULL,
        sectionId INT NULL,
        dayOfWeek ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
        periodNumber INT NOT NULL CHECK (periodNumber BETWEEN 1 AND 8),
        Deptid INT NOT NULL,
        semesterId INT NOT NULL,
        isActive ENUM('YES','NO') DEFAULT 'YES',
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_tt_dept FOREIGN KEY (Deptid) REFERENCES department(Deptid)
            ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_tt_sem FOREIGN KEY (semesterId) REFERENCES Semester(semesterId)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_tt_section FOREIGN KEY (sectionId) REFERENCES Section(sectionId)
            ON UPDATE CASCADE ON DELETE SET NULL,
        UNIQUE (semesterId, dayOfWeek, periodNumber)
    )
`);

// 19) DayAttendance - Stores daily attendance for students (using regno)
await connection.execute(`
    CREATE TABLE IF NOT EXISTS DayAttendance (
        dayAttendanceId INT PRIMARY KEY AUTO_INCREMENT,
        regno VARCHAR(50) NOT NULL,
        semesterNumber INT NOT NULL CHECK (semesterNumber BETWEEN 1 AND 8),
        attendanceDate DATE NOT NULL,
        status ENUM('P','A') NOT NULL,
        UNIQUE (regno, attendanceDate),
        CONSTRAINT fk_da_student FOREIGN KEY (regno) REFERENCES student_details(regno)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 20) PeriodAttendance - Stores period-wise attendance (using regno)
await connection.execute(`
    CREATE TABLE IF NOT EXISTS PeriodAttendance (
        periodAttendanceId INT PRIMARY KEY AUTO_INCREMENT,
        regno VARCHAR(50) NOT NULL,
        staffId INT NOT NULL,
        courseCode VARCHAR(20) NOT NULL,
        sectionId INT NOT NULL,
        semesterNumber INT NOT NULL CHECK (semesterNumber BETWEEN 1 AND 8),
        dayOfWeek ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
        periodNumber INT NOT NULL CHECK (periodNumber BETWEEN 1 AND 8),
        attendanceDate DATE NOT NULL,
        status ENUM('P','A') NOT NULL,
        Deptid INT NOT NULL,
        UNIQUE (regno, courseCode, sectionId, attendanceDate, periodNumber),
        CONSTRAINT fk_pa_student FOREIGN KEY (regno) REFERENCES student_details(regno)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_pa_staff FOREIGN KEY (staffId) REFERENCES users(staffId)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_pa_dept FOREIGN KEY (Deptid) REFERENCES department(Deptid)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_pa_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_pa_section FOREIGN KEY (sectionId) REFERENCES Section(sectionId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 21) CoursePartitions - Stores CO counts per partition for each course
await connection.execute(`
    CREATE TABLE IF NOT EXISTS CoursePartitions (
        partitionId INT PRIMARY KEY AUTO_INCREMENT,
        courseCode VARCHAR(20) NOT NULL UNIQUE,
        theoryCount INT DEFAULT 0,
        practicalCount INT DEFAULT 0,
        experientialCount INT DEFAULT 0,
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_partition_course FOREIGN KEY (courseCode) REFERENCES Course(courseCode)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 22) COType - Associates type to each CO
await connection.execute(`
    CREATE TABLE IF NOT EXISTS COType (
        coTypeId INT PRIMARY KEY AUTO_INCREMENT,
        coId INT NOT NULL UNIQUE,
        coType ENUM('THEORY', 'PRACTICAL', 'EXPERIENTIAL') NOT NULL,
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_cotype_co FOREIGN KEY (coId) REFERENCES CourseOutcome(coId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

// 23) ToolDetails - Adds maxMarks to each evaluation tool
await connection.execute(`
    CREATE TABLE IF NOT EXISTS ToolDetails (
        toolDetailId INT PRIMARY KEY AUTO_INCREMENT,
        toolId INT NOT NULL UNIQUE,
        maxMarks INT NOT NULL CHECK (maxMarks > 0),
        createdBy VARCHAR(150),
        updatedBy VARCHAR(150),
        createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_tooldetail_tool FOREIGN KEY (toolId) REFERENCES COTool(toolId)
            ON UPDATE CASCADE ON DELETE CASCADE
    )
`);

await connection.query(`
      CREATE TABLE IF NOT EXISTS placement_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        student_name VARCHAR(255),
        course_branch ENUM('CSE','IT','AIDS','EEE','ECE','CIVIL','MECH') NOT NULL,
        batch_year VARCHAR(10) NOT NULL,
        company_name VARCHAR(255),
        industry_sector VARCHAR(100),
        job_role VARCHAR(255),
        work_location VARCHAR(255),
        ctc_fixed DECIMAL(10,2),
        ctc_variable DECIMAL(10,2),
        ctc_bonus DECIMAL(10,2),
        ctc_total DECIMAL(10,2),
        drive_mode ENUM('On-Campus', 'Off-Campus', 'Pooled'),
        eligibility_criteria TEXT,
        total_rounds INT,
        overall_difficulty ENUM('Easy', 'Medium', 'Hard'),
        online_test_platform VARCHAR(100),
        test_sections TEXT,
        test_questions_count INT,
        test_duration VARCHAR(50),
        memory_based_questions TEXT,
        coding_problems_links TEXT,
        technical_questions TEXT,
        hr_questions TEXT,
        tips_suggestions TEXT,
        company_expectations TEXT,
        final_outcome ENUM('Selected', 'Rejected', 'Waitlisted'),
        process_difficulty_rating INT CHECK(process_difficulty_rating BETWEEN 1 AND 5),
        company_communication_rating INT CHECK(company_communication_rating BETWEEN 1 AND 5),
        overall_experience_rating INT CHECK(overall_experience_rating BETWEEN 1 AND 5),
        show_name_publicly BOOLEAN DEFAULT TRUE,
        question_files JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(Userid) ON DELETE CASCADE
      )
    `);

    // Create feedback_rounds table for detailed round information
    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback_rounds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        feedback_id INT NOT NULL,
        round_number INT NOT NULL,
        round_type ENUM('Online Test', 'Group Discussion', 'Case Study', 'Technical Interview', 'HR Interview', 'Other'),
        round_description TEXT,
        difficulty_level ENUM('Easy', 'Medium', 'Hard'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES placement_feedback(id) ON DELETE CASCADE
      )
    `);

    // Create companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyName VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        package DECIMAL(10,2),
        objective TEXT,
        skillSets JSON,
        localBranches JSON,
        roles JSON,
        logo VARCHAR(255),
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_companies_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_companies_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create upcomingdrives_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS upcomingdrives_placement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post VARCHAR(255),
        company_name VARCHAR(255) NOT NULL,
        eligibility TEXT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        venue VARCHAR(255),
        roles VARCHAR(255) DEFAULT 'Not specified',
        salary VARCHAR(255) DEFAULT 'Not specified',
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_upcomingdrives_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_upcomingdrives_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create companydetails table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companydetails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_name VARCHAR(255) NOT NULL,
        description TEXT,
        ceo VARCHAR(255),
        location VARCHAR(255),
        salary_package DECIMAL(10,2),
        objective TEXT,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_companydetails_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_companydetails_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create placed_student table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS placed_student (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Userid INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        package DECIMAL(10,2) NOT NULL,
        year INT NOT NULL,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_placed_user FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        CONSTRAINT fk_placed_regno FOREIGN KEY (regno) REFERENCES student_details(regno) ON DELETE CASCADE,
        CONSTRAINT fk_placed_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_placed_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL,
        INDEX idx_year (year),
        INDEX idx_company_name (company_name)
      )
    `);

    // Create registered_student_placement table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS registered_student_placement (
        id INT AUTO_INCREMENT,
        Userid INT NOT NULL,
        regno VARCHAR(50) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        register BOOLEAN DEFAULT TRUE,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id, Userid),
        CONSTRAINT fk_registered_user FOREIGN KEY (Userid) REFERENCES users(Userid) ON DELETE CASCADE,
        CONSTRAINT fk_registered_regno FOREIGN KEY (regno) REFERENCES student_details(regno) ON DELETE CASCADE,
        CONSTRAINT fk_registered_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_registered_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL,
        INDEX idx_company_name (company_name)
      )
    `);

    // Create hackathons table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hackathons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        link VARCHAR(500),
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_hackathons_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_hackathons_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message TEXT NOT NULL,
        Created_by INT,
        Updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_createdby FOREIGN KEY (Created_by) REFERENCES users(Userid) ON DELETE SET NULL,
        CONSTRAINT fk_notifications_updatedby FOREIGN KEY (Updated_by) REFERENCES users(Userid) ON DELETE SET NULL
      )
    `);

    // Insert default admin user if it doesn't exist
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', ['faculty']);
    if (rows.length === 0) {
      // Get the first department ID
      const [deptRows] = await connection.query('SELECT Deptid FROM department LIMIT 1');
      const defaultDeptId = deptRows[0]?.Deptid || 1;
      
      // Insert default faculty user
      await connection.query(`
        INSERT INTO users (username, password, email, role, Deptid) 
        VALUES (?, ?, ?, ?, ?)
      `, ['faculty', '$2b$10$8DaSlKea.xlHPElfW8ek3.LZVIpzQdh47/qZ.n9AEWlDUfzA6OgYi', 'faculty@example.com', 'Staff', defaultDeptId]);
      console.log('Default faculty user created');
    }

    connection.release();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    return false;
  }
}

// Export connection pool and utilities
export { pool, testConnection, initializeDatabase };