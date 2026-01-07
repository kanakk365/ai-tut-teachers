'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';

interface Standard {
  id: string
  name: string
  institutionId: string
  createdAt: string
  updatedAt: string
  sections: Section[]
}

interface Section {
  id: string
  name: string
  createdAt: string
}

interface StandardsResponse {
  standards: Standard[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dobError, setDobError] = useState('');

  // Standards and sections data
  const [standards, setStandards] = useState<Standard[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    contactNumber: '',
    gradeClass: '',
    section: '',
    photo: null as File | null
  });

  const [showPassword, setShowPassword] = useState(false);

  const maxDob = useMemo(() => new Date().toISOString().split('T')[0], []);
  const minDob = '1900-01-01';

  const validateDob = useCallback((value: string) => {
    if (!value) {
      return '';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'Please enter a valid date of birth (YYYY-MM-DD).';
    }
    const [year, month, day] = value.split('-').map(Number);
    if ([year, month, day].some(part => Number.isNaN(part))) {
      return 'Please enter a valid date of birth.';
    }
    const candidate = new Date(value);
    if (Number.isNaN(candidate.getTime()) || candidate.toISOString().slice(0, 10) !== value) {
      return 'Please enter a valid date of birth.';
    }
    const minYear = Number(minDob.split('-')[0]);
    const maxYear = Number(maxDob.split('-')[0]);
    if (year < minYear || year > maxYear || value < minDob || value > maxDob) {
      return `Date of birth must be between ${minDob} and ${maxDob}.`;
    }
    return '';
  }, [maxDob, minDob]);

  const handleDobChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, dob: value }));
    setDobError(validateDob(value));
  }, [validateDob]);

  // Fetch all standards with their sections from API
  const fetchStandardsWithSections = useCallback(async () => {
    try {
      let allStandards: Standard[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const response = await api.get<ApiResponse<StandardsResponse>>(
          `/teacher/standards?page=${currentPage}`
        )

        if (response.data.success) {
          allStandards = [...allStandards, ...response.data.data.standards]

          // Check if there are more pages
          if (currentPage >= response.data.data.pagination.totalPages) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else {
          hasMorePages = false
        }
      }

      setStandards(allStandards)

    } catch (err) {
      console.error('Error fetching standards:', err)
    }
  }, [])

  // Get sections for a specific grade
  const getSectionsForGrade = useCallback((gradeName: string): Section[] => {
    const selectedStandard = standards.find(standard => standard.name === gradeName)
    return selectedStandard?.sections || []
  }, [standards])

  // Update available sections when grade changes
  useEffect(() => {
    if (formData.gradeClass) {
      const sectionsForGrade = getSectionsForGrade(formData.gradeClass)
      setAvailableSections(sectionsForGrade)

      // Reset section selection if current selection is not available for this grade
      if (formData.section && !sectionsForGrade.find(section => section.name === formData.section)) {
        setFormData(prev => ({ ...prev, section: '' }))
      }
    } else {
      setAvailableSections([])
    }
  }, [formData.gradeClass, formData.section, getSectionsForGrade])

  // Load initial data
  useEffect(() => {
    fetchStandardsWithSections()
  }, [fetchStandardsWithSections])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.gradeClass || !formData.section) {
      setError('Please fill in all required fields');
      return;
    }
    const dobValidationMessage = validateDob(formData.dob);
    if (dobValidationMessage) {
      setDobError(dobValidationMessage);
      setError(dobValidationMessage);
      return;
    }
    setDobError('');

    setLoading(true);

    try {
      // Use firstName and lastName directly from form data
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();

      // Find the selected standard and section IDs
      const selectedStandard = standards.find(s => s.name === formData.gradeClass);
      const selectedSection = availableSections.find(s => s.name === formData.section);

      if (!selectedStandard || !selectedSection) {
        setError('Invalid grade or section selection');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', firstName);
      formDataToSend.append('lastName', lastName);
      formDataToSend.append('email', formData.email.trim());
      formDataToSend.append('password', formData.password.trim());
      formDataToSend.append('dob', formData.dob);
      formDataToSend.append('gender', formData.gender.toUpperCase());
      formDataToSend.append('phone', formData.contactNumber);

      // Use actual standard and section IDs
      formDataToSend.append('standardId', selectedStandard.id);
      formDataToSend.append('sectionId', selectedSection.id);

      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await api.post('/teacher/students', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Student registered successfully!');
        setTimeout(() => {
          router.push('/students');
        }, 2000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to register student'
        : 'Failed to register student';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-white py-8">
          {/* Header */}
          <div className="mb-12">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Back to Students</span>
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Register a student</h1>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div
              className="mb-6 p-4 border rounded-lg bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border-[color:var(--primary-200)] text-[color:var(--primary-700)]"
            >
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="max-w-6xl mx-auto px-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* First Row: First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                    placeholder="First name of the student"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                    placeholder="Last name of the student"
                    required
                  />
                </div>
              </div>

              {/* Second Row: Email and Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <title>Hide password</title>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <title>Show password</title>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Third Row: Gender and Contact Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' | 'Other' })}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200 appearance-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Dropdown arrow</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                    placeholder="Type contact no."
                  />
                </div>
              </div>

              {/* Fourth Row: Date of Birth and Upload Photo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleDobChange(e.target.value)}
                    min={minDob}
                    max={maxDob}
                    className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200"
                    placeholder="Enter DOB"
                  />
                  {dobError && (
                    <p className="mt-2 text-sm text-red-600">{dobError}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Photo
                  </label>
                  <div className="relative">
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                      className="sr-only"
                    />
                    <label
                      htmlFor="photo"
                      className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus-within:ring-2 focus-within:ring-[color:var(--primary-500)] focus-within:border-[color:var(--primary-500)] focus-within:bg-white transition-all duration-200 cursor-pointer flex items-center justify-between hover:bg-gradient-to-r hover:from-[color-mix(in_oklch,var(--primary)_10%,white_90%)] hover:to-[color-mix(in_oklch,var(--secondary)_10%,white_90%)]"
                    >
                      <span className={`${formData.photo ? 'text-gray-700' : 'text-gray-500'}`}>
                        {formData.photo ? formData.photo.name : 'Upload photo'}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Upload icon</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </label>
                  </div>
                </div>
              </div>

              {/* Grade and Section Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="gradeClass" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade
                  </label>
                  <div className="relative">
                    <select
                      id="gradeClass"
                      value={formData.gradeClass}
                      onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value, section: '' })}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200 appearance-none"
                      required
                    >
                      <option value="">Select Grade</option>
                      {standards.map((standard) => (
                        <option key={standard.id} value={standard.name}>
                          {standard.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Dropdown arrow</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <div className="relative">
                    <select
                      id="section"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[color-mix(in_oklch,var(--primary)_5%,white_95%)] to-[color-mix(in_oklch,var(--secondary)_5%,white_95%)] border border-[color:var(--primary-200)] rounded-lg focus:ring-2 focus:ring-[color:var(--primary-500)] focus:border-[color:var(--primary-500)] focus:bg-white transition-all duration-200 appearance-none"
                      required
                      disabled={!formData.gradeClass}
                    >
                      <option value="">
                        {formData.gradeClass ? 'Select Section' : 'Select Grade First'}
                      </option>
                      {availableSections.map((section) => (
                        <option key={section.id} value={section.name}>
                          Section {section.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <title>Dropdown arrow</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>


              {/* Submit Buttons */}
              <div className="pt-8 flex gap-6 justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/students')}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="button-primary px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      Adding...
                    </span>
                  ) : (
                    'Add Student'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
