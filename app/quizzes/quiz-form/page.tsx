'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SUBJECT_OPTIONS } from "@/lib/subjects"
import api from '@/lib/axios';

interface SelectedStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface QuizFormData {
  topic: string;
  difficulty: string;
  subject: string;
  questionCount: string;
  dueDate: string;
  timeLimit: string;
  bloomTaxonomy: string;
  description: string;
}

interface QuizGenerationPayload {
  subject: string;
  topic: string;
  level: string;
  questionConfig: {
    count: number;
    marksPerQuestion: number;
  };
  bloomTaxanomy: string;
  description: string;
}

export default function QuizFormPage() {
  const [formData, setFormData] = useState<QuizFormData>({
    topic: '',
    difficulty: '',
    subject: '',
    questionCount: '',
    dueDate: '',
    timeLimit: '',
    bloomTaxonomy: 'remember',
    description: ''
  });

  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [standardName, setStandardName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'confirmation' | 'generated'>('form');
  const router = useRouter();

  useEffect(() => {
    // Get selected students from sessionStorage
    const studentsData = sessionStorage.getItem('selectedStudentsForQuiz');
    if (studentsData) {
      const data = JSON.parse(studentsData);
      setSelectedStudents(data.selectedStudents || []);
      setStandardName(data.standardName || '');
      setSectionName(data.sectionName || '');
    } else {
      // If no students selected, redirect back to grade selection
      router.push('/quizzes/create');
    }
  }, [router]);

  const handleInputChange = (field: keyof QuizFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.topic) return 'Topic is required';
    if (!formData.difficulty) return 'Difficulty is required';
    if (!formData.subject) return 'Subject is required';
    if (!formData.questionCount) return 'Number of questions is required';
    if (!formData.dueDate) return 'Due date is required';
    if (!formData.timeLimit) return 'Time limit is required';
    if (!formData.bloomTaxonomy) return 'Bloom\'s taxonomy level is required';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setCurrentStep('confirmation');
  };

  const handleGenerateQuiz = async () => {
    setLoading(true);

    try {
      // STEP 1: Generate the quiz
      const payload: QuizGenerationPayload = {
        subject: formData.subject,
        topic: formData.topic,
        level: formData.difficulty.toLowerCase(),
        questionConfig: {
          count: parseInt(formData.questionCount) || 10,
          marksPerQuestion: 2
        },
        bloomTaxanomy: formData.bloomTaxonomy,
        description: formData.description
      };

      console.log('Generating quiz with payload:', payload);
      const response = await api.post('/teacher/quizzes/generate', payload);

      if (response.data.success) {
        // Extract quiz ID from response
        const quizId = response.data.data.quiz.id;
        console.log('Quiz generated successfully with ID:', quizId);

        // STEP 2: Assign the quiz to selected students
        const assignmentData = {
          quizId: quizId,
          studentIds: selectedStudents.map(student => student.id),
          dueDate: new Date(formData.dueDate).toISOString()
        };

        console.log('Assigning quiz with data:', assignmentData);
        const assignResponse = await api.post('/teacher/quizzes/assign', assignmentData);

        if (assignResponse.data.success) {
          console.log('Quiz assigned successfully');
          setCurrentStep('generated');
          // Clear session storage
          sessionStorage.removeItem('selectedStudentsForQuiz');
          sessionStorage.removeItem('selectedStandard');
          sessionStorage.removeItem('gradeAndSection');
        } else {
          setError('Quiz generated but failed to assign: ' + assignResponse.data.message);
        }
      } else {
        setError('Failed to generate quiz: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error generating/assigning quiz:', error);
      setError('Failed to generate or assign quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/quizzes/create');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  if (selectedStudents.length === 0) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <p className="text-yellow-700 font-medium">No students selected. Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
              {/* Header with title and buttons */}
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">S</div>
                  <h1 className="text-lg font-medium text-gray-900">Quiz Created for {standardName}</h1>
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Topic</div>
                      <div className="font-medium text-gray-900">{formData.topic}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                      <div className="font-medium text-gray-900">{formData.difficulty}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Bloom's Taxonomy</div>
                      <div className="font-medium text-gray-900">{formData.bloomTaxonomy}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">No. of Questions</div>
                      <div className="font-medium text-gray-900">{formData.questionCount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Due Date</div>
                      <div className="font-medium text-gray-900">{formData.dueDate}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Time Limit</div>
                      <div className="font-medium text-gray-900">{formData.timeLimit}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Students</div>
                      <div className="font-medium text-gray-900">{selectedStudents.length} selected</div>
                    </div>
                  </div>
                  {formData.description && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Description</div>
                      <div className="font-medium text-gray-900 whitespace-pre-wrap">{formData.description}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons outside the card */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={handleBackToForm}
                className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Take Back
              </button>
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={loading}
                className="px-8 py-2 button-primary rounded-lg disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Generating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'generated') {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-[var(--primary-50)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[color:var(--primary-600)] text-2xl">✓</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quiz Generated and Assigned Successfully!</h1>
                <p className="text-gray-600">Your quiz has been created and assigned to {selectedStudents.length} students.</p>
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
                  className="px-8 py-2 button-primary rounded-lg shadow-sm"
                >
                  Create Another Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 text-xl"
              type="button"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Assign Quiz to Student</h1>
          </div>
          <div className="bg-[var(--primary-50)] border-l-4 border-[var(--primary-400)] p-4 rounded-lg">
            <p className="text-[var(--primary-700)] font-medium">
              Creating quiz for Grade {standardName}, Section {sectionName} - {selectedStudents.length} students selected
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">❌</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topic</label>
                <Input
                  id="topic"
                  placeholder="Enter a topic"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)] placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
                <Select
                  value={formData.difficulty || undefined}
                  onValueChange={(value) => handleInputChange('difficulty', value)}
                >
                  <SelectTrigger
                    id="difficulty"
                    className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]"
                  >
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="bloomTaxonomy" className="block text-sm font-medium text-gray-700">Bloom's Taxonomy</label>
                <Select
                  value={formData.bloomTaxonomy || undefined}
                  onValueChange={(value) => handleInputChange('bloomTaxonomy', value)}
                >
                  <SelectTrigger id="bloomTaxonomy" className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    <SelectItem value="remember">Remember</SelectItem>
                    <SelectItem value="understand">Understand</SelectItem>
                    <SelectItem value="apply">Apply</SelectItem>
                    <SelectItem value="analyze">Analyze</SelectItem>
                    <SelectItem value="evaluate">Evaluate</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                <Select
                  value={formData.subject || undefined}
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger id="subject" className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    {SUBJECT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-gray-100 px-3 py-2">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="questions" className="block text-sm font-medium text-gray-700">No. of Questions</label>
                <Select
                  value={formData.questionCount || undefined}
                  onValueChange={(value) => handleInputChange('questionCount', value)}
                >
                  <SelectTrigger id="questions" className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]">
                    <SelectValue placeholder="Select number of questions" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    <SelectItem value="3">3 questions</SelectItem>
                    <SelectItem value="4">4 questions</SelectItem>
                    <SelectItem value="5">5 questions</SelectItem>
                    <SelectItem value="6">6 questions</SelectItem>
                    <SelectItem value="7">7 questions</SelectItem>
                    <SelectItem value="8">8 questions</SelectItem>
                    <SelectItem value="9">9 questions</SelectItem>
                    <SelectItem value="10">10 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Due Date</label>
                <Input
                  id="due-date"
                  type="date"
                  value={formData.dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="time-limit" className="block text-sm font-medium text-gray-700">Time Limit</label>
                <Select
                  value={formData.timeLimit || undefined}
                  onValueChange={(value) => handleInputChange('timeLimit', value)}
                >
                  <SelectTrigger id="time-limit" className="h-10 w-full border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)]">
                    <SelectValue placeholder="Select time limit" />
                  </SelectTrigger>
                  <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="25">25 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                placeholder="Enter quiz description (optional)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[color:var(--primary-200)] focus:border-[color:var(--primary-400)] focus:ring-[color:var(--primary-300)] bg-[var(--primary-50)] text-[color:var(--primary-800)] placeholder:text-gray-500 rounded-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 button-primary rounded-lg shadow-sm"
              >
                Assign quiz
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
