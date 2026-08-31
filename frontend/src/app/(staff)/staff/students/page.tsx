'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import UGLogo from '@/components/shared/UGLogo';
import { useAuth } from '@/hooks/useAuth';
import { canAccessStudentRecords, getErrorMessage, formatTimeLabel } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import StaffNav from '@/components/shared/StaffNav';
import { getAllStudents, getStudentHistory, updateStudentStatus, type StaffStudent } from '@/lib/staffApi';
import { queryCache, CACHE_TTL } from '@/lib/queryCache';
import { Search, Users, Mail, Phone, GraduationCap, ChevronLeft, ChevronRight, Eye, Calendar, Clock, X, CheckCircle2, UserX } from '@/components/icons';

export default function StaffStudentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [students, setStudents] = useState<StaffStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Student history modal
  const [selectedStudent, setSelectedStudent] = useState<StaffStudent | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const studentsPerPage = 10;

  useEffect(() => {
    if (user && !canAccessStudentRecords(user.role)) {
      router.replace('/staff/overview');
    }
  }, [user, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (user && !canAccessStudentRecords(user.role)) {
      return;
    }
    fetchStudents();
  }, [isAuthenticated, user]);

  const fetchStudents = async (force = false) => {
    try {
      setLoading(true);
      const cacheKey = 'students:all';

      // Return stale data immediately while we revalidate in background
      const stale = queryCache.getStale<StaffStudent[]>(cacheKey);
      if (stale && !force) {
        setStudents(stale);
        setLoading(false);
        // Background revalidation
        if (!queryCache.isFresh(cacheKey)) {
          const data = await getAllStudents();
          const list = Array.isArray(data.items) ? data.items : [];
          queryCache.set(cacheKey, list, CACHE_TTL.STUDENTS);
          setStudents(list);
        }
        return;
      }

      const data = await getAllStudents();
      const list = Array.isArray(data.items) ? data.items : [];
      queryCache.set(cacheKey, list, CACHE_TTL.STUDENTS);
      setStudents(list);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load students'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentHistory = async (studentId: string) => {
    try {
      setHistoryLoading(true);
      const data = await getStudentHistory(studentId);
      setSelectedStudent(data.student);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load student history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleStudentStatus = async (student: StaffStudent) => {
    try {
      await updateStudentStatus(student.id, !student.isActive);
      if (selectedStudent && selectedStudent.id === student.id) {
        setSelectedStudent({ ...selectedStudent, isActive: !student.isActive });
      }
      // Invalidate students cache so next fetch reflects the change
      queryCache.invalidate('students:all');
      await fetchStudents(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update student active status'));
    }
  };
  const filteredStudents = (students || []).filter(student => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchLower) ||
      student.lastName.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.program?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  if (!isAuthenticated) {
    return null;
  }

  if (user && !canAccessStudentRecords(user.role)) {
    return null;
  }

  if (user && !['RECEPTIONIST', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffNav userRole={user?.role ?? ''} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1221]">Student Medical & Activity Records</h1>
            <p className="text-xs text-[#6B7A8D]">View student patient files, consultation history, and activity status</p>
          </div>
          <span className="self-start sm:self-auto px-3.5 py-1.5 bg-white border border-[#DDE3EE] rounded-xl text-xs font-bold text-[#1e3a8a] shadow-xs">
            {students.length} Registered Students
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-700 flex justify-between items-center text-xs font-semibold">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size={48} />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="bg-white rounded-2xl border border-[#DDE3EE] p-4 mb-6 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA8BA]" />
                <input
                  type="text"
                  placeholder="Search by student name, Student ID, email, or program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-[#DDE3EE] bg-white text-[#0B1221] rounded-xl text-sm hover:border-[#94A3B8] focus:outline-none focus:border-[#0369A1] focus:ring-[3px] focus:ring-[#0369A1]/15 transition-all duration-200 placeholder:text-[#9CA8BA]"
                />
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-[#DDE3EE] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F5F7FB] border-b border-[#DDE3EE]">
                    <tr>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider">Student Name</th>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider">Student ID</th>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider">Program</th>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider">Contact</th>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3.5 text-xs font-extrabold text-[#4B5A6E] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF1F8]">
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          No student records found
                        </td>
                      </tr>
                    ) : (
                      paginatedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                              {student.otherNames && <p className="text-xs text-gray-500">{student.otherNames}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900">{student.studentId || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{student.program || 'General Science'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span>{student.email || 'N/A'}</span>
                              </div>
                              {student.phone && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                                  <span>{student.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full text-[10px] font-bold px-2.5 py-0.5 ${
                                student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {student.isActive ? 'Active Student' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleOpenStudentHistory(student.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-[#1e3a8a] rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View History
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Page {currentPage} of {totalPages} ({filteredStudents.length} students)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Student Record & History Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-[#1e3a8a] rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">Student Record & Visit Log</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <p className="text-gray-500 font-medium">Student ID</p>
                    <p className="font-bold text-gray-900">{selectedStudent.studentId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Program</p>
                    <p className="font-bold text-gray-900">{selectedStudent.program || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Email</p>
                    <p className="font-bold text-gray-900 truncate">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Phone</p>
                    <p className="font-bold text-gray-900">{selectedStudent.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Gender</p>
                    <p className="font-bold text-gray-900">{selectedStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Account Status</p>
                    <button
                      onClick={() => handleToggleStudentStatus(selectedStudent)}
                      className={`mt-0.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                        selectedStudent.isActive ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {selectedStudent.isActive ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                    </button>
                  </div>
                </div>

                {/* Medical Appointment Visit History */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1e3a8a]" />
                    Appointment Visit History ({selectedStudent.appointments?.length ?? 0})
                  </h4>

                  {(!selectedStudent.appointments || selectedStudent.appointments.length === 0) ? (
                    <p className="text-xs text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-lg">
                      No appointment history found for this student.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {selectedStudent.appointments.map((apt) => (
                        <div key={apt.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs shadow-xs">
                          <div>
                            <p className="font-bold text-gray-900">{apt.service?.name || 'General Consultation'}</p>
                            <p className="text-gray-500 mt-0.5">Reason: {apt.reason}</p>
                            {apt.doctor && <p className="text-blue-700 font-medium mt-0.5">Doctor: Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>}
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{new Date(apt.date).toLocaleDateString('en-GB')}</p>
                            <p className="text-gray-500">{formatTimeLabel(apt.timeSlot)}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded bg-gray-100 text-gray-700 uppercase">
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[#F5F7FB] border-t border-[#DDE3EE] flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2 bg-[#0F172A] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-xs"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}