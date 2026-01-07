"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, Plus, Search, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/ui/sidebar"
import api from "@/lib/api"

// Interfaces
interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  standard?: {
    id: string
    name: string
  } | null
  studentSection?: {
    id: string
    name: string
  } | null
}

interface Standard {
  id: string
  name: string
  sections: Section[]
}

interface Section {
  id: string
  name: string
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

interface StudentsResponse {
  students: Student[]
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

export default function StudentDashboard() {
  const router = useRouter()

  // State for students data
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // State for standards/grades data
  const [standards, setStandards] = useState<Standard[]>([])
  const [allSections, setAllSections] = useState<Section[]>([])
  const [availableSections, setAvailableSections] = useState<Section[]>([])

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination state (frontend)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

      // Extract all sections from all standards
      const allSectionsFromStandards: Section[] = []
      allStandards.forEach(standard => {
        if (standard.sections) {
          allSectionsFromStandards.push(...standard.sections)
        }
      })
      setAllSections(allSectionsFromStandards)

      console.log('Fetched standards with sections:', allStandards)
      console.log('All sections extracted:', allSectionsFromStandards)

    } catch (err) {
      console.error('Error fetching standards:', err)
    }
  }, [])

  // Fetch students from API
  const fetchStudents = useCallback(async (search = "") => {
    try {
      setLoading(true)
      let url = `/teacher/students`

      if (search.trim()) {
        url += `?search=${encodeURIComponent(search.trim())}`
      }

      const response = await api.get<ApiResponse<StudentsResponse>>(url)

      if (response.data.success) {
        const studentsData = response.data.data.students
        setStudents(studentsData)
      }
    } catch (err) {
      setError('Failed to fetch students')
      console.error('Error fetching students:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Get sections for a specific grade
  const getSectionsForGrade = useCallback((gradeName: string): Section[] => {
    const selectedStandard = standards.find(standard => standard.name === gradeName)
    return selectedStandard?.sections || []
  }, [standards])

  // Update available sections when grade changes
  useEffect(() => {
    if (selectedGrade) {
      const sectionsForGrade = getSectionsForGrade(selectedGrade)
      setAvailableSections(sectionsForGrade)

      // Reset section selection if current selection is not available for this grade
      if (selectedSection && !sectionsForGrade.find(section => section.name === selectedSection)) {
        setSelectedSection("")
      }
    } else {
      setAvailableSections(allSections)
    }
  }, [selectedGrade, getSectionsForGrade, allSections, selectedSection])

  // Filter students based on grade, section, and search query
  const applyFilters = useCallback(() => {
    let filtered = students

    if (selectedGrade) {
      // Filter by standard name directly (with null check)
      filtered = filtered.filter(student => student.standard?.name === selectedGrade)
    }

    if (selectedSection) {
      // Filter by section name directly (with null check)
      filtered = filtered.filter(student => student.studentSection?.name === selectedSection)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (student) =>
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredStudents(filtered)
  }, [students, selectedGrade, selectedSection, searchQuery])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchStandardsWithSections(),
        fetchStudents()
      ])
    }
    loadInitialData()
  }, [fetchStandardsWithSections, fetchStudents])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [applyFilters])

  // Handle search with debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchStudents])

  // Calculate paginated students (frontend pagination)
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const totalCount = filteredStudents.length

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 p-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                <p className="text-gray-600">Loading students...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Students</h1>

                <div className="flex items-center gap-3">
                  {/* Grade Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-between min-w-[140px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                        {selectedGrade || "Select Grade"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[140px] bg-white border border-gray-200 shadow-lg rounded-md p-1 max-h-60 overflow-y-auto z-50"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedGrade("")
                          setSelectedSection("") // Reset section when clearing grade
                        }}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm"
                      >
                        All Grades
                      </DropdownMenuItem>
                      {standards.map((standard) => (
                        <DropdownMenuItem
                          key={standard.id}
                          onClick={() => {
                            console.log('Selected standard:', standard.name)
                            setSelectedGrade(standard.name)
                            setSelectedSection("") // Reset section when grade changes
                          }}
                          className={`px-3 py-2 text-sm cursor-pointer rounded-sm ${selectedGrade === standard.name
                            ? "bg-[var(--primary-500)] text-[color:var(--primary-foreground)]"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {standard.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Section Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-between min-w-[140px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                        {selectedSection || "Select Section"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[140px] bg-white border border-gray-200 shadow-lg rounded-md p-1 max-h-60 overflow-y-auto z-50"
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <DropdownMenuItem
                        onClick={() => setSelectedSection("")}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer rounded-sm"
                      >
                        All Sections
                      </DropdownMenuItem>
                      {availableSections.length > 0 ? (
                        availableSections.map((section) => (
                          <DropdownMenuItem
                            key={section.id}
                            onClick={() => setSelectedSection(section.name)}
                            className={`px-3 py-2 text-sm cursor-pointer rounded-sm ${selectedSection === section.name
                              ? "bg-[var(--primary-500)] text-[color:var(--primary-foreground)]"
                              : "text-gray-700 hover:bg-gray-50"
                              }`}
                          >
                            Section {section.name}
                          </DropdownMenuItem>
                        ))
                      ) : selectedGrade ? (
                        <DropdownMenuItem className="px-3 py-2 text-sm text-gray-500 cursor-default">
                          No sections available for {selectedGrade}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="px-3 py-2 text-sm text-gray-500 cursor-default">
                          Select a grade first
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add New User Button */}
                  <Button
                    onClick={() => router.push('/students/add')}
                    className="border-0 rounded-lg px-4 py-2 button-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add new user
                  </Button>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users here"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Name</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Class</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Section</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Email ID</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="py-4 px-6 font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">{student.standard?.name || 'No Class'}</TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">{student.studentSection?.name || 'No Section'}</TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">{student.email}</TableCell>
                        <TableCell className="py-4 px-6">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/students/${student.id}`)}
                            className="border-0 rounded-lg px-4 py-1 button-primary"
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border border-gray-300"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="border border-gray-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
