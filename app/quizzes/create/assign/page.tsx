"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/ui/sidebar"
import { StudentList } from "@/components/StudentList"
import { ExamAssignment } from "@/components/ExamAssignment"
import api from "@/lib/axios"

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  standardId: string
  sectionId: string
}

interface GradeAndSectionData {
  standardName: string
  sectionName: string
  standard: {
    id: string
    name: string
  }
  section: {
    id: string
    name: string
  }
}

interface QuizFormData {
  examTitle: string
  subject: string
  description: string
  examType: string
  dueDate: string
  timeLimit: string
}

interface QuizGenerationPayload {
  subject: string
  topic: string
  level: string
  questionConfig: {
    count: number
    marksPerQuestion: number
  }
}

export default function QuizAssignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<"students" | "assignment" | "confirmation" | "generated">("students")
  const [gradeAndSection, setGradeAndSection] = useState<GradeAndSectionData | null>(null)
  const [quizFormData, setQuizFormData] = useState<QuizFormData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Get the quiz grade and section data from the updated selection flow
    const quizData = sessionStorage.getItem('quizGradeAndSection')

    if (quizData) {
      const parsedData: GradeAndSectionData = JSON.parse(quizData)
      setGradeAndSection(parsedData)
    } else {
      // If no grade and section selected, redirect to grade selection
      router.push('/quizzes/create/grade')
    }
  }, [router])

  const handleAssignToAll = (students?: Student[]) => {
    if (!gradeAndSection) return

    // Prepare data for quiz-form component
    const quizData = {
      selectedStudents: students || [], // Pass the actual students
      standardName: gradeAndSection.standardName,
      sectionName: gradeAndSection.sectionName
    }

    // Store the data for quiz-form component
    sessionStorage.setItem('selectedStudentsForQuiz', JSON.stringify(quizData))

    // Navigate to quiz-form
    router.push('/quizzes/quiz-form')
  }

  const handleBackToStudents = () => {
    setCurrentStep("students")
  }

  const handleFormSubmit = (formData: QuizFormData) => {
    setQuizFormData(formData)
    setCurrentStep("confirmation")
  }

  const handleBackToForm = () => {
    setCurrentStep("assignment")
  }

  const handleGenerateQuiz = async () => {
    if (!quizFormData) return

    setIsGenerating(true)

    try {
      // Prepare the API payload
      const payload: QuizGenerationPayload = {
        subject: quizFormData.subject,
        topic: quizFormData.description, // Using description as topic
        level: "medium", // Default level
        questionConfig: {
          count: 10, // Default count
          marksPerQuestion: 2 // Default marks
        }
      }

      // Call the quiz generation API
      const response = await api.post('/teacher/quizzes/generate', payload)

      if (response.data.success) {
        setCurrentStep("generated")
      } else {
        console.error('Quiz generation failed:', response.data.message)
        // Handle error (you can add error state here)
      }
    } catch (error) {
      console.error('Error generating quiz:', error)
      // Handle error (you can add error state here)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleBackToSectionSelection = () => {
    router.push('/quizzes/create/section')
  }

  const renderContent = () => {
    if (!gradeAndSection) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[color:var(--primary-500)] mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        </div>
      )
    }

    switch (currentStep) {
      case "students":
        return (
          <StudentList
            standardName={gradeAndSection.standardName}
            sectionName={gradeAndSection.sectionName}
            onAssignExam={handleAssignToAll}
            onBack={handleBackToSectionSelection}
          />
        )
      case "assignment":
        return (
          <ExamAssignment
            onCancel={handleBackToStudents}
            onAssign={handleFormSubmit}
          />
        )
      case "confirmation":
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-6xl mx-auto">
              {/* Header with title and buttons */}
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">S</div>
                  <h1 className="text-lg font-medium text-gray-900">Quiz Created for {gradeAndSection.standardName}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="Edit quiz" className="p-2 rounded hover:bg-gray-50 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Edit</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" aria-label="Toggle details" className="p-2 rounded hover:bg-gray-50 text-gray-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <title>Toggle</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Subtle divider line */}
              <div className="mx-6">
                <div className="border-t border-gray-100"></div>
              </div>

              {/* Content area with details */}
              <div className="px-6 py-4">
                {quizFormData && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Exam Title</div>
                        <div className="font-medium text-gray-900">{quizFormData.examTitle}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Subject</div>
                        <div className="font-medium text-gray-900">{quizFormData.subject}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <div className="font-medium text-gray-900">{quizFormData.description}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Exam type</div>
                        <div className="font-medium text-gray-900">{quizFormData.examType}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Due date</div>
                        <div className="font-medium text-gray-900">{quizFormData.dueDate}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Time limit</div>
                        <div className="font-medium text-gray-900">{quizFormData.timeLimit}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons outside the card */}
            <div className="flex justify-end gap-4 mt-6 max-w-6xl mx-auto">
              <button
                type="button"
                onClick={handleBackToForm}
                className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleBackToStudents}
                className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Take Back
              </button>
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="px-8 py-2 rounded-lg disabled:opacity-50 bg-[color:var(--primary-500)] hover:bg-[color:var(--primary-600)] text-[color:var(--primary-foreground)]"
              >
                {isGenerating ? 'Generating...' : 'Confirm'}
              </button>
            </div>
          </div>
        )
      case "generated":
        return (
          <div className="p-6">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--primary-50)]">
                  <span className="text-[color:var(--primary-600)] text-2xl">✓</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quiz Generated Successfully!</h1>
                <p className="text-gray-600">Your quiz has been created and is ready to be assigned to students.</p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => router.push('/quizzes')}
                  className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Quizzes
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/quizzes/create/grade')}
                  className="px-8 py-2 rounded-lg bg-[color:var(--primary-500)] hover:bg-[color:var(--primary-600)] text-[color:var(--primary-foreground)]"
                >
                  Create Another Quiz
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <StudentList
            standardName={gradeAndSection.standardName}
            sectionName={gradeAndSection.sectionName}
            onAssignExam={handleAssignToAll}
            onBack={handleBackToSectionSelection}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  )
}
