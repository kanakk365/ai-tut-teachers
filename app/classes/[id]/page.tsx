"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarGraphSection, StudentPerformanceData } from "@/components/ui/barchart"
import { useAuth } from "@/contexts/AuthContext"
import api from '@/lib/api'

interface ClassStatistics {
  standardId: string
  grade: string
  totalStudents: number
  statistics: {
    quizzes: {
      averageScore: number
      totalSubmissions: number
    }
    exams: {
      averageScore: number
      totalSubmissions: number
    }
    projects: {
      completed: number
    }
    overallPerformance: number
  }
}

interface AnalyticsData {
  summary: {
    totalStudents: { count: number; changeFromLastMonth: number }
    totalGrades: { count: number; changeFromLastMonth: number }
    totalSections: { count: number; changeFromLastMonth: number }
    totalTeachers: { count: number; changeFromLastMonth: number }
  }
  totals: {
    institutions: number
    students: number
    grades: number
    sections: number
    teachers: number
    activeStudents: number
    exams: number
    quizzes: number
    customExams: number
    customQuizzes: number
  }
  performanceBySubject: Array<{
    subject: string
    excellent: number
    good: number
    normal: number
    dull: number
    total: number
  }>
  performanceBySubjectByGrade: Array<{
    gradeId: string
    gradeName: string
    subjects: Array<{
      subject: string
      excellent: number
      good: number
      normal: number
      dull: number
      total: number
    }>
  }>
  performanceBySubjectByGradeSection: Array<{
    gradeId: string
    gradeName: string
    sectionId: string
    sectionName: string
    subjects: Array<{
      subject: string
      excellent: number
      good: number
      normal: number
      dull: number
      total: number
    }>
  }>
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}



export default function ClassDetailsPage() {
  const params = useParams()
  const standardId = params.id as string
  const { institution } = useAuth()

  const [classStats, setClassStats] = useState<ClassStatistics | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch class statistics
        const statsResponse = await api.get<ApiResponse<{ stats: ClassStatistics[] }>>(
          `/teacher/class-statistics/${standardId}`
        )

        if (statsResponse.data.success && statsResponse.data.data.stats.length > 0) {
          setClassStats(statsResponse.data.data.stats[0])
        }

        // Fetch analytics data
        if (!institution?.id) {
          setError('Institution information not available')
          return
        }

        const analyticsResponse = await api.get<ApiResponse<AnalyticsData>>(
          `/analytics/institution/${institution.id}`
        )

        if (analyticsResponse.data.success) {
          console.log('Analytics data received:', analyticsResponse.data.data)
          console.log('Current standardId:', standardId)
          console.log('All grade IDs in response:', analyticsResponse.data.data.performanceBySubjectByGrade.map(g => g.gradeId))

          // Debug: Check if we can find the current grade in the response
          const currentGradeData = analyticsResponse.data.data.performanceBySubjectByGrade.find(
            item => item.gradeId === standardId
          )
          console.log('Found current grade data:', currentGradeData)
          console.log('Current grade subjects:', currentGradeData?.subjects)

          setAnalyticsData(analyticsResponse.data.data)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to fetch class data')
      } finally {
        setLoading(false)
      }
    }

    if (standardId) {
      fetchData()
    }
  }, [standardId])


  const handleFilterChange = (filters: { section?: string }) => {
    setSelectedSection(filters.section || "")
  }

  // Get filtered data based on selections
  const getFilteredPerformanceData = (): StudentPerformanceData[] | undefined => {
    if (!analyticsData) return undefined

    if (selectedSection && selectedSection !== 'all-sections') {
      // Filter by section within this grade
      const sectionData = analyticsData.performanceBySubjectByGradeSection.find(
        item => item.sectionId === selectedSection && item.gradeId === standardId
      )
      return sectionData?.subjects
    } else {
      // Return performance data for this grade
      const currentGradeData = analyticsData.performanceBySubjectByGrade.find(
        item => item.gradeId === standardId
      )

      if (currentGradeData) {
        return currentGradeData.subjects
      } else {
        // Grade not found in response - return undefined to indicate no data available
        console.warn(`Grade ${standardId} not found in analytics response`)
        return undefined
      }
    }
  }

  // Get available sections for filters (only for the current grade)
  const availableSections = analyticsData?.performanceBySubjectByGradeSection
    .filter(item => item.gradeId === standardId) // Only sections for current grade
    .filter((item, index, array) =>
      array.findIndex(s => s.sectionId === item.sectionId) === index
    )
    .filter(item => item.sectionId && item.sectionId.trim() !== '')
    .map(item => ({
      id: item.sectionId,
      name: item.sectionName
    })) || []

  // Get current grade data for display purposes
  const currentGradeData = analyticsData?.performanceBySubjectByGrade.find(
    item => item.gradeId === standardId
  )

  // Check if we have data for the current grade
  const hasGradeData = currentGradeData && getFilteredPerformanceData() !== undefined

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[color:var(--primary-500)]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !classStats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || 'Class not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Class Details</h1>
          <p className="text-gray-600">{classStats?.grade} • {classStats?.totalStudents} Students</p>
        </div>

        {/* Analytics Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Performance Analytics</h2>
              {!hasGradeData && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  No Data
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="mb-4 flex gap-4">
              {availableSections.length > 0 ? (
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-sections">All Sections</SelectItem>
                    {availableSections.map(section => (
                      <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  No sections available for this grade
                </div>
              )}
            </div>

            {getFilteredPerformanceData() ? (
              <BarGraphSection
                performanceData={getFilteredPerformanceData()}
                sections={availableSections}
                onFilterChange={handleFilterChange}
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
                <p className="text-gray-600">
                  Performance data for this grade is not available yet. Analytics data will appear once students start taking quizzes and exams.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
