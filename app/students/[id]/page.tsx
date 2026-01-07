'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, FileText, TrendingUp, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  class: string | null;
  section: string | null;
  schoolMailId: string | null;
  phone: string;
  alternatePhone: string | null;
  photoUrl: string;
  profilePictureUrl: string | null;
  isRegistrationCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  institutionId: string;
  standardId: string;
  sectionId: string;
  institution: {
    id: string;
    name: string;
  };
  standard: {
    id: string;
    name: string;
  };
  studentSection: {
    id: string;
    name: string;
  };
  quizzes: unknown[];
  SubmitQuiz: unknown[];
  Project: unknown[];
  AssignedProject: unknown[];
  assignedExams: unknown[];
  dailyChallenges: unknown[];
  personalizedTopicInsights: unknown[];
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

interface SubjectStat {
  subject: string;
  totalAttempts: number;
  averageScore: number;
  quizAttempts: number;
  examAttempts: number;
  customQuizAttempts: number;
  customExamAttempts: number;
  quizAverageScore: number;
  examAverageScore: number;
  customQuizAverageScore: number;
  customExamAverageScore: number;
}

interface StudentStats {
  subjectStats: SubjectStat[];
  totalSubjects: number;
  filters: {
    gradeId: string | null;
    sectionId: string | null;
    subject: string | null;
    activityType: string | null;
  };
}

type MetricKey =
  | 'averageScore'
  | 'quizAverageScore'
  | 'examAverageScore'
  | 'customQuizAverageScore'
  | 'customExamAverageScore';

const metricOptions: Array<{ value: MetricKey; label: string }> = [
  { value: 'averageScore', label: 'Overall Average Score' },
  { value: 'quizAverageScore', label: 'Quiz Average Score' },
  { value: 'examAverageScore', label: 'Exam Average Score' },
  { value: 'customQuizAverageScore', label: 'Custom Quiz Average Score' },
  { value: 'customExamAverageScore', label: 'Custom Exam Average Score' },
];

const metricLabels: Record<MetricKey, string> = metricOptions.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<MetricKey, string>
);

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('averageScore');

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    quizzes: false,
    projects: false,
    progress: false,
    household: false
  });

  const attemptTotals = useMemo(
    () => {
      if (!studentStats?.subjectStats?.length) {
        return {
          quizAttempts: 0,
          examAttempts: 0,
          customQuizAttempts: 0,
          customExamAttempts: 0,
        };
      }

      return studentStats.subjectStats.reduce(
        (acc, current) => {
          acc.quizAttempts += Number(current.quizAttempts ?? 0);
          acc.examAttempts += Number(current.examAttempts ?? 0);
          acc.customQuizAttempts += Number(current.customQuizAttempts ?? 0);
          acc.customExamAttempts += Number(current.customExamAttempts ?? 0);
          return acc;
        },
        {
          quizAttempts: 0,
          examAttempts: 0,
          customQuizAttempts: 0,
          customExamAttempts: 0,
        }
      );
    },
    [studentStats]
  );

  const attemptCards = useMemo(
    () => [
      {
        key: 'quizAttempts' as const,
        label: 'Quiz Attempts',
        value: attemptTotals.quizAttempts,
        icon: ClipboardList,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
      {
        key: 'examAttempts' as const,
        label: 'Exam Attempts',
        value: attemptTotals.examAttempts,
        icon: FileText,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
      {
        key: 'customQuizAttempts' as const,
        label: 'Custom Quiz Attempts',
        value: attemptTotals.customQuizAttempts,
        icon: Users,
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
      {
        key: 'customExamAttempts' as const,
        label: 'Custom Exam Attempts',
        value: attemptTotals.customExamAttempts,
        icon: TrendingUp,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    ],
    [attemptTotals]
  );

  const chartData = useMemo(
    () => {
      if (!studentStats?.subjectStats?.length) {
        return [] as Array<{ subject: string; value: number }>;
      }

      return studentStats.subjectStats.map((stat) => ({
        subject: stat.subject,
        value: Number((stat as Record<MetricKey, number>)[selectedMetric] ?? 0),
      }));
    },
    [selectedMetric, studentStats]
  );


  const selectedMetricLabel = metricLabels[selectedMetric];

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        const response = await api.get<ApiResponse<{ student: Student }>>(`/teacher/students/${studentId}`);

        if (response.data.success) {
          setStudent(response.data.data.student);
        } else {
          setError('Failed to fetch student details');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error && 'response' in err
          ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch student details'
          : 'Failed to fetch student details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!studentId) return;

      try {
        setStatsLoading(true);
        setStatsError('');
        const response = await api.get<ApiResponse<StudentStats>>(`/analytics/student-stats/${studentId}`);

        if (response.data.success && response.data.data) {
          setStudentStats(response.data.data);
        } else {
          setStudentStats(null);
          setStatsError(response.data.message || 'Failed to fetch student analytics');
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error && 'response' in err
          ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch student analytics'
          : 'Failed to fetch student analytics';
        setStatsError(errorMessage);
        setStudentStats(null);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStudentStats();
  }, [studentId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    router.push('/students');
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading student details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-3">❌</span>
                <p className="text-red-700 font-medium">{error || 'Student not found'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="mt-4 px-6 py-2 rounded-lg transition-colors button-primary"
            >
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          {statsLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--primary-500)]" />
                <span className="text-sm font-medium">Loading student analytics…</span>
              </div>
            </div>
          )}

          {statsError && !statsLoading && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <p className="text-sm font-medium">{statsError}</p>
            </div>
          )}

          {studentStats && !statsError && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {attemptCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.key} className="border-0 shadow-sm">
                      <CardContent className="flex items-center justify-between p-5">
                        <div>
                          <p className="text-sm text-gray-500">{card.label}</p>
                          <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                        </div>
                        <div className={`rounded-full p-3 ${card.iconBg}`}>
                          <Icon className={`h-6 w-6 ${card.iconColor}`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Subject Performance</h3>
                    <p className="text-sm text-gray-500">Viewing {selectedMetricLabel.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Metric</span>
                    <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
                      <SelectTrigger className="min-w-[220px]">
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {metricOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 16, right: 24, left: 16, bottom: 32 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="subject"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <Tooltip
                          formatter={(value: number) => [value, selectedMetricLabel]}
                          cursor={{ fill: 'rgba(79, 70, 229, 0.08)' }}
                        />
                        <Bar dataKey="value" fill="var(--primary-500)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
