"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/ui/sidebar";
import api from "@/lib/api";
import { Plus, Search } from "lucide-react";

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

interface StudentsResponse {
  students: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
}

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  standardId: string;
  sectionId: string;
  standard: {
    id: string;
    name: string;
  };
  studentSection: {
    id: string;
    name: string;
  };
}

interface Class {
  id: string;
  grade: string;
  totalStudents: number;
  sections: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

const gradeOptions = [
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9th Grade',
  '10th Grade',
  '11th Grade',
  '12th Grade',
  'UG',
  'PG',
];

export default function ClassesPage() {
  const router = useRouter();
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addingClass, setAddingClass] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionStandardId, setSectionStandardId] = useState<string | null>(null);
  const [sectionGradeName, setSectionGradeName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [addingSection, setAddingSection] = useState(false);

  // Teacher Assignment State
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [assignTeacherClass, setAssignTeacherClass] = useState<{id: string, name: string} | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedAssignSections, setSelectedAssignSections] = useState<string[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(false);

  // Fetch all students for a specific standard and section
  const fetchStudentsForSection = useCallback(async (standardName: string, sectionName: string): Promise<number> => {
    try {
      let totalStudents = 0;
      let currentPage = 1;
      let totalPages = 1;

      do {
        const response = await api.get<ApiResponse<StudentsResponse>>(
          `/institution-admin/students?page=${currentPage}&standardName=${encodeURIComponent(standardName)}&sectionName=${encodeURIComponent(sectionName)}`
        );
        
        if (response.data.success) {
          totalStudents += response.data.data.students.length;
          totalPages = response.data.data.pagination.totalPages;
          currentPage++;
        } else {
          break;
        }
      } while (currentPage <= totalPages);

      return totalStudents;
    } catch (err) {
      console.error(`Error fetching students for ${standardName} - ${sectionName}:`, err);
      return 0;
    }
  }, []);

  // Fetch student counts for all sections of a standard
  const fetchStudentCountsForStandard = useCallback(async (standard: Standard, standardSections: Section[]): Promise<number> => {
    try {
      const studentCountPromises = standardSections.map(section => 
        fetchStudentsForSection(standard.name, section.name)
      );
      
      const studentCounts = await Promise.all(studentCountPromises);
      return studentCounts.reduce((total, count) => total + count, 0);
    } catch (err) {
      console.error(`Error fetching student counts for standard ${standard.name}:`, err);
      return 0;
    }
  }, [fetchStudentsForSection]);

  // Fetch all standards from all pages
  const fetchAllStandards = useCallback(async () => {
    try {
      let allStandards: Standard[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const url = currentPage === 1 ? '/institution-admin/standards' : `/institution-admin/standards?page=${currentPage}`;
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
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch classes'
        : 'Failed to fetch classes';
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
        const url = currentPage === 1 ? '/institution-admin/sections' : `/institution-admin/sections?page=${currentPage}`;
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

  // Transform standards and sections into classes data with real student counts
  const transformToClasses = useCallback(async () => {
    try {
      const classesData: Class[] = await Promise.all(
        standards.slice().reverse().map(async (standard) => {
          const standardSections = sections.filter(section => section.standardId === standard.id);
          const sectionNames = standardSections.map(section => section.name).join(', ');
          
          // Get real student count for this standard
          const totalStudents = await fetchStudentCountsForStandard(standard, standardSections);
          
          return {
            id: standard.id,
            grade: standard.name,
            totalStudents,
            sections: sectionNames || 'No sections'
          };
        })
      );
      
      setClasses(classesData);
    } catch (err) {
      console.error('Error transforming classes data:', err);
      setError('Failed to load student counts');
    }
  }, [standards, sections, fetchStudentCountsForStandard]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAllStandards(), fetchAllSections()]);
      setLoading(false);
    };

    fetchData();
  }, [fetchAllStandards, fetchAllSections]);

  useEffect(() => {
    const loadClassesWithStudentCounts = async () => {
      if (standards.length > 0 && sections.length > 0) {
        setLoading(true);
        await transformToClasses();
        setLoading(false);
      }
    };

    loadClassesWithStudentCounts();
  }, [standards, sections, transformToClasses]);

  const handleCreateNewClass = async () => {
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
      const standardResponse = await api.post<ApiResponse<{ standard: Standard }>>('/institution-admin/standards', {
        name: newClassName.trim(),
      });

      if (standardResponse.data.success) {
        const newStandardId = standardResponse.data.data.standard.id;
        
        // Create the selected sections
        const sectionPromises = selectedSections.map(sectionName =>
          api.post<ApiResponse<{ section: Section }>>('/institution-admin/sections', {
            name: sectionName,
            standardId: newStandardId,
          })
        );

        await Promise.all(sectionPromises);
        
        const sectionsList = selectedSections.join(', ');
        setSuccess(`Class "${newClassName}" created successfully with sections ${sectionsList}!`);
        setNewClassName('');
        setSelectedSections([]);
        setShowModal(false);
        // Refresh data
        await Promise.all([fetchAllStandards(), fetchAllSections()]);
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
    setSelectedSections([]);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    setShowModal(false);
    setNewClassName('');
    setSelectedSections([]);
  };

  const openAddSectionModal = (standardId: string, gradeName: string) => {
    setShowSectionModal(true);
    setSectionStandardId(standardId);
    setSectionGradeName(gradeName);
    setNewSectionName('');
    setError('');
    setSuccess('');
  };

  const closeAddSectionModal = () => {
    setShowSectionModal(false);
    setSectionStandardId(null);
    setSectionGradeName('');
    setNewSectionName('');
    setAddingSection(false);
  };

  const handleAddSection = async () => {
    if (!sectionStandardId) {
      setError('Unable to determine the selected grade. Please try again.');
      return;
    }

    if (!newSectionName.trim()) {
      setError('Please enter a section name');
      return;
    }

    setAddingSection(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post<ApiResponse<{ section: Section }>>('/institution-admin/sections', {
        name: newSectionName.trim(),
        standardId: sectionStandardId,
      });

      if (response.data.success) {
        setSuccess(`Section "${newSectionName.trim()}" added to ${sectionGradeName}.`);
        await fetchAllSections();
        closeAddSectionModal();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create section'
        : 'Failed to create section';
      setError(errorMessage);
    } finally {
      setAddingSection(false);
    }
  };

  // Fetch teachers for assignment modal
  const fetchTeachers = useCallback(async (search = '') => {
    try {
      setLoadingTeachers(true);
      let url = `/institution-admin/teachers?page=1&limit=50`; // Fetch first 50 for now, can implement infinite scroll later
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      
      const response = await api.get<ApiResponse<{ teachers: Teacher[] }>>(url); // Adjust response type if needed
      
      if (response.data.success) {
        setTeachers(response.data.data.teachers);
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      // Fail silently for search, or show toast
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  // Debounced search for teachers
  useEffect(() => {
    if (showAssignTeacherModal) {
      const timer = setTimeout(() => {
        fetchTeachers(teacherSearch);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [teacherSearch, showAssignTeacherModal, fetchTeachers]);

  const openAssignTeacherModal = (classId: string, className: string) => {
    setAssignTeacherClass({ id: classId, name: className });
    setShowAssignTeacherModal(true);
    setTeacherSearch('');
    setSelectedTeacherId(null);
    setSelectedAssignSections([]);
    setError('');
    setSuccess('');
    fetchTeachers();
  };

  const closeAssignTeacherModal = () => {
    setShowAssignTeacherModal(false);
    setAssignTeacherClass(null);
    setTeacherSearch('');
    setSelectedTeacherId(null);
    setSelectedAssignSections([]);
  };

  const toggleAssignSection = (sectionId: string) => {
    setSelectedAssignSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId || !assignTeacherClass || selectedAssignSections.length === 0) {
      setError('Please select a teacher and at least one section');
      return;
    }

    setAssigningTeacher(true);
    setError('');
    setSuccess('');

    try {
      const assignments = selectedAssignSections.map(sectionId => ({
        standardId: assignTeacherClass.id,
        sectionId: sectionId
      }));

      const payload = {
        assignments
      };

      const response = await api.post(
        `/institution-admin/teachers/${selectedTeacherId}/assign-sections`, 
        payload
      );

      setSuccess(`Teacher assigned successfully to ${assignTeacherClass.name} sections!`);
      
      // Close modal after short delay
      setTimeout(() => {
        closeAssignTeacherModal();
      }, 1500);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err 
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to assign teacher'
        : 'Failed to assign teacher';
      setError(errorMessage);
    } finally {
      setAssigningTeacher(false);
    }
  };


  const toggleSection = (section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleViewClass = (classId: string) => {
    // Navigate to class details page
    router.push(`/classes/${classId}`);
  };

  // Filter classes based on search
  const filteredClasses = classes.filter(cls =>
    cls.grade.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">All Classes</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={openModal}
                className="button-primary px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create new class
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search class here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-[var(--primary-50)] border border-[color:var(--primary-200)] text-[color:var(--primary-700)] rounded-lg">
              {success}
            </div>
          )}

          {/* Add Class Modal */}
          {showModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-lg w-full mx-4 transform transition-all duration-300 ease-out scale-100 opacity-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] bg-clip-text text-transparent flex items-center">
                    <span className="mr-4 text-4xl">🎓</span>
                    Add New Class
                  </h3>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label htmlFor="className" className="block text-sm font-bold text-gray-800 mb-4">
                      Class Name
                    </label>
                    <Select
                      value={newClassName || undefined}
                      onValueChange={setNewClassName}
                    >
                      <SelectTrigger
                        id="className"
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] transition-all duration-300 shadow-lg backdrop-blur-sm bg-white/90 text-lg text-left justify-between"
                      >
                        <SelectValue placeholder="Select a grade" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 border-[color:var(--primary-100)] shadow-xl bg-white/95 backdrop-blur-lg">
                        {gradeOptions.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="block text-sm font-bold text-gray-800 mb-4">
                      Select Sections
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section) => (
                        <button
                          key={section}
                          type="button"
                          onClick={() => toggleSection(section)}
                          className={`py-3 px-4 rounded-2xl border-2 font-bold transition-all duration-300 transform hover:scale-105 ${
                            selectedSections.includes(section)
                              ? 'bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] text-[color:var(--primary-foreground)] border-[color:var(--primary-400)] shadow-lg scale-105'
                              : 'bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 hover:border-[color:var(--primary-300)] hover:bg-[color:var(--primary-50)] shadow-md'
                          }`}
                        >
                          {section}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-3 font-medium">
                      Select the sections you want to create for this class.
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={handleCreateNewClass}
                    disabled={addingClass || !newClassName.trim() || selectedSections.length === 0}
                    className="flex-1 bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] text-[color:var(--primary-foreground)] py-4 px-6 rounded-2xl font-bold hover:from-[color:var(--primary-600)] hover:to-[color:var(--primary-700)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center backdrop-blur-sm"
                  >
                    {addingClass ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--primary-foreground)] mr-3"></span>
                        Creating Class...
                      </>
                    ) : (
                      <>
                        <span className="mr-3 text-lg">✨</span>
                        Create Class
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={addingClass}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 font-bold disabled:opacity-50 backdrop-blur-sm bg-white/80 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Section Modal */}
          {showSectionModal && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-lg w-full mx-4 transform transition-all duration-300 ease-out scale-100 opacity-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] bg-clip-text text-transparent flex items-center">
                    <span className="mr-4 text-4xl">🧩</span>
                    Add Section - {sectionGradeName}
                  </h3>
                  <button
                    type="button"
                    onClick={closeAddSectionModal}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="sectionName" className="block text-sm font-bold text-gray-800 mb-3">
                      Section Name
                    </label>
                    <Input
                      id="sectionName"
                      value={newSectionName}
                      onChange={(event) => setNewSectionName(event.target.value)}
                      placeholder="Enter section name (e.g., A, B, C)"
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] transition-all duration-300 shadow-lg backdrop-blur-sm bg-white/90 text-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      Create a new section for {sectionGradeName}. Students can later be assigned to this section.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={handleAddSection}
                    disabled={addingSection}
                    className="flex-1 bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] text-[color:var(--primary-foreground)] py-4 px-6 rounded-2xl font-bold hover:from-[color:var(--primary-600)] hover:to-[color:var(--primary-700)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center backdrop-blur-sm"
                  >
                    {addingSection ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--primary-foreground)] mr-3"></span>
                        Adding Section...
                      </>
                    ) : (
                      <>
                        <span className="mr-3 text-lg">➕</span>
                        Add Section
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={closeAddSectionModal}
                    disabled={addingSection}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 font-bold disabled:opacity-50 backdrop-blur-sm bg-white/80 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Teacher Modal */}
          {showAssignTeacherModal && assignTeacherClass && (
            <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 transform transition-all duration-300 ease-out flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] bg-clip-text text-transparent flex items-center">
                    <span className="mr-4 text-4xl">👨‍🏫</span>
                    Assign Teacher - {assignTeacherClass.name}
                  </h3>
                  <button
                    type="button"
                    onClick={closeAssignTeacherModal}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {/* Teacher Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Select Teacher
                    </label>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search teachers by name..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="pl-10 w-full border-gray-300 rounded-xl"
                      />
                    </div>
                    
                    <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-white shadow-inner">
                      {loadingTeachers ? (
                         <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                      ) : teachers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No teachers found.</div>
                      ) : (
                        teachers.map(teacher => (
                          <div 
                            key={teacher.id}
                            onClick={() => setSelectedTeacherId(teacher.id)}
                            className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                              selectedTeacherId === teacher.id 
                                ? 'bg-[color:var(--primary-50)] border-l-4 border-[color:var(--primary-500)]' 
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-gray-800">{teacher.firstName} {teacher.lastName}</p>
                              <p className="text-sm text-gray-500">{teacher.email}</p>
                            </div>
                            {selectedTeacherId === teacher.id && (
                              <span className="text-[color:var(--primary-600)] font-bold">✓</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Section Selection */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">
                      Select Sections
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sections
                        .filter(s => s.standardId === assignTeacherClass.id)
                        .map(section => (
                          <button
                            key={section.id}
                            type="button"
                            onClick={() => toggleAssignSection(section.id)}
                            className={`py-3 px-4 rounded-xl border-2 font-bold transition-all duration-200 text-left flex items-center justify-between ${
                              selectedAssignSections.includes(section.id)
                                ? 'bg-[color:var(--primary-50)] border-[color:var(--primary-500)] text-[color:var(--primary-800)]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            Section {section.name}
                            {selectedAssignSections.includes(section.id) && (
                              <span className="text-[color:var(--primary-600)] text-lg">✓</span>
                            )}
                          </button>
                        ))
                      }
                      {sections.filter(s => s.standardId === assignTeacherClass.id).length === 0 && (
                        <p className="col-span-3 text-sm text-gray-500">No sections found for this class.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-8 pt-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleAssignTeacher}
                    disabled={assigningTeacher || !selectedTeacherId || selectedAssignSections.length === 0}
                    className="flex-1 bg-gradient-to-r from-[color:var(--primary-500)] to-[color:var(--primary-600)] text-[color:var(--primary-foreground)] py-4 px-6 rounded-2xl font-bold hover:from-[color:var(--primary-600)] hover:to-[color:var(--primary-700)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center backdrop-blur-sm"
                  >
                    {assigningTeacher ? (
                      <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[color:var(--primary-foreground)] mr-3"></span>
                        Assigning...
                      </>
                    ) : (
                      <>
                        <span className="mr-3 text-lg">✅</span>
                        Assign Teacher
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={closeAssignTeacherModal}
                    disabled={assigningTeacher}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50/80 transition-all duration-300 font-bold disabled:opacity-50 backdrop-blur-sm bg-white/80 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--primary-500)]"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-[var(--primary-50)] border-b border-[color:var(--primary-200)]">
                    <th className="text-left py-4 px-6 font-medium text-[color:var(--primary-800)]">Grade</th>
                    <th className="text-left py-4 px-6 font-medium text-[color:var(--primary-800)]">Total Students</th>
                    <th className="text-left py-4 px-6 font-medium text-[color:var(--primary-800)]">Sections</th>
                    <th className="text-left py-4 px-6 font-medium text-[color:var(--primary-800)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500">
                        {searchTerm ? 'No classes found matching your search.' : 'No classes found. Create your first class to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`border-b border-[color:var(--primary-100)] transition-colors hover:bg-[color:var(--primary-100)] ${
                          index % 2 === 0 ? "bg-white" : "bg-[var(--primary-50)]"
                        }`}
                      >
                        <td className="py-4 px-6 text-[color:var(--primary-800)] font-medium">{row.grade}</td>
                        <td className="py-4 px-6 text-[color:var(--primary-700)]">{row.totalStudents}</td>
                        <td className="py-4 px-6 text-[color:var(--primary-700)]">{row.sections}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleViewClass(row.id)}
                              className="button-primary px-4 py-2 rounded-lg shadow-sm"
                            >
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openAddSectionModal(row.id, row.grade)}
                              className="button-primary px-4 py-2 rounded-lg shadow-sm"
                            >
                              Add Section
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openAssignTeacherModal(row.id, row.grade)}
                              className="button-primary px-4 py-2 rounded-lg shadow-sm"
                            >
                              Assign Teacher
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
