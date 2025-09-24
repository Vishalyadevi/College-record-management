import React, { useState, useEffect } from "react";
import "../styles/Home.css";
import Navbar from "./publichomeNavbar";
import ImageSlider from "./imageslider";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

const Home = () => {
  const [stats, setStats] = useState({ total_students: 0, avg_salary: 0, highest_salary: 0 });
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [studentDetails, setStudentDetails] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [yearWiseData, setYearWiseData] = useState([]);
  const [recruiterCount, setRecruiterCount] = useState(0);

  const images = [
    "https://nec.edu.in/wp-content/uploads/2024/05/IMG_20220915_145123-scaled-e1715150167202.jpg",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/IMG_20220903_192620-scaled-1-qwsm3l08lnrsuhptct54qqxdtlmxlnvkbyz10ovo2u.jpg",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placment-22-23-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp",
    "https://nec.edu.in/wp-content/uploads/2024/01/IMG_2136-copy-scaled-1-1024x768.webp",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placement_2020_2021-scaled-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp",
    "https://nec.edu.in/wp-content/uploads/elementor/thumbs/placement_19_20-copy-qio64bkkyw4f2pkj6yj4us996x3orssw1my20umf1i.webp"
  ];

  // Fetch stats
  useEffect(() => {
    fetch("http://localhost:4000/api/placement/stats")
      .then(res => res.json())
      .then(data => {
        setStats({
          total_students: data.total_students || 0,
          avg_salary: parseFloat(data.avg_salary) || 0,
          highest_salary: parseFloat(data.highest_salary) || 0,
        });
      })
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  // Fetch all placed students
  useEffect(() => {
    fetch("http://localhost:4000/api/placement/placed-students")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStudentDetails(data);
          setFilteredData(data);

          // group by year
          const yearCount = {};
          data.forEach(student => {
            const year = student.year;
            yearCount[year] = (yearCount[year] || 0) + 1;
          });

          const formattedData = Object.entries(yearCount).map(([year, count]) => ({
            year,
            count
          }));

          formattedData.sort((a, b) => a.year - b.year);
          setYearWiseData(formattedData);
        }
      })
      .catch(err => console.error("Error fetching students:", err));
  }, []);

  // Fetch companies
  useEffect(() => {
    fetch("http://localhost:4000/api/placement/placed-student-companies")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCompanies(data.map(company => ({
            company_name: company.company_name || "Unnamed Company"
          })));
        }
      })
      .catch(() => setCompanies([]));
  }, []);

  // Fetch recruiter count
  useEffect(() => {
    fetch("http://localhost:4000/api/placement/recruiterscount")
      .then(res => res.json())
      .then(data => setRecruiterCount(data.total || 0))
      .catch(err => console.error("Error fetching recruiter count:", err));
  }, []);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
  };

  const handleSubmit = () => {
    let filteredResults = studentDetails;

    if (selectedCompany) {
      filteredResults = filteredResults.filter(student => student.company_name === selectedCompany);
    }
    if (selectedYear) {
      filteredResults = filteredResults.filter(student => student.year.toString() === selectedYear);
    }

    filteredResults.sort((a, b) => a.year - b.year);
    setFilteredData(filteredResults);
  };

  return (
    <>
      <Navbar />
      <div className="home-container">
        <h3 className="section-title">2025 Statistics</h3>
        <div className="stats-container">
          <div className="stat-box">
            <h3>Students Placed</h3>
            <p>{stats.total_students}</p>
          </div>
          <div className="stat-box">
            <h3>Recruiters</h3>
            <p>{recruiterCount}</p>
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

        <div className="container">
          <ImageSlider />
        </div>

        <h2 className="home-subheading">PLACEMENT CENTER</h2>
        <p className="home-text">
          Welcome to the Placement program of National Engineering College. This program consists of a
          dedicated and efficient placement team of students and staff who function round the year to
          ensure that students are placed in reputed companies across the country...
        </p>

        <h2 className="home-subheading">Functions of Placement Centre</h2>
        <ul className="home-list">
          <li>To Organize On / Off campus Interviews for the final year students.</li>
          <li>To Promote Industry-Institute Interface activities.</li>
          <li>To Arrange Career / Personal Counselling sessions.</li>
          <li>To Organize Career Guidance sessions and Personality Development programs.</li>
          <li>To Organize Functional Skill Development Programs.</li>
          <li>
            To Organize Placement Training Programs like:
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

        <div className="chart-container">
          <h2 className="chart-title">Year-wise Placement Statistic</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={yearWiseData} margin={{ top: 20, right: 30, left: 20, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="linear" dataKey="count" stroke="#2375f0" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dropdowns */}
        <div className="dropdown-container">
          <label>Select Company: </label>
          <select value={selectedCompany} onChange={handleCompanyChange}>
            <option value="">-- Show All Companies --</option>
            {companies.map((comp, index) => (
              <option key={index} value={comp.company_name}>{comp.company_name}</option>
            ))}
          </select>

          <label>Select Year: </label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">-- Show All Years --</option>
            {Array.from(new Set(studentDetails.map(s => s.year))).sort().map((year, idx) => (
              <option key={idx} value={year}>{year}</option>
            ))}
          </select>

          <button className="submit-btn" onClick={handleSubmit}>Filter</button>
        </div>

        {/* Student Table */}
        {filteredData.length > 0 ? (
          <div className="student-details">
            <h3>Student Details {selectedCompany ? `for ${selectedCompany}` : "(All Companies)"}</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reg No</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Package (LPA)</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student, index) => (
                  <tr key={index}>
                    <td>{student.name}</td>
                    <td>{student.regno}</td>
                    <td>{student.company_name}</td>
                    <td>{student.role}</td>
                    <td>{student.package} LPA</td>
                    <td>{student.year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No students found for the selected filters.</p>
        )}

        {/* Placement Images */}
        <div className="image-grid">
          {images.map((image, index) => (
            <div key={index} className="grid-item">
              <img src={image} alt={`Placement Batch ${index + 1}`} />
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
