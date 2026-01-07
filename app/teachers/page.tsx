"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Loader2, Plus, User } from "lucide-react"
import { Sidebar } from "@/components/ui/sidebar"
import api from "@/lib/api"

// Interfaces
interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  institution: {
    id: string
    name: string
  }
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

interface TeachersResponse {
  teachers: Teacher[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
  }
}

export default function TeachersDashboard() {
  const router = useRouter()

  // State for teachers data
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState("")

  // Fetch teachers from API
  const fetchTeachers = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true)
      let url = `/teacher/teachers?page=${page}&limit=${limit}`

      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`
      }

      const response = await api.get<ApiResponse<TeachersResponse>>(url)

      if (response.data.success) {
        const teachersData = response.data.data.teachers
        setTeachers(teachersData)
        setCurrentPage(response.data.data.pagination.currentPage)
        setTotalPages(response.data.data.pagination.totalPages)
        setTotalCount(response.data.data.pagination.totalCount)
      }
    } catch (err) {
      setError('Failed to fetch teachers')
      console.error('Error fetching teachers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter teachers based on search query
  const applyFilters = useCallback(() => {
    let filtered = teachers

    if (searchQuery) {
      filtered = filtered.filter(
        (teacher) =>
          `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTeachers(filtered)
  }, [teachers, searchQuery])

  // Load initial data
  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Handle search with debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchTeachers(1, searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, fetchTeachers])

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchTeachers(page, searchQuery)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear any previous error messages when user starts typing
    if (submitError) setSubmitError("")
    if (submitSuccess) setSubmitSuccess("")
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setSubmitError("Please fill in all fields")
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError("")

      const response = await api.post('/teacher/teacher', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      })

      if (response.data.success) {
        setSubmitSuccess("Teacher created successfully!")
        setFormData({ name: "", email: "", password: "" })

        // Close modal after a short delay
        setTimeout(() => {
          setIsModalOpen(false)
          setSubmitSuccess("")
          // Refresh the teachers list
          fetchTeachers(currentPage, searchQuery)
        }, 1500)
      } else {
        setSubmitError(response.data.message || "Failed to create teacher")
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || "Failed to create teacher")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when modal opens
  const handleModalOpen = (open: boolean) => {
    setIsModalOpen(open)
    if (open) {
      setFormData({ name: "", email: "", password: "" })
      setSubmitError("")
      setSubmitSuccess("")
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
                <p className="text-gray-600">Loading teachers...</p>
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
                <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>

                <div className="flex items-center gap-3">
                  {/* Add New Teacher Button */}
                  <Dialog open={isModalOpen} onOpenChange={handleModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="border-0 rounded-lg px-4 py-2 button-primary">
                        <Plus className="h-4 w-4 mr-2" />
                        Add new teacher
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Teacher</DialogTitle>
                        <DialogDescription>
                          Create a new teacher account with the required information.
                        </DialogDescription>
                      </DialogHeader>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Message */}
                        {submitError && (
                          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                            <p className="text-sm text-red-700">{submitError}</p>
                          </div>
                        )}

                        {/* Success Message */}
                        {submitSuccess && (
                          <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                            <p className="text-sm text-green-700">{submitSuccess}</p>
                          </div>
                        )}

                        {/* Name Field */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter teacher's full name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            disabled={isSubmitting}
                            required
                          />
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="teacher@school.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            disabled={isSubmitting}
                            required
                          />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter secure password"
                            value={formData.password}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            disabled={isSubmitting}
                            required
                          />
                          <p className="text-xs text-gray-500">
                            Password must be at least 8 characters long
                          </p>
                        </div>

                        <DialogFooter className="gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="button-primary"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Teacher
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search teachers here"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Teachers Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Name</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Email ID</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Institution</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Status</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Created</TableHead>
                      <TableHead className="font-medium text-gray-700 py-4 px-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="py-4 px-6 font-medium text-gray-900">
                          {teacher.firstName} {teacher.lastName}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">{teacher.email}</TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">{teacher.institution.name}</TableCell>
                        <TableCell className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${teacher.isActive
                              ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {teacher.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-gray-600">
                          {new Date(teacher.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/teachers/${teacher.id}`)}
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
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
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
