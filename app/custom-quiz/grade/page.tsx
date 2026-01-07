"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import api from "@/lib/axios"

interface Standard {
  id: string
  name: string
  institutionId: string
  createdAt: string
  updatedAt: string
  sections: Section[]
}

interface Section {
  id: string
  name: string
  createdAt: string
}

interface StandardsResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    standards: Standard[]
    pagination: { currentPage: number; totalPages: number; totalCount: number; limit: number }
  }
}

export default function CustomQuizGradePage() {
  const router = useRouter()
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllStandards = useCallback(async () => {
    try {
      setLoading(true)
      let allStandards: Standard[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const response = await api.get<StandardsResponse>(`/teacher/standards?page=${currentPage}`)
        if (response.data.success) {
          allStandards = [...allStandards, ...response.data.data.standards]
          if (currentPage >= response.data.data.pagination.totalPages) hasMorePages = false
          else currentPage++
        } else {
          hasMorePages = false
          setError('Failed to fetch standards')
        }
      }

      setStandards(allStandards)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch standards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAllStandards() }, [fetchAllStandards])

  const handleGradeSelect = (standard: Standard) => {
    sessionStorage.setItem('customQuizSelectedStandard', JSON.stringify(standard))
    router.push('/custom-quiz/section')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <button type="button" onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Custom Quiz - Select Grade</h1>
          <p className="text-gray-600">Choose the grade/class for your custom quiz</p>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[color:var(--primary-500)] mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading grades...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {standards.slice().reverse().map((standard) => (
                <button
                  key={standard.id}
                  type="button"
                  className="bg-cover bg-center rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 w-full h-32 min-h-[8rem]"
                  style={{ backgroundImage: 'url(/grade-selection.png)' }}
                  onClick={() => handleGradeSelect(standard)}
                >
                  <h2 className="text-xl font-bold text-white text-center drop-shadow-lg h-full flex items-center justify-center">{standard.name}</h2>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
