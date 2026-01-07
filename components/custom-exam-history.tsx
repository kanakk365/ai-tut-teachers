import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import api from '@/lib/api'

interface CustomExam {
  id: string
  title: string
  topic: string
  timeLimitMinutes: number
  type: string
  difficulty: string
  createdAt: string
  questionCount: number
  totalMarks: number
  assignedCount: number
  completedCount: number
  averageScore: number | null
  standard: {
    id: string
    name: string
  } | null
  section: {
    id: string
    name: string
  } | null
}

interface ApiResponse<T> {
  statusCode: number
  success: boolean
  message: string
  data: T
}

interface CustomExamsResponse {
  exams: CustomExam[]
}

interface CustomExamDetail {
  id: string
  title: string
  description: string | null
  instructions: string
  timeLimitMinutes: number
  topic: string
  difficulty: string
  createdAt: string
  teacherId: string | null
  institutionId: string
  userId: string | null
  type: string
  isActive: boolean
  createdBy: string
  standardId: string | null
  sectionId: string | null
  questions: CustomExamQuestion[]
  StudentExam: CustomExamSubmission[]
  standard: any | null
  section: any | null
  teacher: any | null
}

interface CustomExamQuestion {
  id: string
  questionText: string
  questionType: string
  marks: number
  correctAnswer: string | null
  bloomTaxonomy: string
  examId: string
  options: CustomExamOption[]
}

interface CustomExamOption {
  id: string
  optionText: string
  isCorrect: boolean
  questionId: string
}

interface CustomExamSubmission {
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

interface CustomExamHistoryProps {
  onViewExam?: (exam: CustomExam) => void
  onViewExamById?: (examId: string) => void
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

type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

export function CustomExamHistory({ onViewExam, onViewExamById }: CustomExamHistoryProps) {
  const [exams, setExams] = useState<CustomExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchCustomExams = async () => {
      try {
        setLoading(true)
        const response = await api.get<ApiResponse<CustomExamsResponse>>('/teacher/custom-exams/get')

        if (response.data.success) {
          setExams(response.data.data.exams)
        } else {
          setError('Failed to fetch custom exams')
        }
      } catch (err) {
        console.error('Error fetching custom exams:', err)
        const apiError = err as ApiError
        if (apiError.response?.status === 401) {
          const message = apiError.response.data?.message
          setError(message || 'You do not have permission to view custom exams yet.')
        } else {
          setError('Failed to fetch custom exams')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCustomExams()
  }, [])

  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exam.standard?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleViewExam = (exam: CustomExam) => {
    if (onViewExamById) {
      onViewExamById(exam.id)
    } else if (onViewExam) {
      onViewExam(exam)
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
        <h1 className="text-2xl font-semibold">Custom Exams History</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search custom exams here"
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
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Exam Title</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Topic</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Class/Section</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Questions</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Total Marks</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Assigned</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Avg Score</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-gray-25 transition-colors relative">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 relative">
                  {exam.title}
                  <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100 opacity-30"></div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{exam.topic}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {exam.standard && exam.section
                    ? `${exam.standard.name} - ${exam.section.name}`
                    : 'Not assigned'
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{exam.questionCount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{exam.totalMarks}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{exam.assignedCount}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {exam.averageScore ? `${exam.averageScore}%` : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <Button
                    size="sm"
                    className="px-4 py-1 text-sm font-medium rounded button-primary"
                    onClick={() => handleViewExam(exam)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExams.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No custom exams found</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <div>Showing {filteredExams.length > 0 ? `1-${filteredExams.length}` : '0'} of {filteredExams.length} custom exams</div>
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

interface CustomExamAttemptsProps {
  examId: string
  examTitle?: string
  onBack: () => void
}

export function CustomExamAttempts({ examId, examTitle, onBack }: CustomExamAttemptsProps) {
  const [examDetail, setExamDetail] = useState<CustomExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<CustomExamSubmission | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/teacher/custom-exams/get/${examId}`)

        if (response.data.success) {
          setExamDetail(response.data.data.exam)
        } else {
          setError('Failed to fetch exam details')
        }
      } catch (err: any) {
        console.error('Error fetching exam details:', err)
        setError(err.response?.data?.message || 'Failed to fetch exam details')
      } finally {
        setLoading(false)
      }
    }

    if (examId) {
      fetchExamDetail()
    }
  }, [examId])

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
        return 'bg-[var(--primary-100)] text-[var(--primary-800)]'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[color:var(--primary-600)]"
    if (score >= 60) return "text-[color:var(--primary-500)]"
    return "text-red-600"
  }

  const handleViewDetails = (submission: CustomExamSubmission) => {
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
                    <div className="text-sm text-gray-600">Exam</div>
                    <div className="font-medium">{examTitle || examDetail?.title}</div>
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
                  const question = examDetail?.questions.find(q => q.id === answer.questionId)
                  if (!question) return null

                  return (
                    <div key={answer.questionId || idx} className="space-y-3">
                      <div className="font-medium">Q{idx + 1}. {question.questionText}</div>

                      <div className="space-y-2">
                        <div>
                          <span className={`text-sm font-medium ${answer.isCorrect ? 'text-[color:var(--primary-600)]' : 'text-red-600'
                            }`}>
                            Student's Answer: {answer.studentAnswer || 'Not answered'} - {answer.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-[color:var(--primary-600)] font-medium">
                            Correct Answer: {question.correctAnswer || 'Not available'}
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
            <p className="text-gray-600 text-lg">Loading exam details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !examDetail) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="text-2xl px-2">
            ‹
          </Button>
          <h1 className="text-2xl font-semibold">Exam Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'Exam not found'}</p>
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
          <h1 className="text-2xl font-semibold">{examDetail.title}</h1>
          <p className="text-gray-600">{examDetail.topic} • {examDetail.difficulty} • {examDetail.type}</p>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="bg-white rounded-lg border border-gray-200 mt-6">
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Exam Submissions ({examDetail.StudentExam.length})</h2>

          {examDetail.StudentExam.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
              <p className="text-gray-600">This exam hasn't received any submissions from students.</p>
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
                  {examDetail.StudentExam.map((submission: CustomExamSubmission) => (
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

      {/* Assignment Statistics */}
      <div className="mt-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium mb-4">Assignment Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[color:var(--primary-600)]">{examDetail.questions.length}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[color:var(--primary-600)]">{examDetail.StudentExam.length}</div>
              <div className="text-sm text-gray-600">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[color:var(--primary-600)]">
                {examDetail.StudentExam.length > 0
                  ? `${Math.round(examDetail.StudentExam.reduce((sum, sub) => sum + (sub.score || 0), 0) / examDetail.StudentExam.length)}%`
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
