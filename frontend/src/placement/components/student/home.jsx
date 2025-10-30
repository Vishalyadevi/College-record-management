import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Home.css";
import Navbar from "./navbar";
import ImageSlider from "../imageslider"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

const Home = () => {
  const [stats, setStats] = useState({ 
    total_students: 0, 
    avg_salary: 0, 
    highest_salary: 0 
  });
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [studentDetails, setStudentDetails] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [yearWiseData, setYearWiseData] = useState([]);
  const [recruiterCount, setRecruiterCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const images = [
    "https://nec.edu.in/wp-content/uploads/2024/05/IMG_20220915_145123-scaled-e1715150167202.jpg",
    "https://nec.edu.in/wp-content/uploads/2024/05/IMG_20220903_192620-scaled.jpg",
    "https://nec.edu.in/wp-content/uploads/2023/04/placment-22-23-copy.webp",
    "https://nec.edu.in/wp-content/uploads/2023/04/placement_2020_2021-scaled-copy.webp",
  ];

  // Fetch placement stats
  useEffect(() => {
    setLoading(true);
    axios.get("http://localhost:4000/api/placement/stats")
      .then((response) => {
        setStats({
          total_students: response.data.total_students || 0,
          avg_salary: parseFloat(response.data.avg_salary) || 0,
          highest_salary: parseFloat(response.data.highest_salary) || 0,
        });
      })
      .catch((error) => {
        console.error("Error fetching stats:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch all placed students and create year-wise data
  useEffect(() => {
    axios.get("http://localhost:4000/api/placement/placed-students")
      .then((response) => {
        setStudentDetails(response.data);
        setFilteredData(response.data);

        // Group students by year for chart
        const yearCount = {};
        response.data.forEach((student) => {
          const year = student.year;
          yearCount[year] = (yearCount[year] || 0) + 1;
        });

        // Format for chart and sort by year
        const formattedData = Object.entries(yearCount)
          .map(([year, count]) => ({ year: parseInt(year), count }))
          .sort((a, b) => a.year - b.year);

        setYearWiseData(formattedData);
      })
      .catch((error) => {
        console.error("Error fetching students:", error);
      });
  }, []);

  // Fetch unique company names from placed students
  useEffect(() => {
    axios.get("http://localhost:4000/api/placement/placed-student-companies")
      .then((response) => {
        if (Array.isArray(response.data) && response.data.length > 0) {
          setCompanies(response.data.map(company => ({
            company_name: company.company_name || "Unnamed Company"
          })));
        } else {
          setCompanies([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      });
  }, []);

  // Fetch recruiter count
  useEffect(() => {
    axios.get("http://localhost:4000/api/placement/recruiterscount")
      .then((response) => {
        setRecruiterCount(response.data.total);
      })
      .catch((error) => {
        console.error("Error fetching recruiter count:", error);
      });
  }, []);

  // Handle dropdown selection
  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // Filter by company or year
  const handleSubmit = () => {
    console.log(`Filtering data for company: ${selectedCompany}, year: ${selectedYear}`);
  
    let filteredResults = studentDetails;
  
    if (selectedCompany) {
      filteredResults = filteredResults.filter(student => 
        student.company_name === selectedCompany
      );
    }
  
    if (selectedYear) {
      filteredResults = filteredResults.filter(student => 
        student.year.toString() === selectedYear
      );
    }
  
    filteredResults.sort((a, b) => a.year - b.year);
  
    console.log("Filtered Data:", filteredResults);
    setFilteredData(filteredResults);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedCompany("");
    setSelectedYear("");
    setFilteredData(studentDetails);
  };

  // Get unique years from student data
  const getUniqueYears = () => {
    return Array.from(new Set(studentDetails.map(student => student.year)))
      .sort((a, b) => b - a); // Sort years descending
  };

  return (
    <>
      <Navbar />
      <div className="home-container">
        {/* Statistics Section */}
        <div className="stats-container">
          <div className="stat-box">
            <h3>Students Placed</h3>
            <p>{loading ? "Loading..." : stats.total_students}</p>
          </div>
          <div className="stat-box">
            <h3>Recruiters</h3>
            <p>{loading ? "Loading..." : recruiterCount}</p>
          </div>
          <div className="stat-box">
            <h3>Highest Salary</h3>
            <p>₹{Number(stats.highest_salary).toFixed(2)} LPA</p>
          </div>
          <div className="stat-box">
            <h3>Average Salary</h3>
            <p>₹{Number(stats.avg_salary).toFixed(2)} LPA</p>
          </div>
        </div>

        {/* Image Slider */}
        <div className="container">
          <ImageSlider />
        </div>

        {/* Placement Center Information */}
        <h2 className="home-subheading">PLACEMENT CENTER</h2>
        <p className="home-text">
          Welcome to the Placement program of National Engineering College. This program consists of a 
          dedicated and efficient placement team of students and staff who function round the year to 
          ensure that students are placed in reputed companies across the country. Continuous placement 
          training is offered to equip students with communication, soft skills, confidence building, 
          interview skills, and test of reasoning by experts in the respective fields. Career development 
          programs are regularly conducted through accomplished resource persons across a broad spectrum 
          of industries.
        </p>

        <h2 className="home-subheading">Functions of Placement Centre</h2>
        <ul className="home-list">
          <li>To Organize On / Off campus Interviews for the final year students.</li>
          <li>To Promote Industry-Institute Interface activities.</li>
          <li>To Arrange Career / Personal Counselling sessions.</li>
          <li>To Organize Career Guidance sessions and Personality Development programs.</li>
          <li>To Organize Functional Skill Development Programs.</li>
          <li>To Organize Placement Training Programs like:
            <ul>
              <li>Aptitude programs</li>
              <li>Life skills programs</li>
              <li>Motivational sessions</li>
              <li>Resume Writing</li>
              <li>Group discussions</li>
              <li>Mock Interviews</li>
            </ul>
          </li>
        </ul>

        {/* Year-wise Chart */}
        <div className="chart-container">
          <h2 className="chart-title">Year-wise Placement Statistics</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={yearWiseData}
              margin={{ top: 20, right: 30, left: 20, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line 
                type="linear" 
                dataKey="count" 
                stroke="#2375f0" 
                strokeWidth={3} 
                dot={{ r: 5 }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Filter Section */}
        <div className="dropdown-container">
          <div className="filter-group">
            <label>Select Company: </label>
            <select value={selectedCompany} onChange={handleCompanyChange}>
              <option value="">-- Show All Companies --</option>
              {companies.length > 0 &&
                companies.map((comp, index) => (
                  <option key={index} value={comp.company_name}>
                    {comp.company_name}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Select Year: </label>
            <select value={selectedYear} onChange={handleYearChange}>
              <option value="">-- Show All Years --</option>
              {getUniqueYears().map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-buttons">
            <button className="submit-btn" onClick={handleSubmit}>
              Apply Filters
            </button>
            <button className="clear-btn" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Student Details Table */}
        {filteredData.length > 0 ? (
          <div className="student-details">
            <h3>
              Student Details 
              {selectedCompany ? ` for ${selectedCompany}` : ""}
              {selectedYear ? ` (Year: ${selectedYear})` : ""} 
              {!selectedCompany && !selectedYear ? " (All Companies)" : ""}
              <span className="student-count"> - {filteredData.length} students</span>
            </h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg No</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Package (LPA)</th>
                    <th>Year</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((student, index) => (
                    <tr key={student.id || index}>
                      <td>{student.name}</td>
                      <td>{student.regno}</td>
                      <td>{student.company_name}</td>
                      <td>{student.role}</td>
                      <td>₹{student.package} LPA</td>
                      <td>{student.year}</td>
                      <td>Dept {student.Deptid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>No students found for the selected filters.</p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      <div className="image-grid">
        {images.map((image, index) => (
          <div key={index} className="grid-item">
            <img 
              src={image} 
              alt={`Placement Batch ${index + 1}`}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
              }}
            />
          </div>
        ))}
      </div>

      {/* Contact Information Section */}
      <div className="container">
        <h2 className="section-title">Contact Information</h2>
        <div className="contact-grid">
          {[
            {
              title: "Address",
              details: ["National Engineering College (Autonomous)", "K.R.Nagar, Kovilpatti – 628 503", "Thoothukudi Dt, Tamil Nadu, India."]
            },
            {
              title: "Contact",
              details: ["placement@nec.edu.in", "04632-226955, 222502", "ext: 1062 & 1025", "www.nec.edu.in"],
            },
            {
              title: "Email",
              details: ["principal@nec.edu.in", "Fax: 04632 – 232749", "www.nec.edu.in"]
            },
            {
              title: "Dean-Training and Placement Centre",
              details: ["Dr.K.G.Srinivasagan", "94421 42502"],
            },
            {
              title: "Placement Convener",
              details: ["Dr.V.Manimaran", "94432 30265"],
            },
            {
              title: "Help desk",
              details: ["nechelpdesk@nec.edu.in"]
            }
          ].map((contact, index) => (
            <div className="contact-card" key={index}>
              <div className="contact-info">
                <h3>{contact.title}</h3>
                {contact.details.map((info, i) => (
                  <p key={i}>{info}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="contact-info">
            <h3>The Principal</h3>
            <p>National Engineering College, (Autonomous)</p>
            <p>K.R.Nagar, Kovilpatti, Thoothukudi (Dt) - 628503</p>
            <p>Ph: 04632 – 222 502 | Fax: 232749</p>
            <p>Mobile: 93859 76674, 93859 76684</p>
            <p>Email: <a href="mailto:principal@nec.edu.in">principal@nec.edu.in</a></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} National Engineering College. All Rights Reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default Home;