'use client';

import React, { useState } from 'react';

interface TeamMember {
  id?: string;
  displayName?: string;
  email?: string;
  role?: string;
  joinedAt?: number;
  updatedAt?: number;
}

interface TeamMemberFormProps {
  member?: TeamMember;
  onSave: (member: Omit<TeamMember, 'id' | 'joinedAt' | 'updatedAt'>) => Promise<boolean>;
  onCancel: () => void;
  roles: string[];
  isLoading?: boolean;
}

export function TeamMemberForm({ member, onSave, onCancel, roles, isLoading = false }: TeamMemberFormProps) {
  const [formData, setFormData] = useState({
    displayName: member?.displayName || '',
    email: member?.email || '',
    role: member?.role || 'member',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const success = await onSave({
      displayName: formData.displayName.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
    });

    if (success) {
      onCancel(); // Close form on success
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {member ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.displayName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter display name"
                disabled={isLoading}
              />
              {errors.displayName && (
                <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
                disabled={isLoading || !!member} // Disable email editing for existing members
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
              {member && (
                <p className="text-gray-500 text-sm mt-1">Email cannot be changed for existing members</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role}</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {member ? 'Update Member' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmationProps {
  member: TeamMember;
  onConfirm: () => Promise<boolean>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmation({ member, onConfirm, onCancel, isLoading = false }: DeleteConfirmationProps) {
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onCancel(); // Close modal on success
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-red-600">Delete Team Member</h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to remove <strong>{member.displayName || member.email}</strong> from the team?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone. The member will lose access to all team resources.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            Delete Member
          </button>
        </div>
      </div>
    </div>
  );
}