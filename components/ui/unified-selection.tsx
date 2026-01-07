"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import api from "@/lib/api"

// Unified interfaces
interface Standard {
  id: string
  name: string
  institutionId: string
  createdAt: string
  updatedAt: string
  sections: Section[]
}

interface Section {
  id: string
  name: string
  createdAt: string
}

interface Student {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  isActive: boolean
  standard: { id: string; name: string }
  studentSection: { id: string; name: string }
}

// Unified selection flow props
interface UnifiedSelectionFlowProps {
  flowType: 'exam' | 'quiz' | 'custom-exam' | 'custom-quiz'
  onComplete: (data: {
    standard: Standard
    section: Section
    students?: Student[]
  }) => void
  skipStudentSelection?: boolean
  allowMultipleStudents?: boolean
  title?: string
}

// Reusable Loading Component
export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  )
}

// Reusable Error Component
export function ErrorMessage({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-3">❌</span>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}

// Reusable Success Component
export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 rounded-lg"
      style={{
        backgroundColor: "var(--primary-50)",
        border: `1px solid var(--primary-200)`,
        color: "var(--primary-700)",
      }}
    >
      {message}
    </div>
  )
}

// Reusable Card Selection Component
export function SelectionCard({
  title,
  backgroundImage,
  onClick,
  selected = false
}: {
  title: string
  backgroundImage: string
  onClick: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      className={`bg-cover bg-center rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:scale-105 w-full h-32 min-h-[8rem] relative overflow-hidden ${selected
          ? 'border-4 border-[var(--primary-500)] shadow-xl scale-105'
          : 'border-0 hover:shadow-lg'
        }`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
      onClick={onClick}
    >
      <div className="relative z-10 h-full flex items-center justify-center">
        <h2 className="text-xl font-bold text-white text-center drop-shadow-lg">
          {title}
        </h2>
      </div>
    </button>
  )
}

// Grade Selection Component
export function GradeSelectionStep({
  onNext,
  title = "Select Grade"
}: {
  onNext: (standard: Standard) => void
  title?: string
}) {
  const [standards, setStandards] = useState<Standard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null)

  const fetchAllStandards = async () => {
    try {
      setLoading(true)
      setError(null)
      let allStandards: Standard[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const response = await api.get(`/teacher/standards?page=${currentPage}`)

        if (response.data.success) {
          allStandards = [...allStandards, ...response.data.data.standards]

          if (currentPage >= response.data.data.pagination.totalPages) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else {
          hasMorePages = false
          setError('Failed to fetch standards')
        }
      }

      setStandards(allStandards)
    } catch (error) {
      console.error('Error fetching standards:', error)
      setError('Failed to fetch standards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllStandards()
  }, [])

  const handleGradeSelect = (standard: Standard) => {
    setSelectedStandard(standard)
    onNext(standard)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

      {loading ? (
        <LoadingSpinner message="Loading grades..." />
      ) : error ? (
        <ErrorMessage error={error} onRetry={fetchAllStandards} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {standards.map((standard) => (
            <SelectionCard
              key={standard.id}
              title={standard.name}
              backgroundImage="/grade-selection.png"
              onClick={() => handleGradeSelect(standard)}
              selected={selectedStandard?.id === standard.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Section Selection Component
export function SectionSelectionStep({
  standard,
  onNext,
  onBack
}: {
  standard: Standard
  onNext: (section: Section) => void
  onBack: () => void
}) {
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section)
    onNext(section)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline">
          ← Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Select section - {standard.name}
        </h1>
      </div>

      {standard.sections.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-yellow-700 font-medium">
            No sections available for {standard.name}. Please contact your administrator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {standard.sections.map((section) => (
            <SelectionCard
              key={section.id}
              title={`Section ${section.name}`}
              backgroundImage="/section-selection.png"
              onClick={() => handleSectionSelect(section)}
              selected={selectedSection?.id === section.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Student Selection Component
export function StudentSelectionStep({
  standard,
  section,
  onNext,
  onBack,
  allowMultiple = true
}: {
  standard: Standard
  section: Section
  onNext: (students: Student[]) => void
  onBack: () => void
  allowMultiple?: boolean
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      let allStudents: Student[] = []
      let currentPage = 1
      let hasMorePages = true

      while (hasMorePages) {
        const response = await api.get(
          `/teacher/students?page=${currentPage}&limit=10&standardName=${standard.name}&sectionName=${section.name}`
        )

        if (response.data.success) {
          allStudents = [...allStudents, ...response.data.data.students]

          if (currentPage >= response.data.data.pagination.totalPages) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else {
          hasMorePages = false
          setError('Failed to fetch students')
        }
      }

      setStudents(allStudents)
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [standard.name, section.name])

  const handleStudentSelection = (studentId: string) => {
    if (allowMultiple) {
      setSelectedStudents(prev =>
        prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId]
      )
    } else {
      setSelectedStudents([studentId])
    }
  }

  const handleSelectAll = () => {
    setSelectedStudents(
      selectedStudents.length === students.length ? [] : students.map(s => s.id)
    )
  }

  const handleNext = () => {
    const selected = students.filter(s => selectedStudents.includes(s.id))
    onNext(selected)
  }

  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <LoadingSpinner message="Loading students..." />
  if (error) return <ErrorMessage error={error} onRetry={fetchStudents} />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline">
          ← Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          Students - Grade {standard.name}, Section {section.name}
        </h1>
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={handleSelectAll} variant="outline">
          {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
        </Button>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students here"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 w-80"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <p className="text-yellow-700 font-medium">
            No students found in {standard.name}, Section {section.name}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{student.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.isActive ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => handleStudentSelection(student.id)}
                      variant={selectedStudents.includes(student.id) ? "default" : "outline"}
                      size="sm"
                    >
                      {selectedStudents.includes(student.id) ? 'Selected' : 'Select'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button onClick={onBack} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleNext}
          disabled={selectedStudents.length === 0}
          className="button-primary"
        >
          Continue with {selectedStudents.length} student(s)
        </Button>
      </div>
    </div>
  )
}

// Main Unified Selection Flow Component
export function UnifiedSelectionFlow({
  flowType,
  onComplete,
  skipStudentSelection = false,
  allowMultipleStudents = true,
  title
}: UnifiedSelectionFlowProps) {
  const [step, setStep] = useState<'grade' | 'section' | 'students'>('grade')
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  const handleGradeNext = (standard: Standard) => {
    setSelectedStandard(standard)
    setStep('section')
  }

  const handleSectionNext = (section: Section) => {
    setSelectedSection(section)
    if (skipStudentSelection) {
      onComplete({
        standard: selectedStandard!,
        section: section
      })
    } else {
      setStep('students')
    }
  }

  const handleStudentsNext = (students: Student[]) => {
    onComplete({
      standard: selectedStandard!,
      section: selectedSection!,
      students: students
    })
  }

  const handleBack = () => {
    if (step === 'section') {
      setStep('grade')
      setSelectedStandard(null)
    } else if (step === 'students') {
      setStep('section')
      setSelectedSection(null)
    }
  }

  return (
    <div className="p-6">
      {step === 'grade' && (
        <GradeSelectionStep
          onNext={handleGradeNext}
          title={title || `Select Grade for ${flowType}`}
        />
      )}

      {step === 'section' && selectedStandard && (
        <SectionSelectionStep
          standard={selectedStandard}
          onNext={handleSectionNext}
          onBack={handleBack}
        />
      )}

      {step === 'students' && selectedStandard && selectedSection && (
        <StudentSelectionStep
          standard={selectedStandard}
          section={selectedSection}
          onNext={handleStudentsNext}
          onBack={handleBack}
          allowMultiple={allowMultipleStudents}
        />
      )}
    </div>
  )
}
