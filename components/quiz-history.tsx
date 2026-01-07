import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import api from "@/lib/axios"

interface Quiz {
  id: string
  title: string
  instructions: string
  timeLimitMinutes: number
  topic: string
  difficulty: string
  createdAt: string
  userId: string | null
  completed: boolean
  createdBy: string
  standardId: string | null
  sectionId: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  questions: Question[]
  SubmitQuiz: Submission[]
}

interface Question {
  id: string
  questionText: string
  quizId: string
  options: Option[]
}

interface Option {
  id: string
  optionText: string
  isCorrect: boolean
  questionId: string
}

interface Answer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
}

interface Submission {
  id: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeTaken: number
  submittedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  answers: Answer[]
}

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

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

interface QuizHistoryProps {
  onViewQuiz?: (quiz: Quiz) => void
}

export function QuizHistory({ onViewQuiz }: QuizHistoryProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  })

  useEffect(() => {
    const loadData = async () => {
      await fetchQuizzes()
      await fetchStandards()
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuizzes = async (page = currentPage) => {
    try {
      setLoading(true)
      const allQuizzes: Quiz[] = []
      let currentPageNum = page

      // Fetch all pages
      while (true) {
        const response = await api.get(`/teacher/quizzes?page=${currentPageNum}`)

        if (response.data.success) {
          const { quizzes: pageQuizzes, pagination: pagePagination } = response.data.data
          allQuizzes.push(...pageQuizzes)
          setPagination(pagePagination)

          // If this is the last page, break
          if (currentPageNum >= pagePagination.totalPages) {
            break
          }
          currentPageNum++
        } else {
          break
        }
      }

      setQuizzes(allQuizzes)
    } catch (error) {
      console.error('Error fetching quizzes:', error)
      setError('Failed to fetch quizzes')
    } finally {
      setLoading(false)
    }
  }

  const fetchStandards = async () => {
    try {
      const allStandards: Standard[] = []
      let currentPageNum = 1

      // Fetch all pages of standards
      while (true) {
        const response = await api.get(`/teacher/standards?page=${currentPageNum}`)

        if (response.data.success) {
          const { standards: pageStandards, pagination: pagePagination } = response.data.data
          allStandards.push(...pageStandards)

          // If this is the last page, break
          if (currentPageNum >= pagePagination.totalPages) {
            break
          }
          currentPageNum++
        } else {
          break
        }
      }

      setStandards(allStandards)
    } catch (error) {
      console.error('Error fetching standards:', error)
    }
  }

  const getStandardName = (standardId: string | null): string => {
    if (!standardId) return "Not Assigned"
    const standard = standards.find(s => s.id === standardId)
    return standard ? standard.name : "Unknown"
  }

  const getSectionName = (sectionId: string | null): string => {
    if (!sectionId) return "Not Assigned"

    for (const standard of standards) {
      const section = standard.sections.find(s => s.id === sectionId)
      if (section) return section.name
    }
    return "Unknown"
  }

  const calculateAverageScore = (submissions: Submission[]): string => {
    if (!submissions || submissions.length === 0) return "No submissions"

    const totalScore = submissions.reduce((sum, submission) => sum + (submission.score || 0), 0)
    const average = totalScore / submissions.length
    return `${Math.round(average)}%`
  }

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewQuiz = (quiz: Quiz) => {
    if (onViewQuiz) {
      onViewQuiz(quiz)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading quizzes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">❌</span>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null)
            fetchQuizzes()
          }}
          className="mt-4 button-primary px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Quizzes History ({pagination.totalCount})</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search quizzes here"
            className="pl-10 w-64 border-gray-200 focus:border-[color:var(--primary-500)] focus:ring-[color:var(--primary-500)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        {/* Table */}
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Quiz Title</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Standard</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Section</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Difficulty</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Avg Score</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Attempts</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Created</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizzes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No quizzes found matching your search' : 'No quizzes available'}
                </td>
              </tr>
            ) : (
              filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-25 transition-colors relative">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 relative">
                    {quiz.title}
                    <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100 opacity-30"></div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getStandardName(quiz.standardId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getSectionName(quiz.sectionId)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${quiz.difficulty === 'easy' ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]' :
                        quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{calculateAverageScore(quiz.SubmitQuiz)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{quiz.SubmitQuiz.length}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(quiz.createdAt)}</td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      className="button-primary px-4 py-1 text-sm font-medium rounded"
                      onClick={() => handleViewQuiz(quiz)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <div>
          Showing {filteredQuizzes.length} of {pagination.totalCount} quizzes
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            ‹
          </Button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0"
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  )
}
