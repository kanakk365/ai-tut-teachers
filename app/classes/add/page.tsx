"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from '@/components/ui/sidebar';
import api from '@/lib/api';

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

interface Standard {
  id: string;
  name: string;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export default function CreateClassPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    classGrade: "",
    institution: "",
    classEmail: "",
    sections: "",
    teacherName: "",
    academicYear: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.classGrade.trim()) {
      setError('Please select a class grade');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post<ApiResponse<{ standard: Standard }>>('/teacher/standards', {
        name: formData.classGrade.trim(),
      });

      if (response.data.success) {
        setSuccess('Class created successfully!');
        setTimeout(() => {
          router.push('/classes');
        }, 2000);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create class'
        : 'Failed to create class';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    router.push("/classes")
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-6">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Header */}
              <div className="px-8 py-8">
                <h1 className="text-2xl font-semibold text-gray-900">Create new class</h1>
              </div>

              {/* Alert Messages */}
              {(error || success) && (
                <div className="mx-8 mb-6 space-y-4">
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <span className="text-red-500 text-xl mr-3">❌</span>
                        <p className="text-red-700 font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                  {success && (
                    <div className="bg-[var(--primary-50)] border-l-4 border-[color:var(--primary-300)] p-4 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <span className="text-[color:var(--primary-600)] text-xl mr-3">✅</span>
                        <p className="text-[color:var(--primary-700)] font-medium">{success}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column */}
                  <div className="space-y-8">
                    {/* Class Name / Grade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Class Name / Grade
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.classGrade}
                          onValueChange={(value) => setFormData({ ...formData, classGrade: value })}
                        >
                          <SelectTrigger className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all">
                            <SelectValue placeholder="Grade 1-10" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => (
                              <SelectItem key={`grade-${i + 1}`} value={`Grade ${i + 1}`}>
                                Grade {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Institution */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Institution
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.institution}
                          onValueChange={(value) => setFormData({ ...formData, institution: value })}
                        >
                          <SelectTrigger className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all">
                            <SelectValue placeholder="School, college, high school" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="college">College</SelectItem>
                            <SelectItem value="high-school">High School</SelectItem>
                            <SelectItem value="university">University</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Class Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Class Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        value={formData.classEmail}
                        onChange={(e) => setFormData({ ...formData, classEmail: e.target.value })}
                        className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] placeholder:text-[color:var(--primary-500)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-8">
                    {/* Sections */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Sections
                      </label>
                      <Input
                        placeholder="Enter section"
                        value={formData.sections}
                        onChange={(e) => setFormData({ ...formData, sections: e.target.value })}
                        className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] placeholder:text-[color:var(--primary-500)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Class Teacher Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Class Teacher Name
                      </label>
                      <Input
                        placeholder="Enter name"
                        value={formData.teacherName}
                        onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                        className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] placeholder:text-[color:var(--primary-500)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all"
                      />
                    </div>

                    {/* Academic Year */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Academic Year
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.academicYear}
                          onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                        >
                          <SelectTrigger className="w-full h-14 px-5 bg-[var(--primary-50)] border border-[color:var(--primary-200)] rounded-lg text-[color:var(--primary-700)] focus:ring-2 focus:ring-[color:var(--primary-300)] focus:border-[color:var(--primary-400)] focus:bg-white transition-all">
                            <SelectValue placeholder="e.g. 2024-25" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024-25">2024-25</SelectItem>
                            <SelectItem value="2025-26">2025-26</SelectItem>
                            <SelectItem value="2026-27">2026-27</SelectItem>
                            <SelectItem value="2023-24">2023-24</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-12 pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-10 py-4 h-14 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.classGrade.trim()}
                    className="px-10 py-4 h-14 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-[color:var(--primary-500)] hover:bg-[color:var(--primary-600)] text-[color:var(--primary-foreground)]"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                        Creating...
                      </span>
                    ) : (
                      'Create class'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
