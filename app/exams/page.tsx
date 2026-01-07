"use client"

import { useState } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { StudentList } from "@/components/StudentList"
import { ExamAssignment } from "@/components/ExamAssignment"
import { ExamView } from "@/components/exam-view"
import { ExamHistory } from "@/components/exam-history"
import { ExamAttempts } from "@/components/exam-attempts"

interface Exam {
  id: string
  title: string
  topic: string
  difficulty: string
  type: string
  timeLimitMinutes: number
  createdAt: string
  isActive: boolean
  teacher: {
    id: string
    name: string
  }
  classSection: {
    standardId: string | null
    standardName: string | null
    sectionId: string | null
    sectionName: string | null
  }
  stats: {
    totalAssigned: number
    completed: number
    averageScore: number | null
  }
  questions: {
    id: string
    text: string
    type: string
    marks: number
    options: {
      id: string
      text: string
      isCorrect: boolean
    }[]
  }[]
}

interface QuizFormData {
  examTitle: string
  subject: string
  description: string
  examType: string
  dueDate: string
  timeLimit: string
}

export default function ExamsPage() {
  const [currentView, setCurrentView] = useState("exam-history")
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examFormData, setExamFormData] = useState<QuizFormData | null>(null)

  const handleExamFormSubmit = (formData: QuizFormData) => {
    setExamFormData(formData)
    setCurrentView("exam-confirmation")
  }

  const handleExamConfirm = () => {
    // Here you would call the API to create the exam
    console.log("Creating exam with data:", examFormData)
    setCurrentView("exam-created")
  }

  const handleBackToExamForm = () => {
    setCurrentView("exam-assignment")
  }

  const handleViewExam = (exam: Exam) => {
    setSelectedExam(exam)
    // Extract grade from standardName or use default
    const standardName = exam.classSection.standardName || "1"
    const gradeMatch = standardName.match(/(\d+)/)
    const grade = gradeMatch ? parseInt(gradeMatch[1]) : 1
    setSelectedGrade(grade)
    setSelectedSection(exam.classSection.sectionName || "A")
    setCurrentView("exam-details")
  }

  const handleBackToExamHistory = () => {
    setSelectedExam(null)
    setCurrentView("exam-history")
  }

  const renderContent = () => {
    switch (currentView) {
      case "exam-details":
        return (
          <ExamAttempts
            examId={selectedExam?.id || ""}
            examTitle={selectedExam?.title}
            onBack={handleBackToExamHistory}
          />
        )
      case "student-list":
        return (
          <StudentList
            standardName={`Grade ${selectedGrade || 1}`}
            sectionName={selectedSection || "A"}
            examTitle={selectedExam?.title}
            onAssignExam={() => setCurrentView("exam-assignment")}
            onBack={() => selectedExam ? setCurrentView("exam-history") : setCurrentView("exam-history")}
          />
        )
      case "exam-assignment":
        return (
          <ExamAssignment
            onCancel={() => setCurrentView("student-list")}
            onAssign={handleExamFormSubmit}
          />
        )
      case "exam-confirmation":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-semibold">Exam Created for Grade {selectedGrade}</h1>
            </div>

            <div className="max-w-2xl space-y-6">
              {examFormData && (
                <>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Exam Title</div>
                      <div className="font-medium">{examFormData.examTitle}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Subject</div>
                      <div className="font-medium">{examFormData.subject}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Description</div>
                      <div className="font-medium">{examFormData.description}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Exam type</div>
                      <div className="font-medium">{examFormData.examType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Due date</div>
                      <div className="font-medium">{examFormData.dueDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Time limit</div>
                      <div className="font-medium">{examFormData.timeLimit}</div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleBackToExamForm}
                  className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView("student-list")}
                  className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Take Back
                </button>
                <button
                  type="button"
                  onClick={handleExamConfirm}
                  className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )
      case "exam-created":
        return (
          <ExamView
            onCancel={() => setCurrentView("student-list")}
            onEdit={() => setCurrentView("exam-assignment")}
          />
        )
      case "exam-history":
        return <ExamHistory onViewExam={handleViewExam} />
      case "exam-results":
        return <ExamView isResultView />
      default:
        return <ExamHistory onViewExam={handleViewExam} />
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

