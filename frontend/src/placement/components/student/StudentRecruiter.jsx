import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const StaffRecruiter = () => {
  const [companyLogos, setCompanyLogos] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filterText, setFilterText] = useState("");
  const [filterField, setFilterField] = useState("all");

  // Fetch company data when the component mounts
  useEffect(() => {
    const fetchCompanyLogos = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/placement/companies");
        setCompanyLogos(response.data.companies || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanyLogos([]);
      }
    };
    fetchCompanyLogos();
  }, []);

  // Download as Excel
  const handleDownloadExcel = () => {
    const data = companyLogos.map((company) => ({
      "Company Name": company.companyName || "",
      CEO: company.ceo || "",
      Location: company.location || "",
      "Package (LPA)": company.package || "",
      Description: company.description || "",
      Objective: company.objective || "",
      "Skill Sets": Array.isArray(company.skillSets)
        ? company.skillSets.join(", ")
        : typeof company.skillSets === "string" && company.skillSets
        ? JSON.parse(company.skillSets).join(", ")
        : "",
      "Local Branches": Array.isArray(company.localBranches)
        ? company.localBranches.join(", ")
        : typeof company.localBranches === "string" && company.localBranches
        ? JSON.parse(company.localBranches).join(", ")
        : "",
      Roles: Array.isArray(company.roles)
        ? company.roles.join(", ")
        : typeof company.roles === "string" && company.roles
        ? JSON.parse(company.roles).join(", ")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    XLSX.writeFile(workbook, "Recruiters.xlsx");
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filtered and sorted companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = [...companyLogos];

    if (filterText) {
      filtered = filtered.filter((company) => {
        if (filterField === "all") {
          return Object.values(company).some((value) =>
            value && value.toString().toLowerCase().includes(filterText.toLowerCase())
          );
        } else {
          const value = company[filterField];
          return value && value.toString().toLowerCase().includes(filterText.toLowerCase());
        }
      });
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (Array.isArray(aValue)) aValue = aValue.join(", ");
        if (Array.isArray(bValue)) bValue = bValue.join(", ");
        if (typeof aValue === "string" && aValue.startsWith("[")) {
          try {
            aValue = JSON.parse(aValue).join(", ");
          } catch {}
        }
        if (typeof bValue === "string" && bValue.startsWith("[")) {
          try {
            bValue = JSON.parse(bValue).join(", ");
          } catch {}
        }

        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [companyLogos, filterText, filterField, sortConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ml-64 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Recruiters</h1>
            <p className="text-gray-600">View company recruiters and their details</p>
          </div>
          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg flex items-center gap-2"
              onClick={handleDownloadExcel}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Excel
            </button>
          </div>
        </div>

        {/* Filter and Sort Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Search & Filter</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, CEO, location..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter By</label>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Fields</option>
                <option value="companyName">Company Name</option>
                <option value="ceo">CEO</option>
                <option value="location">Location</option>
                <option value="package">Package</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("logo")}>
                    Logo {sortConfig.key === "logo" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("companyName")}>
                    Company Name {sortConfig.key === "companyName" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("ceo")}>
                    CEO {sortConfig.key === "ceo" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("location")}>
                    Location {sortConfig.key === "location" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("package")}>
                    Package (LPA) {sortConfig.key === "package" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("description")}>
                    Description {sortConfig.key === "description" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("objective")}>
                    Objective {sortConfig.key === "objective" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("skillSets")}>
                    Skill Sets {sortConfig.key === "skillSets" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("localBranches")}>
                    Branches {sortConfig.key === "localBranches" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-6 py-4 text-left cursor-pointer hover:bg-blue-700" onClick={() => requestSort("roles")}>
                    Roles {sortConfig.key === "roles" ? (sortConfig.direction === "ascending" ? "↑" : "↓") : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAndSortedCompanies.length > 0 ? (
                  filteredAndSortedCompanies.map((company, index) =>
                    company && company.companyName ? (
                      <tr key={company.id || index} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          {company.logo ? (
                            <img
                              src={`http://localhost:4000/Uploads/${company.logo}`}
                              alt={company.companyName}
                              className="w-16 h-16 object-contain rounded-lg shadow-sm"
                              onError={(e) => {
                                e.target.src = "/placeholder-logo.png";
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white rounded-lg shadow-sm">
                              {company.companyName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{company.companyName}</td>
                        <td className="px-6 py-4 text-gray-700">{company.ceo}</td>
                        <td className="px-6 py-4 text-gray-700">{company.location}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ₹{company.package} LPA
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{company.description}</td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{company.objective}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(company.skillSets)
                              ? company.skillSets
                              : typeof company.skillSets === "string" && company.skillSets
                              ? JSON.parse(company.skillSets)
                              : []
                            ).slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                {skill}
                              </span>
                            ))}
                            {(Array.isArray(company.skillSets) ? company.skillSets : JSON.parse(company.skillSets || "[]")).length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                +{(Array.isArray(company.skillSets) ? company.skillSets : JSON.parse(company.skillSets || "[]")).length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(company.localBranches)
                              ? company.localBranches
                              : typeof company.localBranches === "string" && company.localBranches
                              ? JSON.parse(company.localBranches)
                              : []
                            ).slice(0, 2).map((branch, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                {branch}
                              </span>
                            ))}
                            {(Array.isArray(company.localBranches) ? company.localBranches : JSON.parse(company.localBranches || "[]")).length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                +{(Array.isArray(company.localBranches) ? company.localBranches : JSON.parse(company.localBranches || "[]")).length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(company.roles)
                              ? company.roles
                              : typeof company.roles === "string" && company.roles
                              ? JSON.parse(company.roles)
                              : []
                            ).slice(0, 2).map((role, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {role}
                              </span>
                            ))}
                            {(Array.isArray(company.roles) ? company.roles : JSON.parse(company.roles || "[]")).length > 2 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                +{(Array.isArray(company.roles) ? company.roles : JSON.parse(company.roles || "[]")).length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null
                  )
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-gray-500 text-lg font-medium">No data available</p>
                        <p className="text-gray-400 text-sm mt-1">Add new entries to see them here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRecruiter;