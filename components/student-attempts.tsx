import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import api from "@/lib/axios"

interface Answer {
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
}

interface Option {
  id: string
  optionText: string
  isCorrect: boolean
  questionId: string
}

interface Question {
  id: string
  questionText: string
  quizId: string
  options: Option[]
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

interface Quiz {
  id: string
  title: string
  SubmitQuiz: Submission[]
  questions?: Question[]
}

interface StudentAttemptsProps {
  quizTitle?: string
  quiz?: Quiz
  onBack: () => void
}

export function StudentAttempts({ quizTitle, quiz, onBack }: StudentAttemptsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [detailedQuiz, setDetailedQuiz] = useState<Quiz | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [overviewExpanded, setOverviewExpanded] = useState(true)
  const [questionsExpanded, setQuestionsExpanded] = useState(true)

  const fetchQuizDetails = useCallback(async (quizId: string) => {
    try {
      const response = await api.get(`/teacher/quizzes/${quizId}`)
      if (response.data.success) {
        setDetailedQuiz(response.data.data.quiz)
      }
    } catch (error) {
      console.error('Error fetching quiz details:', error)
    }
  }, [])

  useEffect(() => {
    if (quiz?.id) {
      fetchQuizDetails(quiz.id)
    }
  }, [quiz?.id, fetchQuizDetails])

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[color:var(--primary-600)]"
    if (score >= 60) return "text-[color:var(--primary-500)]"
    return "text-red-600"
  }

  const getQuestionText = (questionId: string): string => {
    if (!detailedQuiz || !detailedQuiz.questions) return `Question ID: ${questionId}`
    const question = detailedQuiz.questions.find(q => q.id === questionId)
    return question ? question.questionText : `Question ID: ${questionId}`
  }

  const getOptionText = (questionId: string, optionId: string): string => {
    if (!detailedQuiz || !detailedQuiz.questions) return `Option ID: ${optionId}`
    const question = detailedQuiz.questions.find(q => q.id === questionId)
    if (!question || !question.options) return `Option ID: ${optionId}`
    const option = question.options.find(o => o.id === optionId)
    return option ? option.optionText : `Option ID: ${optionId}`
  }

  const getCorrectOption = (questionId: string): string => {
    if (!detailedQuiz || !detailedQuiz.questions) return 'Not available'
    const question = detailedQuiz.questions.find(q => q.id === questionId)
    if (!question || !question.options) return 'Not available'
    const correctOption = question.options.find(o => o.isCorrect)
    return correctOption ? correctOption.optionText : 'Not available'
  }

  const submissions = detailedQuiz?.SubmitQuiz || quiz?.SubmitQuiz || []

  const filteredSubmissions = submissions.filter((submission: Submission) => {
    if (!submission || !submission.user) return false

    const fullName = `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim()
    const email = submission.user.email || ''

    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleViewDetails = (submission: Submission) => {
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
          <button
            type="button"
            onClick={() => setOverviewExpanded(!overviewExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <h2 className="text-lg font-medium">Overview</h2>
            {overviewExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {overviewExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Quiz</div>
                      <div className="font-medium">{quizTitle || quiz?.title}</div>
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
                          ? `${selectedSubmission.user.firstName || ''} ${selectedSubmission.user.lastName || ''}`.trim() + ` (Grade 5B)`
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
                        Submitted
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions and Answers Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <button
            type="button"
            onClick={() => setQuestionsExpanded(!questionsExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <h2 className="text-lg font-medium">Question and Answers</h2>
            {questionsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {questionsExpanded && selectedSubmission.answers && selectedSubmission.answers.length > 0 && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="space-y-6 mt-4">
                {selectedSubmission.answers.map((answer, idx) => (
                  <div key={answer.questionId || idx} className="space-y-3">
                    <div className="font-medium">Q{idx + 1}. {getQuestionText(answer.questionId)}</div>

                    <div className="space-y-2">
                      <div>
                        <span className={`text-sm font-medium ${answer.isCorrect ? 'text-[color:var(--primary-600)]' : 'text-red-600'
                          }`}>
                          Student's Answer: {getOptionText(answer.questionId, answer.selectedOptionId)} - {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm text-[color:var(--primary-600)] font-medium">
                          Correct Answer: {getCorrectOption(answer.questionId)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    )
  }

  // Main list view
  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="text-2xl px-2" type="button">
            ‹
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Quiz Submissions</h1>
            <p className="text-gray-600">{quizTitle || quiz?.title}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search submissions here"
            className="pl-10 w-64 border-gray-200 focus:border-[color:var(--primary-500)] focus:ring-[color:var(--primary-500)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-100">
        {filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600">This quiz hasn't received any submissions from students.</p>
          </div>
        ) : (
          <>
            {/* Table */}
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
                {filteredSubmissions.map((submission: Submission) => (
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
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
        <div>Showing {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}</div>
        {filteredSubmissions.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" type="button">
              ‹
            </Button>
            <Button variant="outline" size="sm" className="w-8 h-8 p-0" type="button">
              ›
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
