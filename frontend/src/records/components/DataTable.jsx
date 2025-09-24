import React, { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';

const DataTable = ({ 
  data, 
  columns, 
  onView, 
  onEdit, 
  onDelete,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === bValue) return 0;
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : 1;
    } else {
      return aValue > bValue ? -1 : 1;
    }
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow text-center p-8">
        <h3 className="text-lg font-medium text-gray-600 mb-2">No data available</h3>
        <p className="text-gray-500">Add new entries to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <table className="min-w-full table-auto">
          <thead className="bg-blue-500">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.field} 
                  className="px-6 py-3 text-left text-xs font-medium text-white-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
                  onClick={() => handleSort(column.field)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortField === column.field && (
                      <span className="ml-1 text-gray-700">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
                {columns.map((column) => (
                  <td key={`${row.id}-${column.field}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row) : row[column.field]}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(row)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 transition-colors duration-200"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100 transition-colors duration-200"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(row)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;