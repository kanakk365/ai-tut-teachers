import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import api from '@/lib/api'

interface CustomQuizDetail {
  id: string
  title: string
  description: string | null
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
  questions: CustomQuizQuestion[]
  AssignedQuiz: any[]
  SubmitQuiz: CustomQuizSubmission[]
  standard: any | null
  section: any | null
}

interface CustomQuizQuestion {
  id: string
  questionText: string
  bloomTaxonomy: string
  quizId: string
  options: CustomQuizOption[]
}

interface CustomQuizOption {
  id: string
  optionText: string
  isCorrect: boolean
  questionId: string
}

interface CustomQuizSubmission {
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
  answers?: any[]
}

// Shared utility function
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface CustomQuiz {
  id: string
  title: string
  instructions: string
  timeLimitMinutes: number
  topic: string
  difficulty: string
  createdAt: string
  questionCount: number
  assignedCount: number
  completedCount: number
  averageScore: number | null
  classSection: {
    standardId: string
    sectionId: string | null
    standardName: string
    sectionName: string | null
  }
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

interface CustomQuizzesResponse {
  quizzes: CustomQuiz[]
}

interface CustomQuizHistoryProps {
  onViewQuiz?: (quiz: CustomQuiz) => void
  onViewQuizById?: (quizId: string) => void
}

type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

export function CustomQuizHistory({ onViewQuiz, onViewQuizById }: CustomQuizHistoryProps) {
  const [quizzes, setQuizzes] = useState<CustomQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchCustomQuizzes = async () => {
      try {
        setLoading(true)
        const response = await api.get<ApiResponse<CustomQuizzesResponse>>('/teacher/custom-quizzes/get')

        if (response.data.success) {
          setQuizzes(response.data.data.quizzes)
        } else {
          setError('Failed to fetch custom quizzes')
        }
      } catch (err) {
        console.error('Error fetching custom quizzes:', err)
        const apiError = err as ApiError
        if (apiError.response?.status === 401) {
          const message = apiError.response.data?.message
          setError(message || 'You do not have permission to view custom quizzes yet.')
        } else {
          setError('Failed to fetch custom quizzes')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCustomQuizzes()
  }, [])

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quiz.classSection.standardName?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleViewQuiz = (quiz: CustomQuiz) => {
    if (onViewQuizById) {
      onViewQuizById(quiz.id)
    } else if (onViewQuiz) {
      onViewQuiz(quiz)
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)]"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Custom Quizzes History</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search custom quizzes here"
            className="pl-10 w-64 border-gray-200 focus:border-[var(--primary-500)] focus:ring-[var(--primary-500)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Quiz Title</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Topic</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Class/Section</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Questions</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Time Limit</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Assigned</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Avg Score</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizzes.map((quiz) => (
              <tr key={quiz.id} className="hover:bg-gray-25 transition-colors relative">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 relative">
                  {quiz.title}
                  <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100 opacity-30"></div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{quiz.topic}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {quiz.classSection.standardName && quiz.classSection.sectionName
                    ? `${quiz.classSection.standardName} - ${quiz.classSection.sectionName}`
                    : quiz.classSection.standardName || 'Not assigned'
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{quiz.questionCount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{quiz.timeLimitMinutes} min</td>
                <td className="px-6 py-4 text-sm text-gray-600">{quiz.assignedCount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {quiz.averageScore ? `${quiz.averageScore}%` : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <Button
                    size="sm"
                    className="px-4 py-1 text-sm font-medium rounded button-primary hover:bg-[var(--primary-600)]"
                    onClick={() => handleViewQuiz(quiz)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredQuizzes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No custom quizzes found</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <div>Showing {filteredQuizzes.length > 0 ? `1-${filteredQuizzes.length}` : '0'} of {filteredQuizzes.length} custom quizzes</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
            ‹
          </Button>
          <Button variant="outline" size="sm" className="w-8 h-8 p-0">
            ›
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CustomQuizAttemptsProps {
  quizId: string
  quizTitle?: string
  onBack: () => void
}

export function CustomQuizAttempts({ quizId, quizTitle, onBack }: CustomQuizAttemptsProps) {
  const [quizDetail, setQuizDetail] = useState<CustomQuizDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchQuizDetail = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/teacher/custom-quizzes/get/${quizId}`)

        if (response.data.success) {
          setQuizDetail(response.data.data.quiz)
        } else {
          setError('Failed to fetch quiz details')
        }
      } catch (err: any) {
        console.error('Error fetching quiz details:', err)
        setError(err.response?.data?.message || 'Failed to fetch quiz details')
      } finally {
        setLoading(false)
      }
    }

    if (quizId) {
      fetchQuizDetail()
    }
  }, [quizId])

  const getBloomTaxonomyColor = (taxonomy: string) => {
    switch (taxonomy) {
      case 'REMEMBER':
        return 'bg-red-100 text-red-800'
      case 'UNDERSTAND':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPLY':
        return 'bg-blue-100 text-blue-800'
      case 'ANALYZE':
        return 'bg-purple-100 text-purple-800'
      case 'EVALUATE':
        return 'bg-orange-100 text-orange-800'
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[color:var(--primary-600)]"
    if (score >= 60) return "text-[color:var(--primary-500)]"
    return "text-red-600"
  }

  const handleViewDetails = (submission: CustomQuizSubmission) => {
    setSelectedSubmission(submission)
    setShowDetails(true)
  }

  // If showing details, render the detailed view
  if (showDetails && selectedSubmission) {
    return (
      <div className="p-6 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(false)}
              className="text-2xl px-2"
              type="button"
            >
              ‹
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">
                {selectedSubmission.user
                  ? `${selectedSubmission.user.firstName || ''} ${selectedSubmission.user.lastName || ''}`.trim()
                  : 'Unknown Student'
                }
              </h1>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Submission Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Quiz</div>
                    <div className="font-medium">{quizTitle || quizDetail?.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                    <div className="font-medium">
                      {Math.floor((selectedSubmission.timeTaken || 0))} min {Math.round(((selectedSubmission.timeTaken || 0) % 1) * 60)} sec
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Student</div>
                    <div className="font-medium">
                      {selectedSubmission.user
                        ? `${selectedSubmission.user.firstName || ''} ${selectedSubmission.user.lastName || ''}`.trim()
                        : 'Unknown Student'
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Score</div>
                    <div className={`font-medium ${getScoreColor(selectedSubmission.score || 0)}`}>
                      {selectedSubmission.score || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Submitted on</div>
                  <div className="font-medium">{formatDate(selectedSubmission.submittedAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${(selectedSubmission.score || 0) >= 60 ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]' : 'bg-red-100 text-red-800'
                      }`}>
                      {(selectedSubmission.score || 0) >= 60 ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Answers Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Questions and Answers</h2>
            <div className="space-y-6">
              {selectedSubmission.answers && selectedSubmission.answers.length > 0 ? (
                selectedSubmission.answers.map((answer: any, idx: number) => {
                  const question = quizDetail?.questions.find(q => q.id === answer.questionId)
                  if (!question) return null

                  return (
                    <div key={answer.questionId || idx} className="space-y-3">
                      <div className="font-medium">Q{idx + 1}. {question.questionText}</div>

                      <div className="space-y-2">
                        <div>
                          <span className={`text-sm font-medium ${answer.isCorrect ? 'text-[color:var(--primary-600)]' : 'text-red-600'
                            }`}>
                            Student's Answer: {answer.selectedOptionText || 'Not answered'} - {answer.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-[color:var(--primary-600)] font-medium">
                            Correct Answer: {question.options.find(opt => opt.isCorrect)?.optionText || 'Not available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No answers available for this submission
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading quiz details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !quizDetail) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="text-2xl px-2">
            ‹
          </Button>
          <h1 className="text-2xl font-semibold">Quiz Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Quiz not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} className="text-2xl px-2">
          ‹
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{quizDetail.title}</h1>
          <p className="text-gray-600">{quizDetail.topic} • {quizDetail.difficulty}</p>
        </div>
      </div>



      {/* Submissions Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Quiz Submissions ({quizDetail.SubmitQuiz.length})</h2>

          {quizDetail.SubmitQuiz.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">This quiz hasn't received any submissions from students.</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Student Name</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Score (%)</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Correct Answers</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Time Taken</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Submitted At</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quizDetail.SubmitQuiz.map((submission: CustomQuizSubmission) => (
                    <tr key={submission.id} className="hover:bg-gray-25 transition-colors relative">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 relative">
                        {submission.user ? `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim() : 'Unknown Student'}
                        <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100 opacity-30"></div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{submission.user?.email || 'No email'}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${getScoreColor(submission.score || 0)}`}>
                        {submission.score || 0}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {submission.correctAnswers || 0}/{submission.totalQuestions || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {submission.timeTaken || 0} min{(submission.timeTaken || 0) !== 1 ? 's' : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(submission.submittedAt)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${(submission.score || 0) >= 60 ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]' : 'bg-red-100 text-red-800'
                          }`}>
                          {(submission.score || 0) >= 60 ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          className="button-primary px-4 py-1 text-sm font-medium rounded"
                          onClick={() => handleViewDetails(submission)}
                          type="button"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assignment and Submission Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4">Assignment Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Assigned </span>
              <span className="font-medium">{quizDetail.AssignedQuiz.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">{quizDetail.AssignedQuiz.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4">Submission Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Submissions</span>
              <span className="font-medium">{quizDetail.SubmitQuiz.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Score</span>
              <span className="font-medium">
                {quizDetail.SubmitQuiz.length > 0
                  ? `${Math.round(quizDetail.SubmitQuiz.reduce((sum, sub) => sum + (sub.score || 0), 0) / quizDetail.SubmitQuiz.length)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
