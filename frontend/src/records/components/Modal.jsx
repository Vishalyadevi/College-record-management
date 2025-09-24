import React, { useEffect } from 'react';
import { Eye, Pencil, Trash2, Plus, X, Search, Filter, Download, ChevronUp, ChevronDown, User } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showFooter = true,
  onSubmit = null,
  submitText = 'Save',
  cancelText = 'Cancel',
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden transform transition-all duration-300 scale-100`}>
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-200 text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div onSubmit={handleSubmit}>
          <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
            {children}
          </div>

          {showFooter && (
            <div className="p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
              >
                {cancelText}
              </button>
              {onSubmit && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                >
                  {isSubmitting ? 'Saving...' : submitText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default Modal;