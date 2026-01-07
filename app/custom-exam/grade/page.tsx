"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import api from "@/lib/axios"

interface AssignedSection {
  teacherSectionId: string
  sectionId: string
  sectionName: string
  standardId: string
  standardName: string
}

interface TeacherProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  createdAt: string
  institution: {
    id: string
    name: string
  }
  assignedSections: AssignedSection[]
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

// Group sections by standard for display
interface GroupedStandard {
  standardId: string
  standardName: string
  sections: AssignedSection[]
}

export default function CustomExamGradePage() {
  const router = useRouter()
  const [groupedStandards, setGroupedStandards] = useState<GroupedStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeacherProfile = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get<ApiResponse<TeacherProfile>>('/teacher/profile')

      if (response.data.success) {
        // Group sections by standard
        const grouped: { [key: string]: GroupedStandard } = {}

        response.data.data.assignedSections.forEach((section) => {
          if (!grouped[section.standardId]) {
            grouped[section.standardId] = {
              standardId: section.standardId,
              standardName: section.standardName,
              sections: []
            }
          }
          grouped[section.standardId].sections.push(section)
        })

        setGroupedStandards(Object.values(grouped))
      } else {
        setError('Failed to fetch assigned classes')
      }
    } catch (err) {
      console.error('Error fetching teacher profile:', err)
      setError('Failed to fetch assigned classes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeacherProfile() }, [fetchTeacherProfile])

  const handleGradeSelect = (standard: GroupedStandard) => {
    // Store the selected standard in sessionStorage for the custom exam creation flow
    // Convert to the format expected by the section page
    const standardData = {
      id: standard.standardId,
      name: standard.standardName,
      sections: standard.sections.map(s => ({
        id: s.sectionId,
        name: s.sectionName,
        createdAt: ''
      }))
    }
    sessionStorage.setItem('customExamSelectedStandard', JSON.stringify(standardData))
    router.push('/custom-exam/section')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Custom Exam - Select Grade</h1>
          <p className="text-gray-600">Choose from your assigned grades/classes for this custom exam</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading your assigned classes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          ) : groupedStandards.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-300 text-8xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assigned Classes</h3>
              <p className="text-gray-500">You have not been assigned to any classes yet. Please contact your administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedStandards.map((standard) => (
                <button
                  key={standard.standardId}
                  type="button"
                  className="bg-cover bg-center rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 w-full h-32 min-h-[8rem] relative"
                  style={{ backgroundImage: 'url(/grade-selection.png)' }}
                  onClick={() => handleGradeSelect(standard)}
                >
                  <h2 className="text-xl font-bold text-white text-center drop-shadow-lg h-full flex items-center justify-center">{standard.standardName}</h2>
                  <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                    {standard.sections.length} section{standard.sections.length !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
