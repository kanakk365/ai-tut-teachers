"use client"

import { useState } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { StudentList } from "@/components/StudentList"
import { ExamAssignment } from "@/components/ExamAssignment"
import { ExamView } from "@/components/exam-view"
import { QuizHistory } from "@/components/quiz-history"
import { StudentAttempts } from "@/components/student-attempts"

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
  is_studentCheated: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  answers: Answer[]
  videos: {
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
  }[]
  cheatingStatus: {
    is_studentCheated: boolean
  }
}

export default function QuizzesPage() {
  const [currentView, setCurrentView] = useState("quiz-history")
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  const handleViewQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    // Set default grade and section for now - you might want to fetch this from standards API
    setSelectedGrade(1) // Default to grade 1
    setSelectedSection("A") // Default to section A
    setCurrentView("student-attempts")
  }

  const renderContent = () => {
    switch (currentView) {
      case "student-list":
        return (
          <StudentList
            standardName={`Grade ${selectedGrade || 1}`}
            sectionName={selectedSection || "A"}
            examTitle={selectedQuiz?.title}
            onAssignExam={() => setCurrentView("quiz-assignment")}
            onBack={() => setCurrentView("quiz-history")}
          />
        )
      case "quiz-assignment":
        return (
          <ExamAssignment
            onCancel={() => setCurrentView("student-list")}
            onAssign={() => setCurrentView("quiz-created")}
          />
        )
      case "quiz-created":
        return (
          <ExamView
            onCancel={() => setCurrentView("student-list")}
            onEdit={() => setCurrentView("quiz-assignment")}
          />
        )
      case "student-attempts":
        return (
          <StudentAttempts
            quizTitle={selectedQuiz?.title}
            quiz={selectedQuiz || undefined}
            onBack={() => {
              setCurrentView("quiz-history")
              setSelectedQuiz(null)
            }}
          />
        )
      case "quiz-history":
        return <QuizHistory onViewQuiz={handleViewQuiz} />
      default:
        return <QuizHistory onViewQuiz={handleViewQuiz} />
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
