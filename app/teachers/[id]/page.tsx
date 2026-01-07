"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ArrowLeft, Calendar, User, GraduationCap, FileText, FolderOpen, Loader2, ChevronDown, ChevronRight } from "lucide-react"
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
  exams: Array<{
    id: string
    title: string
    topic: string
    difficulty: string
    isActive: boolean
    createdAt: string
  }>
  projects: Array<{
    id: string
    title: string
    class: string
    persona: string
    createdAt: string
  }>
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

export default function TeacherDetailPage() {
  const router = useRouter()
  const params = useParams()
  const teacherId = params.id as string

  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Collapsible sections state
  const [isExamsOpen, setIsExamsOpen] = useState(true)
  const [isProjectsOpen, setIsProjectsOpen] = useState(true)

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!teacherId) return

      try {
        setLoading(true)
        const response = await api.get<ApiResponse<{ teacher: Teacher }>>(`/teacher/teachers/${teacherId}`)

        if (response.data.success) {
          setTeacher(response.data.data.teacher)
        } else {
          setError('Failed to fetch teacher details')
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error && 'response' in err
          ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch teacher details'
          : 'Failed to fetch teacher details'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchTeacher()
  }, [teacherId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleBack = () => {
    router.push('/teachers')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-gray-600">Loading teacher details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !teacher) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error || 'Teacher not found'}</p>
              </div>
            </div>
            <Button
              onClick={handleBack}
              className="border-0 rounded-lg px-4 py-2 button-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teachers
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="border border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {teacher.firstName} {teacher.lastName}
              </h1>
            </div>
          </div>

          {/* Teacher Information Card */}
          <Card className="border-0 shadow-sm">
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{teacher.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{teacher.institution.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Joined {formatDate(teacher.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="ml-auto">
                  <Badge variant={teacher.isActive ? "default" : "secondary"}>
                    {teacher.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exams Section */}
          <Collapsible open={isExamsOpen} onOpenChange={setIsExamsOpen}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Exams Created ({teacher.exams.length})
                    </div>
                    {isExamsOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {teacher.exams.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No exams created yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teacher.exams.map((exam) => (
                        <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{exam.title}</h4>
                              <Badge variant={exam.isActive ? "default" : "secondary"}>
                                {exam.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">Topic: {exam.topic}</p>
                            <p className="text-sm text-gray-600">Difficulty: {exam.difficulty}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {formatDate(exam.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Projects Section */}
          <Collapsible open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <Card className="border-0 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      Projects Created ({teacher.projects.length})
                    </div>
                    {isProjectsOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {teacher.projects.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No projects created yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teacher.projects.map((project) => (
                        <div key={project.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <Badge variant="outline">{project.persona}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">Class: {project.class}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {formatDate(project.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
