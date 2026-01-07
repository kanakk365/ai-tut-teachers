import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp, AlertTriangle, Video, Play, Star, Send, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import api from "@/lib/axios"
import { useToast } from "@/hooks/use-toast"

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

interface QuizVideo {
  id: string
  userId: string
  quizId: string | null
  examId: string | null
  videoType: string
  s3Key: string
  s3Url: string
  fileSize: number
  duration: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  quiz: {
    id: string
    title: string
  } | null
  exam: any | null
}

interface Submission {
  id: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeTaken: number
  submittedAt: string
  is_studentCheated: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  answers: Answer[]
  videos: QuizVideo[]
  cheatingStatus: {
    is_studentCheated: boolean
  }
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

  // Feedback state
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedbackExpanded, setFeedbackExpanded] = useState(true)
  const { toast } = useToast()

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

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

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
    // Reset feedback form
    setFeedbackText("")
    setFeedbackRating(0)
  }

  // Submit feedback function
  const handleSubmitFeedback = async () => {
    if (!selectedSubmission || !feedbackText.trim() || feedbackRating === 0) {
      toast({
        title: "Error",
        description: "Please provide both a rating and feedback message.",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmittingFeedback(true)
      const response = await api.post(`/teacher/submissions/${selectedSubmission.id}/feedback`, {
        feedback: feedbackText.trim(),
        rating: feedbackRating,
        submissionType: "quiz",
        submissionId: selectedSubmission.id
      })

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully!",
        })
        setFeedbackText("")
        setFeedbackRating(0)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  // Star rating component
  const StarRating = ({ rating, onRatingChange, readonly = false }: { rating: number, onRatingChange?: (rating: number) => void, readonly?: boolean }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange?.(star)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            disabled={readonly}
          >
            <Star
              className={`h-6 w-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
            />
          </button>
        ))}
      </div>
    )
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

          {/* Cheating Status Badge */}
          {selectedSubmission.is_studentCheated && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Cheating Detected</span>
            </div>
          )}
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
                    <div className="text-sm text-gray-600">Cheating Status</div>
                    <div className="font-medium">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedSubmission.is_studentCheated
                        ? 'bg-red-100 text-red-800'
                        : 'bg-[var(--primary-100)] text-[color:var(--primary-800)]'
                        }`}>
                        {selectedSubmission.is_studentCheated ? 'Cheating Detected' : 'No Issues'}
                      </span>
                    </div>
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
          )}
        </div>

        {/* Videos Section */}
        {selectedSubmission.videos && selectedSubmission.videos.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 mb-4">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="h-5 w-5 text-[color:var(--primary-600)]" />
                <h2 className="text-lg font-medium">Recording Videos ({selectedSubmission.videos.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedSubmission.videos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-[var(--primary-100)] rounded-lg">
                        <Play className="h-5 w-5 text-[color:var(--primary-600)]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {video.videoType === 'SCREEN' ? 'Screen Recording' : video.videoType}
                        </div>
                        <div className="text-xs text-gray-500">
                          Duration: {formatDuration(video.duration)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Recorded: {formatDate(video.createdAt)}
                    </div>
                    <a
                      href={video.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--primary-500)] hover:bg-[var(--primary-600)] rounded-lg transition-colors w-full justify-center"
                    >
                      <Play className="h-4 w-4" />
                      Watch Video
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

        {/* Teacher Feedback Section */}
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <button
            type="button"
            onClick={() => setFeedbackExpanded(!feedbackExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-medium">Give Feedback</h2>
            </div>
            {feedbackExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>

          {feedbackExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="space-y-4 mt-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <StarRating rating={feedbackRating} onRatingChange={setFeedbackRating} />
                </div>

                {/* Feedback Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback Message
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Provide constructive feedback for the student..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback || !feedbackText.trim() || feedbackRating === 0}
                  className="button-primary w-full flex items-center justify-center gap-2"
                  type="button"
                >
                  {submittingFeedback ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Cheating</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Videos</th>
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
                    <td className="px-6 py-4 text-sm">
                      {submission.is_studentCheated ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--primary-100)] text-[color:var(--primary-800)]">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {submission.videos && submission.videos.length > 0 ? (
                        <span className="flex items-center gap-1 text-[color:var(--primary-600)]">
                          <Video className="h-4 w-4" />
                          {submission.videos.length}
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
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
    </div >
  )
}
