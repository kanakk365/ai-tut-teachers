"use client"

import { useState, useEffect } from "react"
import { ExamView } from "@/components/exam-view"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  dob: string
  gender: string
  phone: string
  photoUrl?: string
  isActive: boolean
}

interface GradeAndSection {
  standard: { id: string; name: string }
  section: { id: string; name: string }
  standardName: string
  sectionName: string
}

interface CreatedQuiz {
  quizId: string
  title: string
  subject: string
  topic: string
  timeLimitMinutes: number
  instructions: string
  difficulty: string
  questionCount: number
}

interface StoredQuizOption {
  optionText: string
  isCorrect: boolean
  [key: string]: unknown
}

interface StoredQuizQuestion {
  questionText: string
  options?: StoredQuizOption[]
  [key: string]: unknown
}

interface StoredQuizFormData {
  quizDetails: {
    title: string
    subject: string
    topic: string
    timeLimitMinutes: number
    instructions: string
    difficulty: string
    [key: string]: unknown
  }
  description: string
  classSection: {
    standardId: string
    sectionId: string
    [key: string]: unknown
  }
  questions?: StoredQuizQuestion[]
  [key: string]: unknown
}

export default function CustomQuizConfirmationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [gradeAndSection, setGradeAndSection] = useState<GradeAndSection | null>(null)
  const [createdQuiz, setCreatedQuiz] = useState<CreatedQuiz | null>(null)

  useEffect(() => {
    // Get data from sessionStorage
    const students = sessionStorage.getItem('customQuizSelectedStudents')
    const gradeSection = sessionStorage.getItem('customQuizGradeAndSection')
    const formData = sessionStorage.getItem('quizFormData')

    console.log('Students from storage:', students) // Debug log
    console.log('Grade section from storage:', gradeSection) // Debug log
    console.log('Form data from storage:', formData) // Debug log

    if (students) {
      const parsedStudents = JSON.parse(students)
      console.log('Parsed students:', parsedStudents) // Debug log
      setSelectedStudents(parsedStudents.selectedStudents || [])
    }

    if (gradeSection) {
      setGradeAndSection(JSON.parse(gradeSection))
    }

    if (formData) {
      const quizFormData = JSON.parse(formData) as StoredQuizFormData
      // Create a preview quiz object for display
      setCreatedQuiz({
        quizId: '', // Will be set after creation
        title: quizFormData.quizDetails.title,
        subject: quizFormData.quizDetails.subject,
        topic: quizFormData.quizDetails.topic,
        timeLimitMinutes: quizFormData.quizDetails.timeLimitMinutes,
        instructions: quizFormData.quizDetails.instructions,
        difficulty: quizFormData.quizDetails.difficulty,
        questionCount: quizFormData.questions?.length ?? 0
      })
    } else {
      // If no form data, redirect back to form
      router.push('/custom-quiz/form')
    }
  }, [router])

  const handleAssignQuiz = async () => {
    if (!createdQuiz || selectedStudents.length === 0) {
      setError('Missing quiz data or no students selected')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get the quiz form data to create the quiz first
      const formData = sessionStorage.getItem('quizFormData')
      if (!formData) {
        setError('Form data not found')
        return
      }

      const quizFormData = JSON.parse(formData) as StoredQuizFormData
      console.log('Creating quiz with data:', quizFormData)

      const sanitizedQuizPayload = {
        quizDetails: quizFormData.quizDetails,
        description: "",
        questions: Array.isArray(quizFormData.questions)
          ? quizFormData.questions.map((question) => ({
            questionText: question.questionText,
            bloomTaxanomy: question.bloomTaxonomy,
            options: Array.isArray(question.options)
              ? question.options.map((option) => ({
                optionText: option.optionText,
                isCorrect: option.isCorrect,
              }))
              : [],
          }))
          : [],
      }

      console.log('Sanitized quiz payload:', sanitizedQuizPayload)

      // Create the quiz first
      const createResponse = await api.post('/teacher/custom-quizzes/create', sanitizedQuizPayload)

      if (!createResponse.data.success) {
        setError(createResponse.data.message || 'Failed to create quiz')
        return
      }

      const createdQuizData = createResponse.data.data
      console.log('Created quiz response:', createdQuizData)

      // Get institution ID from teacher profile
      const profileResponse = await api.get('/teacher/profile')
      if (!profileResponse.data.success || !profileResponse.data.data.institution?.id) {
        setError('Failed to get institution information')
        return
      }
      const institutionId = profileResponse.data.data.institution.id

      // Now assign the created quiz to students using the new endpoint
      const assignmentData = {
        quizId: createdQuizData.quizId,
        studentIds: selectedStudents.map(student => student.id),
        institutionId: institutionId
      }

      console.log('Assigning quiz with data:', assignmentData)

      const assignResponse = await api.post('/teacher/custom-quizzes/assign', assignmentData)

      if (assignResponse.data.success) {
        setSuccess(`Quiz created and assigned successfully to ${assignResponse.data.data.assignedStudentsCount || selectedStudents.length} students`)

        // Clear sessionStorage
        sessionStorage.removeItem('customQuizSelectedStudents')
        sessionStorage.removeItem('customQuizGradeAndSection')
        sessionStorage.removeItem('quizFormData')

        // Redirect to main page after success
        setTimeout(() => {
          router.push('/custom-quiz')
        }, 2000)
      } else {
        setError(assignResponse.data.message || 'Failed to assign quiz')
      }
    } catch (err: unknown) {
      console.error('Assignment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create and assign quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('customQuizSelectedStudents')
    sessionStorage.removeItem('customQuizGradeAndSection')
    sessionStorage.removeItem('quizFormData')
    router.push('/custom-quiz')
  }

  const handleEdit = () => {
    // Go back to form to edit
    router.push('/custom-quiz/form')
  }

  if (!createdQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading quiz data...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            onClick={handleEdit}
            className="text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Edit
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Quiz Confirmation</h1>
          <p className="text-gray-600">Review your quiz and assign it to selected students</p>
        </div>

        <ExamView
          examData={{
            title: createdQuiz.title,
            subject: createdQuiz.subject,
            description: createdQuiz.instructions || `Custom quiz: ${createdQuiz.topic}`,
            examType: 'Custom Quiz',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            timeLimit: `${createdQuiz.timeLimitMinutes} min`,
            topic: createdQuiz.topic,
            difficulty: createdQuiz.difficulty,
            questionCount: `${createdQuiz.questionCount} questions`,
            bloomTaxonomy: 'remember'
          }}
          gradeAndSection={gradeAndSection}
          selectedStudents={selectedStudents.map(student => ({
            _id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            email: student.email,
            rollNumber: student.phone || '',
            status: student.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
          }))}
          onCancel={handleCancel}
          onEdit={handleEdit}
          onGenerate={handleAssignQuiz}
          loading={loading}
          error={error}
          success={success}
        />
      </div>
    </div>
  )
}
