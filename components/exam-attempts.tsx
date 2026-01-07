import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Video, Play, Star, Send, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import api from '@/lib/api'
import { useToast } from "@/hooks/use-toast"

interface ExamQuestion {
    id: string
    questionText: string
    questionType: string
    marks: number
    correctAnswer: string | null
    bloomTaxonomy: string | null
    examId: string
    options: ExamOption[]
}

interface ExamOption {
    id: string
    optionText: string
    isCorrect: boolean
    questionId: string
}

interface ExamVideo {
    id: string
    userId: string
    quizId: string | null
    examId: string
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
    quiz: any | null
    exam: {
        id: string
        title: string
    }
}

interface StudentExamSubmission {
    id: string
    studentId: string
    examId: string
    completed: boolean
    score: number | null
    startTime: string | null
    endTime: string | null
    createdAt: string
    updatedAt: string
    is_studentCheated: boolean
    student: {
        id: string
        firstName: string
        lastName: string
        email: string
    }
    studentAnswers: any[]
    videos: ExamVideo[]
    cheatingStatus: {
        is_studentCheated: boolean
    }
}

interface ExamDetail {
    id: string
    title: string
    description: string | null
    instructions: string
    timeLimitMinutes: number
    topic: string
    difficulty: string
    createdAt: string
    teacherId: string
    institutionId: string
    userId: string | null
    type: string
    isActive: boolean
    createdBy: string
    standardId: string | null
    sectionId: string | null
    questions: ExamQuestion[]
    StudentExam: StudentExamSubmission[]
}

interface ApiResponse<T> {
    statusCode: number
    success: boolean
    message: string
    data: T
}

interface ExamDetailResponse {
    exam: ExamDetail
}

interface ExamAttemptsProps {
    examId: string
    examTitle?: string
    onBack: () => void
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

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
}

export function ExamAttempts({ examId, examTitle, onBack }: ExamAttemptsProps) {
    const [examDetail, setExamDetail] = useState<ExamDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedSubmission, setSelectedSubmission] = useState<StudentExamSubmission | null>(null)
    const [showDetails, setShowDetails] = useState(false)

    // Feedback state
    const [feedbackText, setFeedbackText] = useState("")
    const [feedbackRating, setFeedbackRating] = useState(0)
    const [submittingFeedback, setSubmittingFeedback] = useState(false)
    const [feedbackExpanded, setFeedbackExpanded] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const fetchExamDetail = async () => {
            try {
                setLoading(true)
                const response = await api.get<ApiResponse<ExamDetailResponse>>(`/teacher/exam/${examId}`)

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

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-gray-500"
        if (score >= 80) return "text-[color:var(--primary-600)]"
        if (score >= 60) return "text-[color:var(--primary-500)]"
        return "text-red-600"
    }

    const handleViewDetails = (submission: StudentExamSubmission) => {
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
                submissionType: "exam",
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
        } catch (err) {
            console.error('Error submitting feedback:', err)
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
                                {selectedSubmission.student
                                    ? `${selectedSubmission.student.firstName || ''} ${selectedSubmission.student.lastName || ''}`.trim()
                                    : 'Unknown Student'
                                }
                            </h1>
                            <p className="text-gray-600">{selectedSubmission.student?.email}</p>
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
                                        <div className="text-sm text-gray-600">Status</div>
                                        <div className="font-medium">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedSubmission.completed
                                                ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {selectedSubmission.completed ? 'Completed' : 'In Progress'}
                                            </span>
                                        </div>
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
                                </div>
                            </div>
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm text-gray-600">Score</div>
                                        <div className={`font-medium text-lg ${getScoreColor(selectedSubmission.score)}`}>
                                            {selectedSubmission.score !== null ? `${selectedSubmission.score}%` : 'Not graded'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">Start Time</div>
                                        <div className="font-medium">
                                            {selectedSubmission.startTime ? formatDate(selectedSubmission.startTime) : 'Not started'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600">End Time</div>
                                        <div className="font-medium">
                                            {selectedSubmission.endTime ? formatDate(selectedSubmission.endTime) : 'Not ended'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                    <div className="p-6">
                        <h2 className="text-lg font-medium mb-4">Questions and Answers</h2>
                        <div className="space-y-6">
                            {selectedSubmission.studentAnswers && selectedSubmission.studentAnswers.length > 0 ? (
                                selectedSubmission.studentAnswers.map((answer: any, idx: number) => {
                                    const question = examDetail?.questions.find(q => q.id === answer.questionId)
                                    if (!question) return null

                                    return (
                                        <div key={answer.questionId || idx} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="font-medium">Q{idx + 1}. {question.questionText}</div>
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Type:</span> {question.questionType} |
                                                <span className="ml-2 font-medium">Marks:</span> {question.marks}
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className={`text-sm font-medium ${answer.isCorrect ? 'text-[color:var(--primary-600)]' : 'text-red-600'
                                                        }`}>
                                                        Student's Answer: {answer.studentAnswer || 'Not answered'} - {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                    </span>
                                                </div>
                                                {question.correctAnswer && (
                                                    <div>
                                                        <span className="text-sm text-[color:var(--primary-600)] font-medium">
                                                            Correct Answer: {question.correctAnswer}
                                                        </span>
                                                    </div>
                                                )}
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
                        <div className="px-6 pb-6 border-t border-gray-100">
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

    // Calculate statistics
    const totalSubmissions = examDetail.StudentExam.length
    const completedSubmissions = examDetail.StudentExam.filter(s => s.completed).length
    const cheatedCount = examDetail.StudentExam.filter(s => s.is_studentCheated).length
    const avgScore = examDetail.StudentExam.filter(s => s.score !== null).length > 0
        ? Math.round(
            examDetail.StudentExam.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) /
            examDetail.StudentExam.filter(s => s.score !== null).length
        )
        : null

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

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-[color:var(--primary-600)]">{examDetail.questions.length}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-[color:var(--primary-600)]">{completedSubmissions}/{totalSubmissions}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-[color:var(--primary-600)]">
                        {avgScore !== null ? `${avgScore}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className={`text-2xl font-bold ${cheatedCount > 0 ? 'text-red-600' : 'text-[color:var(--primary-600)]'}`}>
                        {cheatedCount}
                    </div>
                    <div className="text-sm text-gray-600">Cheating Detected</div>
                </div>
            </div>

            {/* Submissions Section */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                    <h2 className="text-lg font-medium mb-4">Student Submissions ({examDetail.StudentExam.length})</h2>

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
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Score</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Cheating</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Videos</th>
                                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examDetail.StudentExam.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-25 transition-colors relative">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 relative">
                                                {submission.student
                                                    ? `${submission.student.firstName || ''} ${submission.student.lastName || ''}`.trim()
                                                    : 'Unknown Student'
                                                }
                                                <div className="absolute bottom-0 left-6 right-6 h-px bg-gray-100 opacity-30"></div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{submission.student?.email || 'No email'}</td>
                                            <td className={`px-6 py-4 text-sm font-medium ${getScoreColor(submission.score)}`}>
                                                {submission.score !== null ? `${submission.score}%` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${submission.completed
                                                    ? 'bg-[var(--primary-100)] text-[color:var(--primary-800)]'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {submission.completed ? 'Completed' : 'In Progress'}
                                                </span>
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
        </div>
    )
}
