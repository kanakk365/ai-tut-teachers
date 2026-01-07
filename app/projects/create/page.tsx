"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SUBJECT_OPTIONS } from "@/lib/subjects"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface ProjectFormData {
  title: string
  class: string
  persona: string
  subject: string
  description: string
}

interface Standard {
  id: string
  name: string
  institutionId: string
  createdAt: string
  updatedAt: string
  sections: {
    id: string
    name: string
    createdAt: string
  }[]
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

export default function CreateProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [standards, setStandards] = useState<Standard[]>([])
  const [loadingStandards, setLoadingStandards] = useState(true)

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    class: '',
    persona: 'Teacher',
    subject: '',
    description: ''
  })

  // Fetch all standards with pagination
  useEffect(() => {
    const fetchAllStandards = async () => {
      try {
        setLoadingStandards(true)
        let allStandards: Standard[] = []
        let totalPages = 1

        // Fetch first page to get total pages
        const firstResponse = await api.get<ApiResponse<StandardsResponse>>(`/teacher/standards?page=1`)

        if (firstResponse.data.success) {
          allStandards = [...firstResponse.data.data.standards]
          totalPages = firstResponse.data.data.pagination.totalPages

          // Fetch remaining pages if any
          if (totalPages > 1) {
            const promises = []
            for (let page = 2; page <= totalPages; page++) {
              promises.push(api.get<ApiResponse<StandardsResponse>>(`/teacher/standards?page=${page}`))
            }

            const responses = await Promise.all(promises)
            responses.forEach(response => {
              if (response.data.success) {
                allStandards = [...allStandards, ...response.data.data.standards]
              }
            })
          }

          setStandards(allStandards)
        }
      } catch (err) {
        console.error('Error fetching standards:', err)
      } finally {
        setLoadingStandards(false)
      }
    }

    fetchAllStandards()
  }, [])

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.class.trim() || !formData.subject.trim()) {
      setError('Title, Grade, and Subject are required')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Prepare the data with standardId instead of class name
      const submitData = {
        ...formData,
        standardId: formData.class, // Use the selected standard ID
        class: standards.find(s => s.id === formData.class)?.name || formData.class // Send the name for API compatibility
      }

      const response = await api.post('/teacher/project', submitData)

      if (response.data.success) {
        setSuccess('Project created successfully!')
        setTimeout(() => {
          router.push('/projects')
        }, 2000)
      } else {
        setError(response.data.message || 'Failed to create project')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create project'
        : 'Failed to create project';
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[color:var(--primary-700)] hover:text-[color:var(--primary-800)] mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
          <p className="text-[color:var(--primary-700)]">Create and assign educational projects to students</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-[var(--primary-50)] border border-[color:var(--primary-200)] text-[color:var(--primary-700)] rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Project Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Law of motion, Solar System Model"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="bg-[var(--primary-50)] border-[color:var(--primary-200)] h-14 px-5 rounded-lg text-[color:var(--primary-800)] placeholder:text-[color:var(--primary-500)] focus-visible:ring-[color:var(--primary-300)] focus-visible:border-[color:var(--primary-400)]"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject *
                </Label>
                <Select
                  value={formData.subject || undefined}
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger id="subject" className="bg-[var(--primary-50)] border-[color:var(--primary-200)] h-14 px-5 rounded-lg text-[color:var(--primary-800)] w-full justify-between text-base min-h-[56px] flex items-center focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-white shadow-lg border border-gray-200">
                    {SUBJECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <Label htmlFor="class" className="text-sm font-medium text-gray-700">
                  Grade *
                </Label>
                <div className="relative">
                  <Select value={formData.class} onValueChange={(value) => handleInputChange('class', value)}>
                    <SelectTrigger className="bg-[var(--primary-50)] border-[color:var(--primary-200)] h-14 px-5 rounded-lg text-[color:var(--primary-800)] w-full justify-between text-base min-h-[56px] flex items-center focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)]">
                      <SelectValue placeholder={loadingStandards ? "Loading grades..." : "Select grade"} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999] bg-white shadow-lg border border-gray-200">
                      {loadingStandards ? (
                        <SelectItem value="loading" disabled>Loading grades...</SelectItem>
                      ) : standards.length > 0 ? (
                        standards.map((standard) => (
                          <SelectItem key={standard.id} value={standard.id}>
                            {standard.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-grades" disabled>No grades available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="persona" className="text-sm font-medium text-gray-700">
                  Created By
                </Label>
                <Input
                  id="persona"
                  placeholder="e.g., Teacher, Admin, Principal"
                  value={formData.persona}
                  onChange={(e) => handleInputChange('persona', e.target.value)}
                  className="bg-[var(--primary-50)] border-[color:var(--primary-200)] h-14 px-5 rounded-lg text-[color:var(--primary-800)] placeholder:text-[color:var(--primary-500)] focus-visible:ring-[color:var(--primary-300)] focus-visible:border-[color:var(--primary-400)]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Project Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project objectives, requirements, and expected outcomes..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-[var(--primary-50)] border-[color:var(--primary-200)] min-h-32 px-5 py-4 rounded-lg text-[color:var(--primary-800)] placeholder:text-[color:var(--primary-500)] resize-none focus-visible:ring-[color:var(--primary-300)] focus-visible:border-[color:var(--primary-400)]"
              />
            </div>

            {/* Project Summary */}
            <div className="bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg p-6">
              <h3 className="text-lg font-medium text-[color:var(--primary-800)] mb-4">Project Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-[color:var(--primary-700)]">Title:</span>
                  <p className="text-[color:var(--primary-800)]">{formData.title || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-[color:var(--primary-700)]">Class:</span>
                  <p className="text-[color:var(--primary-800)]">
                    {formData.class
                      ? standards.find(s => s.id === formData.class)?.name || 'Selected Grade'
                      : 'Not selected'
                    }
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-[color:var(--primary-700)]">Subject:</span>
                  <p className="text-[color:var(--primary-800)]">{formData.subject || 'Not selected'}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-[color:var(--primary-700)]">Created By:</span>
                  <p className="text-[color:var(--primary-800)]">{formData.persona}</p>
                </div>
              </div>
              {formData.description && (
                <div className="mt-4 pt-4 border-t border-[color:var(--primary-200)]">
                  <span className="font-medium text-[color:var(--primary-700)]">Description:</span>
                  <p className="text-[color:var(--primary-800)] mt-1">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-6 pt-12">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-red-500 text-red-500 hover:bg-red-50 bg-white px-10 py-3 h-12 rounded-lg font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="button-primary px-10 py-3 h-12 rounded-lg font-medium disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Creating Project...' : 'Create Project'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
