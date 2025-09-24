import React, { useState, useEffect } from "react";
import { useLocation, useParams ,useNavigate} from "react-router-dom"; // ✅ Import useParams for URL data
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import '../../../styles/companyDetails.css';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CompanyDetails = () => {
  const location = useLocation();
  const navigate = useNavigate(); 
  const { companyName } = useParams(); // ✅ Get company name from URL
  const [company, setCompany] = useState(location.state?.company || null); // ✅ Initialize from state or null
  const [loading, setLoading] = useState(!company); // ✅ Show loading only if data is missing

  // ✅ Fetch company data if not received via state (for Student Side)
  console.log("Company Data in Student Side:", company);
  useEffect(() => {
    if (!company && companyName) {
      const fetchCompanyData = async () => {
        try {
          const encodedCompanyName = encodeURIComponent(companyName);
          const response = await axios.get(`http://localhost:4000/api/placement/company/${encodedCompanyName}`);
          console.log("Fetched Company Data:", response.data); // ✅ Debugging API response
  
          if (response.data && Object.keys(response.data).length > 0) {
            setCompany(response.data);
          } else {
            console.error("No data found for company:", companyName);
          }
          setLoading(false);
        } catch (error) {
          console.error("Error fetching company details:", error.message);
          setLoading(false);
        }
      };
      fetchCompanyData();
    }
  }, [company, companyName]);
  
  
  

  if (loading) {
    return <p className="loading-message">Loading company details...</p>;
  }

  if (!company) {
    return <p className="error-message">Company not found</p>;
  }

  // ✅ Prevent errors by setting default values
  const roles = company.roles || [];
  const skillSets = company.skillSets || [];
  const localBranches = company.localBranches || [];

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: "Students Placed",
      data: [],
      backgroundColor: "rgba(75, 192, 192, 0.6)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
    }],
  });

  const [selectedYear, setSelectedYear] = useState(null);
  const [studentDetails, setStudentDetails] = useState([]);

  useEffect(() => {
    const fetchPlacementData = async () => {
      try {
        const response = await axios.get(`http://localhost:4000/api/placement/placed-student?companyName=${company.companyName}`);
        const fetchedData = response.data || [];

        const years = [...new Set(fetchedData.map((item) => item.year))];
        const studentsPlaced = years.map(year =>
          fetchedData.filter(item => item.year === year).reduce((sum, item) => sum + item.student_count, 0)
        );

        setChartData({
          labels: years,
          datasets: [{
            label: "Students Placed",
            data: studentsPlaced,
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1
          }]
        });
      } catch (error) {
        console.error("Error fetching placement data:", error.message);
      }
    };

    fetchPlacementData();
  }, [company.companyName]);

  const handleBarClick = async (event, elements) => {
    if (!elements.length) return;
    const clickedIndex = elements[0].index;
    const year = chartData.labels[clickedIndex];

    setSelectedYear(year);
    setStudentDetails([]);

    try {
      const response = await axios.get(`http://localhost:4000/api/placement/student-details?companyName=${company.companyName}&year=${year}`);
      setStudentDetails(response.data || []);
    } catch (error) {
      console.error("Error fetching student details:", error.message);
    }
  };

  return (
    <>
    
    <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>
    <div className="company-details-container">
      
      <div className="company-header">
        <h2>{company.companyName}</h2>
        <div className="company-logo-header">
          {company.logo ? (
            <img src={`http://localhost:4000/api/placement/uploads/${company.logo}`} alt={company.companyName} />
          ) : (
            <p>No logo available</p>
          )}
        </div>
        
      </div>

      <div className="company-info">
        <div className="company-description">
          <p><strong>Description: </strong>{company.description || "N/A"}</p>
        </div>
        <p><strong>Objective: </strong>{company.objective || "N/A"}</p>
        <p><strong>CEO:</strong> {company.ceo || "N/A"}</p>
        <p><strong>Location:</strong> {company.location || "N/A"}</p>

        <p><strong>Skill Sets:</strong>
          {skillSets.length > 0 ? (
            <ul className="company-list">
              {skillSets.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          ) : "N/A"}
        </p>

        <p><strong>Local Branches:</strong>
          {localBranches.length > 0 ? (
            <ul className="company-list">
              {localBranches.map((branch, index) => (
                <li key={index}>{branch}</li>
              ))}
            </ul>
          ) : "N/A"}
        </p>

        <p><strong>Roles:</strong>
          {roles.length > 0 ? (
            <ul className="company-list">
              {roles.map((role, index) => (
                <li key={index}>{role}</li>
              ))}
            </ul>
          ) : "N/A"}
        </p>

        <p><strong>Package:</strong> {company.package || "N/A"}</p>
      </div>

      <div className="chart-container">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            onClick: handleBarClick,
            plugins: {
              legend: { position: "top" },
              title: { display: true, text: "Placement Trends Over the Years" },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 },
              },
              x: { ticks: { autoSkip: false }, grid: { offset: true } },
            },
            elements: {
              bar: { barThickness: 20, maxBarThickness: 40 },
            },
          }}
          height={500}
        />
      </div>

      {selectedYear && studentDetails.length > 0 && (
        <div className="student-details">
          <h3>Student Details for {company.companyName} ({selectedYear})</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Reg No</th>
                <th>Role</th>
                <th>Package (LPA)</th>
              </tr>
            </thead>
            <tbody>
              {studentDetails.map((student, index) => (
                <tr key={index}>
                  <td>{student.name}</td>
                  <td>{student.regno}</td>
                  <td>{student.role}</td>
                  <td>₹{student.package} LPA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};

export default CompanyDetails;
