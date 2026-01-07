'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AssignedSection {
    teacherSectionId: string;
    sectionId: string;
    sectionName: string;
    standardId: string;
    standardName: string;
}

interface TeacherProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    institution: {
        id: string;
        name: string;
    };
    assignedSections: AssignedSection[];
}

interface ApiResponse<T> {
    statusCode: number;
    success: boolean;
    message: string;
    data: T;
}

// Group sections by standard for display
interface GroupedClass {
    standardId: string;
    standardName: string;
    sections: AssignedSection[];
}

export default function ClassesPage() {
    const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
    const [groupedClasses, setGroupedClasses] = useState<GroupedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    // Fetch teacher profile with assigned sections
    const fetchTeacherProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get<ApiResponse<TeacherProfile>>('/teacher/profile');

            if (response.data.success) {
                setTeacherProfile(response.data.data);

                // Group sections by standard
                const grouped: { [key: string]: GroupedClass } = {};

                response.data.data.assignedSections.forEach((section) => {
                    if (!grouped[section.standardId]) {
                        grouped[section.standardId] = {
                            standardId: section.standardId,
                            standardName: section.standardName,
                            sections: []
                        };
                    }
                    grouped[section.standardId].sections.push(section);
                });

                setGroupedClasses(Object.values(grouped));
            } else {
                setError('Failed to fetch profile');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error && 'response' in err
                ? (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to fetch profile'
                : 'Failed to fetch profile';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeacherProfile();
    }, [fetchTeacherProfile]);

    // Filter classes based on search
    const filteredClasses = groupedClasses.filter(classItem =>
        classItem.standardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classItem.sections.some(s => s.sectionName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Calculate total sections
    const totalSections = groupedClasses.reduce((acc, curr) => acc + curr.sections.length, 0);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleViewClass = (standardId: string) => {
        router.push(`/classes/${standardId}`);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-white">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-500)] mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Loading your classes...</p>
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
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-[var(--primary-500)] text-white rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">🎓 My Classes</h1>
                                <p className="text-blue-100 text-lg">
                                    Welcome, {teacherProfile?.firstName} {teacherProfile?.lastName}
                                </p>
                                <p className="text-blue-200 text-sm mt-1">
                                    {teacherProfile?.institution?.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold">{groupedClasses.length}</div>
                                <div className="text-blue-100">Assigned Classes</div>
                                <div className="text-sm text-blue-200 mt-1">{totalSections} Total Sections</div>
                            </div>
                        </div>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center">
                                <span className="text-red-500 text-xl mr-3">❌</span>
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search classes or sections..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent shadow-sm"
                                />
                                <span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
                            </div>
                        </div>
                    </div>

                    {/* Classes List */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <span className="text-[color:var(--primary-500)] mr-3">🎓</span>
                                    Assigned Classes
                                </h3>
                                <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                                    {filteredClasses.length} classes • {totalSections} sections
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {filteredClasses.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="text-gray-300 text-8xl mb-4">🎓</div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {searchTerm ? 'No classes found' : 'No assigned classes'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        {searchTerm
                                            ? 'Try adjusting your search terms'
                                            : 'You have not been assigned to any classes yet. Please contact your administrator.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {filteredClasses.map((classItem, index) => (
                                        <div
                                            key={classItem.standardId}
                                            className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
                                            onClick={() => handleViewClass(classItem.standardId)}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
                                                        style={{
                                                            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                                                            color: "var(--primary-foreground)",
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-bold text-gray-800">{classItem.standardName}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Click to view class details
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                                                        {classItem.sections.length} section{classItem.sections.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h5 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">My Sections</h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                    {classItem.sections.map((section) => (
                                                        <div
                                                            key={section.teacherSectionId}
                                                            className="bg-white border border-gray-200 rounded-lg p-3 text-center hover:shadow-md transition-all duration-200 hover:border-[var(--primary-300)]"
                                                        >
                                                            <div className="font-bold text-gray-800 text-lg">Section {section.sectionName}</div>
                                                            <div className="text-xs text-[color:var(--primary-600)] mt-1 font-medium">
                                                                Assigned
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
