"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import api from "@/lib/api"

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  standardId: string
  sectionId: string
  standard: {
    id: string
    name: string
  }
  studentSection: {
    id: string
    name: string
  }
}

interface StudentsResponse {
  students: Student[]
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

interface StudentListProps {
  standardName: string
  sectionName: string
  examTitle?: string
  onAssignExam: (students?: Student[]) => void
  onBack: () => void
}

export function StudentList({ standardName, sectionName, examTitle, onAssignExam, onBack }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch all students for the selected standard and section
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      let allStudents: Student[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const response = await api.get<ApiResponse<StudentsResponse>>(
          `/teacher/students?page=${currentPage}&standardName=${encodeURIComponent(standardName)}&sectionName=${encodeURIComponent(sectionName)}`
        )

        if (response.data.success) {
          allStudents = [...allStudents, ...response.data.data.students]

          // Check if there are more pages
          if (currentPage >= response.data.data.pagination.totalPages) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else {
          hasMorePages = false
          setError('Failed to fetch students')
        }
      }

      setStudents(allStudents)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }, [standardName, sectionName])

  useEffect(() => {
    if (standardName && sectionName) {
      fetchStudents()
    }
  }, [fetchStudents, standardName, sectionName])

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading students...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-2xl px-2">
              ‹
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {examTitle ? `${examTitle} - Students` : `Students - ${standardName}, Section ${sectionName}`}
            </h1>
          </div>
        </div>
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-2xl px-2">
            ‹
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {examTitle ? `${examTitle} - Students` : `Students - ${standardName}, Section ${sectionName}`}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => onAssignExam(students)}
            className="px-6 button-primary"
            disabled={students.length === 0}
          >
            + Assign to all ({students.length})
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students here"
              className="pl-10 w-64 border-gray-200 focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-yellow-700 font-medium">
            No students found in {standardName}, Section {sectionName}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          {/* Table */}
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Class</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Email ID</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Section</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.standard.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">Section {student.studentSection.name}</td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: "var(--primary-600)" }}>Active</td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      className="px-4 py-1 text-sm font-medium rounded button-primary"
                      onClick={() => onAssignExam([student])}
                    >
                      Assign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStudents.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-gray-500">No students found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <div>
          Showing {filteredStudents.length} of {students.length} students
          {searchTerm && ` (filtered)`}
        </div>
      </div>
    </div>
  )
}
