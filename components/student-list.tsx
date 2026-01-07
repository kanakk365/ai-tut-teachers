"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import api from "@/lib/axios"

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  photoUrl?: string;
  isActive: boolean;
  institution: {
    id: string;
    name: string;
  };
  standard: {
    id: string;
    name: string;
  };
  studentSection: {
    id: string;
    name: string;
  };
}

interface StudentsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    students: Student[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

interface StudentListProps {
  grade?: number;
  section?: string;
  sectionId?: number;
  onAssignExam?: () => void;
  onBack?: () => void;
  onStudentsSelect?: (studentIds: number[]) => void;
  selectedStudents?: number[];
}

export function StudentList({ grade, section, sectionId, onAssignExam, onBack, onStudentsSelect, selectedStudents: externalSelectedStudents }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStudents = useCallback(async (stdName: string, secName: string) => {
    try {
      setLoading(true);
      let allStudents: Student[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await api.get<StudentsResponse>(
          `/teacher/students?page=${currentPage}&limit=10&standardName=${stdName}&sectionName=${secName}`
        );

        if (response.data.success) {
          allStudents = [...allStudents, ...response.data.data.students];

          // Check if there are more pages
          if (currentPage >= response.data.data.pagination.totalPages) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else {
          hasMorePages = false;
          setError('Failed to fetch students');
        }
      }

      setStudents(allStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (grade && section) {
      fetchAllStudents(grade.toString(), section);
    } else if (sectionId) {
      // For exam assignment, we might need to fetch students by sectionId
      // For now, we'll just show empty list until proper API is implemented
      setStudents([]);
      setLoading(false);
    }
  }, [grade, section, sectionId, fetchAllStudents]);

  const handleStudentSelection = (studentId: string) => {
    const newSelection = selectedStudents.includes(studentId)
      ? selectedStudents.filter(id => id !== studentId)
      : [...selectedStudents, studentId];

    setSelectedStudents(newSelection);

    // If we have an external callback for exam assignment, convert string IDs to numbers and call it
    if (onStudentsSelect) {
      const numericIds = newSelection.map(id => parseInt(id)).filter(id => !Number.isNaN(id));
      onStudentsSelect(numericIds);
    }
  };

  const handleAssignToAll = () => {
    const newSelection = selectedStudents.length === students.length ? [] : students.map(s => s.id);
    setSelectedStudents(newSelection);

    // If we have an external callback for exam assignment, convert string IDs to numbers and call it
    if (onStudentsSelect) {
      const numericIds = newSelection.map(id => parseInt(id)).filter(id => !Number.isNaN(id));
      onStudentsSelect(numericIds);
    }
  };

  const handleProceedToExamAssignment = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    // Store selected students for exam assignment
    const selectionData = {
      grade: grade,
      section: section,
      selectedStudents: students.filter(s => selectedStudents.includes(s.id))
    };
    sessionStorage.setItem('selectedStudentsForExam', JSON.stringify(selectionData));
    onAssignExam?.();
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Students - Grade {grade}, Section {section}</h1>
              <button
                type="button"
                onClick={onBack}
                className="mt-2 text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back to Section Selection
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="button-primary rounded-md px-4 py-2 text-sm font-medium shadow"
                onClick={handleAssignToAll}
              >
                {selectedStudents.length === students.length ? 'Deselect All' : '+ Assign to all'}
              </Button>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 w-80 h-10 rounded-full bg-gray-100 border-0"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700 font-medium py-4 pl-6">Name</TableHead>
                  <TableHead className="text-gray-700 font-medium">Class</TableHead>
                  <TableHead className="text-gray-700 font-medium">Email ID</TableHead>
                  <TableHead className="text-gray-700 font-medium">Phone Number</TableHead>
                  <TableHead className="text-gray-700 font-medium">Status</TableHead>
                  <TableHead className="text-gray-700 font-medium pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="border-b last:border-b-0">
                    <TableCell className="py-6 pl-6 text-gray-900">{student.firstName} {student.lastName}</TableCell>
                    <TableCell className="text-gray-600">{student.standard.name}</TableCell>
                    <TableCell className="text-gray-600">{student.email}</TableCell>
                    <TableCell className="text-gray-600">{student.phone}</TableCell>
                    <TableCell className="text-gray-600">{student.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleStudentSelection(student.id)}
                          className={`px-3 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none transition ${selectedStudents.includes(student.id)
                              ? 'button-primary'
                              : 'bg-[var(--primary-50)] text-[color:var(--primary-700)] border border-[color:var(--primary-200)] hover:bg-[var(--primary-100)]'
                            }`}
                        >
                          {selectedStudents.includes(student.id) ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {students.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {students.length} students
                {selectedStudents.length > 0 && (
                  <span className="ml-4 text-[color:var(--primary-600)] font-medium">
                    {selectedStudents.length} selected
                  </span>
                )}
              </div>
              <Button
                onClick={handleProceedToExamAssignment}
                disabled={selectedStudents.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Exam to Selected Students
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
