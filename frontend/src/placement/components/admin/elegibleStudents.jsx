import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, X, ChevronDown, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentFilterPage = () => {
  const [filters, setFilters] = useState({
    batch: '',
    year: '',
    deptId: '',
    minTenth: '',
    maxTenth: '',
    minTwelfth: '',
    maxTwelfth: '',
    minCgpa: '',
    maxCgpa: '',
    hasArrearsHistory: '',
    hasStandingArrears: '',
  });

  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    batches: [],
    years: [1, 2, 3, 4],
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/students/filter-options', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/students/eligible-students?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      batch: '',
      year: '',
      deptId: '',
      minTenth: '',
      maxTenth: '',
      minTwelfth: '',
      maxTwelfth: '',
      minCgpa: '',
      maxCgpa: '',
      hasArrearsHistory: '',
      hasStandingArrears: '',
    });
    setStudents([]);
  };

  const exportToCSV = () => {
    const headers = ['Reg No', 'Name', 'Email', 'Department', 'Batch', 'Semester', '10th %', '12th %', 'CGPA', 'Arrears History', 'Standing Arrears'];
    const rows = students.map(s => [
      s.regno,
      s.username,
      s.email,
      s.department,
      s.batch,
      s.semester,
      s.tenth_percentage || 'N/A',
      s.twelfth_percentage || 'N/A',
      s.cgpa || 'N/A',
      s.has_arrears_history ? 'Yes' : 'No',
      s.has_standing_arrears ? 'Yes' : 'No',
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eligible_students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToExcel = () => {
    // Create worksheet data
    const wsData = [
      ['Reg No', 'Name', 'Email', 'Department', 'Batch', 'Semester', 'Section', '10th %', '10th Board', '12th %', '12th Board', 'CGPA', 'GPA', 'Arrears History', 'Arrears Count', 'Standing Arrears', 'Standing Count', 'Gender', 'Blood Group', 'Phone', 'Personal Email'],
      ...students.map(s => [
        s.regno,
        s.username,
        s.email,
        s.department,
        s.batch,
        s.semester,
        s.section || 'N/A',
        s.tenth_percentage || 'N/A',
        s.tenth_board || 'N/A',
        s.twelfth_percentage || 'N/A',
        s.twelfth_board || 'N/A',
        s.cgpa || 'N/A',
        s.gpa || 'N/A',
        s.has_arrears_history ? 'Yes' : 'No',
        s.arrears_history_count || 0,
        s.has_standing_arrears ? 'Yes' : 'No',
        s.standing_arrears_count || 0,
        s.gender || 'N/A',
        s.blood_group || 'N/A',
        s.personal_phone || 'N/A',
        s.personal_email || 'N/A',
      ])
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 8 },
      { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 10 },
      { wch: 12 }, { wch: 15 }, { wch: 25 }
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Eligible Students');

    // Generate Excel file
    const fileName = `eligible_students_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6"
          style={{ marginLeft: "250px", padding: "20px" }}
>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Student Eligibility Filter</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Filter size={20} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
                  <select
                    name="batch"
                    value={filters.batch}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Batches</option>
                    {filterOptions.batches.map(batch => (
                      <option key={batch} value={batch}>{batch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Years</option>
                    {filterOptions.years.map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    name="deptId"
                    value={filters.deptId}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Departments</option>
                    {filterOptions.departments.map(dept => (
                      <option key={dept.Deptid} value={dept.Deptid}>{dept.Dept_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arrears History</label>
                  <select
                    name="hasArrearsHistory"
                    value={filters.hasArrearsHistory}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Standing Arrears</label>
                  <select
                    name="hasStandingArrears"
                    value={filters.hasStandingArrears}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min 10th %</label>
                  <input
                    type="number"
                    name="minTenth"
                    value={filters.minTenth}
                    onChange={handleFilterChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max 10th %</label>
                  <input
                    type="number"
                    name="maxTenth"
                    value={filters.maxTenth}
                    onChange={handleFilterChange}
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min 12th %</label>
                  <input
                    type="number"
                    name="minTwelfth"
                    value={filters.minTwelfth}
                    onChange={handleFilterChange}
                    placeholder="0"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max 12th %</label>
                  <input
                    type="number"
                    name="maxTwelfth"
                    value={filters.maxTwelfth}
                    onChange={handleFilterChange}
                    placeholder="100"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min CGPA</label>
                  <input
                    type="number"
                    name="minCgpa"
                    value={filters.minCgpa}
                    onChange={handleFilterChange}
                    placeholder="0"
                    min="0"
                    max="10"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max CGPA</label>
                  <input
                    type="number"
                    name="maxCgpa"
                    value={filters.maxCgpa}
                    onChange={handleFilterChange}
                    placeholder="10"
                    min="0"
                    max="10"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  <Search size={20} />
                  {loading ? 'Searching...' : 'Search Students'}
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  <X size={20} />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {students.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Eligible Students ({students.length})
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Download size={20} />
                  Export CSV
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  <FileSpreadsheet size={20} />
                  Export Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Reg No</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Department</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Batch</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">10th %</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">12th %</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">CGPA</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Arrears History</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Standing Arrears</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-medium text-gray-900">{student.regno}</td>
                      <td className="px-4 py-3 text-gray-700">{student.username}</td>
                      <td className="px-4 py-3 text-gray-700">{student.email}</td>
                      <td className="px-4 py-3 text-gray-700">{student.department}</td>
                      <td className="px-4 py-3 text-gray-700">{student.batch}</td>
                      <td className="px-4 py-3 text-gray-700">{student.tenth_percentage || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{student.twelfth_percentage || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{student.cgpa || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.has_arrears_history 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {student.has_arrears_history ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.has_standing_arrears 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {student.has_standing_arrears ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && students.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No students found. Please apply filters and search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFilterPage;