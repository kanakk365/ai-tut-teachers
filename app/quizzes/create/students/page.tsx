"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  dob?: string;
  gender?: string;
  phone?: string;
  photoUrl?: string;
  isActive?: boolean;
  institution?: {
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
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

export default function StudentsSelectionPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeInfo, setGradeInfo] = useState({ standardName: '', sectionName: '' });
  const router = useRouter();

  useEffect(() => {
    // Get standardName and sectionName from session storage since we're now in the create flow
    const gradeAndSection = sessionStorage.getItem('quizGradeAndSection');
    if (gradeAndSection) {
      const data = JSON.parse(gradeAndSection);
      const stdName = data.standardName;
      const secName = data.sectionName;

      if (stdName && secName) {
        setGradeInfo({ standardName: stdName, sectionName: secName });
        fetchAllStudents(stdName, secName);
      } else {
        setError('Missing grade or section information');
        setLoading(false);
      }
    } else {
      setError('Missing grade or section information. Please go back and select a grade and section.');
      setLoading(false);
    }
  }, []);

  const fetchAllStudents = async (stdName: string, secName: string) => {
    try {
      setLoading(true);
      let allStudents: Student[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await api.get<StudentsResponse>(
          `/teacher/students?page=${currentPage}&limit=100&standardName=${encodeURIComponent(stdName)}&sectionName=${encodeURIComponent(secName)}`
        );

        if (response.data.success) {
          allStudents = [...allStudents, ...response.data.data.students];

          // Check if there are more pages (handle case where pagination is not present)
          const pagination = response.data.data.pagination;
          if (!pagination || currentPage >= pagination.totalPages) {
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
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAssignToStudent = (studentId: string) => {
    handleStudentSelection(studentId);
  };

  const handleAssignToAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleProceedToQuizCreation = () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    // Get grade and section info from session storage
    const gradeAndSection = sessionStorage.getItem('gradeAndSection');
    if (gradeAndSection) {
      const data = JSON.parse(gradeAndSection);

      // Store selected students and proceed to quiz creation
      const selectionData = {
        standardName: data.standardName,
        sectionName: data.sectionName,
        selectedStudents: students.filter(s => selectedStudents.includes(s.id))
      };
      sessionStorage.setItem('selectedStudentsForQuiz', JSON.stringify(selectionData));
      router.push('/quizzes/quiz-form');
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[color:var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 px-6 lg:px-16">
      <div className="max-w-[1100px] mx-auto">
        <div className="bg-white rounded-2xl border border-[color:var(--primary-100)] shadow-sm p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[color:var(--primary-800)]">Students</h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                className="rounded-md px-4 py-2 button-primary shadow text-sm font-medium"
                onClick={handleAssignToAll}
              >
                + Assign to all
              </Button>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users here"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 w-80 h-10 rounded-full bg-[var(--primary-50)] border border-[color:var(--primary-200)] text-[color:var(--primary-800)] placeholder:text-[color:var(--primary-500)] focus-visible:ring-[color:var(--primary-300)] focus-visible:border-[color:var(--primary-400)]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--primary-50)]">
                  <TableHead className="text-[color:var(--primary-800)] font-medium py-4 pl-6">Name</TableHead>
                  <TableHead className="text-[color:var(--primary-800)] font-medium">Class</TableHead>
                  <TableHead className="text-[color:var(--primary-800)] font-medium">Email ID</TableHead>
                  <TableHead className="text-[color:var(--primary-800)] font-medium">Phone Number</TableHead>
                  <TableHead className="text-[color:var(--primary-800)] font-medium">Status</TableHead>
                  <TableHead className="text-[color:var(--primary-800)] font-medium pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="border-b border-[color:var(--primary-100)] last:border-b-0 hover:bg-[color:var(--primary-100)] transition-colors">
                    <TableCell className="py-6 pl-6 text-[color:var(--primary-800)]">{student.firstName} {student.lastName}</TableCell>
                    <TableCell className="text-[color:var(--primary-700)]">{student.standard.name}</TableCell>
                    <TableCell className="text-[color:var(--primary-700)]">{student.email}</TableCell>
                    <TableCell className="text-[color:var(--primary-700)]">{student.phone || '-'}</TableCell>
                    <TableCell className="text-[color:var(--primary-700)]">{student.isActive !== false ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className="pr-6">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleAssignToStudent(student.id)}
                          className={`px-3 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none transition ${selectedStudents.includes(student.id) ? 'bg-[color:var(--primary-600)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-700)]' : 'bg-[color:var(--primary-500)] text-[color:var(--primary-foreground)] hover:bg-[color:var(--primary-600)]'}`}
                        >
                          {selectedStudents.includes(student.id) ? 'Selected' : 'Assign'}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-[color:var(--primary-700)] mt-6">
            <div>Showing 1–09 of {students.length}</div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-md border border-[color:var(--primary-200)] bg-white text-[color:var(--primary-700)] hover:bg-[color:var(--primary-50)]">←</button>
              <button className="w-8 h-8 rounded-md border border-[color:var(--primary-200)] bg-white text-[color:var(--primary-700)] hover:bg-[color:var(--primary-50)]">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button - appears when students are selected */}
      {selectedStudents.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleAssignToAll}
            className="px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 bg-[color:var(--primary-600)] hover:bg-[color:var(--primary-700)] text-[color:var(--primary-foreground)]"
          >
            Continue ({selectedStudents.length} selected)
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}
