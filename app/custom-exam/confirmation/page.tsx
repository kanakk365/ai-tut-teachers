"use client"

import { useState, useEffect } from "react"
import { ExamView } from "@/components/exam-view"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
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

interface ExamViewStudent {
  _id: string
  name: string
  email: string
  rollNumber: string
  status: 'active' | 'inactive'
}

interface GradeAndSection {
  standard: { id: string; name: string }
  section: { id: string; name: string }
  standardName: string
  sectionName: string
}

interface CreatedExam {
  examId: string
  title: string
  subject: string
  topic: string
  timeLimitMinutes: number
  instructions: string
  questionCount: number
}

export default function CustomExamConfirmationPage() {
  const router = useRouter()
  const { institution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [gradeAndSection, setGradeAndSection] = useState<GradeAndSection | null>(null)
  const [createdExam, setCreatedExam] = useState<CreatedExam | null>(null)

  useEffect(() => {
    // Get data from sessionStorage
    const students = sessionStorage.getItem('customExamSelectedStudents')
    const gradeSection = sessionStorage.getItem('customExamGradeAndSection')
    const formData = sessionStorage.getItem('examFormData')

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
      const examFormData = JSON.parse(formData)
      // Create a preview exam object for display
      setCreatedExam({
        examId: '', // Will be set after creation
        title: examFormData.examDetails.title,
        subject: examFormData.examDetails.subject,
        topic: examFormData.examDetails.topic,
        timeLimitMinutes: examFormData.examDetails.timeLimitMinutes,
        instructions: examFormData.examDetails.instructions,
        questionCount: examFormData.questions.length
      })
    } else {
      // If no form data, redirect back to form
      router.push('/custom-exam/form')
    }
  }, [router])

  const handleAssignExam = async () => {
    if (!createdExam || selectedStudents.length === 0) {
      setError('Missing exam data or no students selected')
      return
    }

    setLoading(true)
    setError('')

    try {
      // STEP 1: First create the exam
      const formData = sessionStorage.getItem('examFormData')
      if (!formData) {
        setError('Form data not found')
        return
      }

      const examFormData = JSON.parse(formData)
      console.log('Creating exam with data:', examFormData)

      // Transform data to match new API format
      const transformedPayload = {
        examDetails: examFormData.examDetails,
        description: examFormData.description || "",
        questions: examFormData.questions.map((question: any) => ({
          questionText: question.questionText,
          questionType: question.questionType,
          marks: question.marks,
          bloomTaxanomy: question.bloomTaxonomy,
          ...(question.questionType === 'MCQ' && question.options ? {
            options: question.options.map((option: any) => ({
              optionText: option.optionText,
              isCorrect: option.isCorrect,
            }))
          } : {}),
          ...(question.questionType !== 'MCQ' && question.correctAnswer ? {
            correctAnswer: question.correctAnswer
          } : {})
        }))
      }

      console.log('Transformed payload:', transformedPayload)

      const createResponse = await api.post('/teacher/custom-exams/create', transformedPayload)

      if (!createResponse.data.success) {
        setError(createResponse.data.message || 'Failed to create exam')
        return
      }

      const createdExamData = createResponse.data.data
      console.log('Created exam response:', createdExamData)

      // STEP 2: Now assign the created exam to students
      if (!institution?.id) {
        setError('Institution information not available')
        return
      }

      const assignmentData = {
        examId: createdExamData.examId,
        studentIds: selectedStudents.map(student => student.id),
        institutionId: institution.id
      }

      console.log('Assigning exam with data:', assignmentData)

      const assignResponse = await api.post('/teacher/custom-exams/assign', assignmentData)

      if (assignResponse.data.success) {
        setSuccess(`Exam created and assigned successfully to ${assignResponse.data.data.assignedCount} students`)

        // Clear sessionStorage
        sessionStorage.removeItem('customExamSelectedStudents')
        sessionStorage.removeItem('customExamGradeAndSection')
        sessionStorage.removeItem('examFormData')

        // Redirect to main page after success
        setTimeout(() => {
          router.push('/custom-exam')
        }, 2000)
      } else {
        setError(assignResponse.data.message || 'Failed to assign exam')
      }
    } catch (err: unknown) {
      console.error('Assignment error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create and assign exam')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('customExamSelectedStudents')
    sessionStorage.removeItem('customExamGradeAndSection')
    sessionStorage.removeItem('examFormData')
    router.push('/custom-exam')
  }

  const handleEdit = () => {
    // Go back to form to edit
    router.push('/custom-exam/form')
  }

  if (!createdExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading exam data...</h2>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Exam Confirmation</h1>
          <p className="text-gray-600">Review your exam and assign it to selected students</p>
        </div>

        <ExamView
          examData={{
            title: createdExam.title,
            subject: createdExam.subject,
            description: createdExam.instructions || `Custom exam: ${createdExam.topic}`,
            examType: 'Custom Exam',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            timeLimit: `${createdExam.timeLimitMinutes} min`,
            topic: createdExam.topic,
            difficulty: 'Custom',
            questionCount: `${createdExam.questionCount} questions`,
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
          onGenerate={handleAssignExam}
          loading={loading}
          error={error}
          success={success}
        />
      </div>
    </div>
  )
}
