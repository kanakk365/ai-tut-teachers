'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';

interface Standard {
  id: string;
  name: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  standardId: string;
  createdAt: string;
  updatedAt: string;
  standard?: {
    id: string;
    name: string;
  };
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

interface StandardsResponse {
  standards: Standard[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

interface SectionsResponse {
  sections: Section[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

export default function StandardsPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [addingClass, setAddingClass] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['A', 'B']);

  // UI states
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all standards from all pages
  const fetchAllStandards = useCallback(async () => {
    try {
      let allStandards: Standard[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const url = currentPage === 1 ? '/teacher/standards' : `/teacher/standards?page=${currentPage}`;
        const response = await api.get<ApiResponse<StandardsResponse>>(url);

        if (response.data.success) {
          allStandards = [...allStandards, ...response.data.data.standards];
          totalPages = response.data.data.pagination.totalPages;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= totalPages);

      setStandards(allStandards);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch standards'
        : 'Failed to fetch standards';
      setError(errorMessage);
    }
  }, []);

  // Fetch all sections from all pages
  const fetchAllSections = useCallback(async () => {
    try {
      let allSections: Section[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const url = currentPage === 1 ? '/teacher/sections' : `/teacher/sections?page=${currentPage}`;
        const response = await api.get<ApiResponse<SectionsResponse>>(url);

        if (response.data.success) {
          allSections = [...allSections, ...response.data.data.sections];
          totalPages = response.data.data.pagination.totalPages;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= totalPages);

      setSections(allSections);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch sections'
        : 'Failed to fetch sections';
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAllStandards(), fetchAllSections()]);
      setLoading(false);
    };

    fetchData();
  }, [fetchAllStandards, fetchAllSections]);

  const handleAddClass = async () => {
    if (!newClassName.trim()) {
      setError('Please enter a class name');
      return;
    }

    if (selectedSections.length === 0) {
      setError('Please select at least one section');
      return;
    }

    setAddingClass(true);
    setError('');
    setSuccess('');

    try {
      // First, create the standard (class)
      const standardResponse = await api.post<ApiResponse<{ standard: Standard }>>('/teacher/standards', {
        name: newClassName.trim(),
      });

      if (standardResponse.data.success) {
        const newStandardId = standardResponse.data.data.standard.id;

        // Create the selected sections
        const sectionPromises = selectedSections.map(sectionName =>
          api.post<ApiResponse<{ section: Section }>>('/teacher/sections', {
            name: sectionName,
            standardId: newStandardId,
          })
        );

        await Promise.all(sectionPromises);

        const sectionsList = selectedSections.join(', ');
        setSuccess(`Class "${newClassName}" created successfully with sections ${sectionsList}!`);
        setNewClassName('');
        setSelectedSections(['A', 'B']);
        setShowModal(false);
        await Promise.all([fetchAllStandards(), fetchAllSections()]); // Refresh data
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create class'
        : 'Failed to create class';
      setError(errorMessage);
    } finally {
      setAddingClass(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setNewClassName('');
    setSelectedSections(['A', 'B']);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setNewClassName('');
    setSelectedSections(['A', 'B']);
  };

  const toggleSection = (section: string) => {
    setSelectedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Group sections by standard
  const getSectionsForStandard = (standardId: string) => {
    return sections.filter(section => section.standardId === standardId);
  };

  // Filter standards based on search
  const filteredStandards = standards.filter(standard =>
    standard.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading standards...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-[var(--primary-500)] text-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">🎓 Classes Management</h1>
                <p className="text-blue-100 text-lg">Create and manage your institution's classes with automatic sections</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{standards.length}</div>
                <div className="text-blue-100">Total Classes</div>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {(error || success) && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-3">❌</span>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="bg-[var(--primary-50)] border-l-4 border-[var(--primary-400)] p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-[color:var(--primary-500)] text-xl mr-3">✅</span>
                    <p className="text-[color:var(--primary-700)] font-medium">{success}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <button
              type="button"
              onClick={openModal}
              className="bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-[var(--primary-600)] hover:to-[var(--primary-700)] transition-all duration-200 flex items-center space-x-2"
            >
              <span className="text-xl">➕</span>
              <span>Add New Class</span>
            </button>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent shadow-sm"
                />
                <span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
              </div>
            </div>
          </div>

          {/* Add Class Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                    <span className="text-[color:var(--primary-500)] mr-3 text-3xl">🎓</span>
                    Add New Class
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="className" className="block text-sm font-semibold text-gray-700 mb-3">
                      Class Name
                    </label>
                    <input
                      id="className"
                      type="text"
                      placeholder="e.g., 1st Grade, 2nd Grade, Class 10"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-all duration-200 shadow-sm text-lg"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newClassName.trim() && selectedSections.length > 0) {
                          handleAddClass();
                        }
                      }}
                    />
                  </div>

                  <div>
                    <div className="block text-sm font-semibold text-gray-700 mb-3">
                      Select Sections
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => toggleSection(section)}
                          className={`py-2 px-4 rounded-lg border-2 font-semibold transition-all duration-200 ${selectedSections.includes(section)
                              ? 'bg-[var(--primary-500)] text-[color:var(--primary-foreground)] border-[var(--primary-500)] shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]'
                            }`}
                        >
                          {section}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Select the sections you want to create for this class.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleAddClass}
                    disabled={addingClass || !newClassName.trim() || selectedSections.length === 0}
                    className="flex-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white py-3 px-6 rounded-xl font-semibold hover:from-[var(--primary-600)] hover:to-[var(--primary-700)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center"
                  >
                    {addingClass ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✨</span>
                        Create Class
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={addingClass}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Standards List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="text-[color:var(--primary-500)] mr-3">🎓</span>
                  All Classes
                </h3>
                <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                  {filteredStandards.length} classes • {sections.length} total sections
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredStandards.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-gray-300 text-8xl mb-4">🎓</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    {searchTerm ? 'No classes found' : 'No classes yet'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Start by creating your first class. Each class will automatically include sections A, B, C, and D.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredStandards.map((standard, index) => {
                    const standardSections = getSectionsForStandard(standard.id);
                    return (
                      <div
                        key={standard.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                              style={{
                                background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                                color: "var(--primary-foreground)",
                              }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-gray-800">{standard.name}</h4>
                              <p className="text-sm text-gray-500">
                                Created on {new Date(standard.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {standardSections.length} section{standardSections.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        {standardSections.length > 0 ? (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Sections</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                              {standardSections.map((section) => (
                                <div
                                  key={section.id}
                                  className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:shadow-md transition-all duration-200 hover:border-[var(--primary-300)]"
                                >
                                  <div className="font-bold text-gray-800 text-lg">Section {section.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(section.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <span className="text-yellow-600 text-sm font-medium">
                              No sections found for this class.
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
