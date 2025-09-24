import React, { useState } from 'react';
import { Eye, Pencil, Trash2, Plus, X, Search, Filter, Download, ChevronUp, ChevronDown, User } from 'lucide-react';

// FormField Component
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
  options = [],
  rows = 3,
  error = '',
  disabled = false,
}) => {
  const renderField = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gray-50 focus:bg-white resize-none"
          />
        );
      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gray-50 focus:bg-white"
          >
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={value || false}
              onChange={onChange}
              disabled={disabled}
              className="h-5 w-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 transition-all duration-200"
            />
            <label htmlFor={name} className="ml-3 text-gray-700 font-medium">
              {label}
            </label>
          </div>
        );
      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 bg-gray-50 focus:bg-white"
          />
        );
    }
  };

  return (
    <div className="mb-6">
      {type !== 'checkbox' && (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-3">
          {label} {required && <span className="text-red-500 text-lg">*</span>}
        </label>
      )}
      {renderField()}
      {error && <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};
export default FormField;