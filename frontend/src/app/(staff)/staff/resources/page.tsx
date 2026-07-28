'use client';

import Link from 'next/link';
import UGLogo from '@/components/shared/UGLogo';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { getAllStaffResources, uploadResource, deleteResource, type StaffResource } from '@/lib/staffApi';
import { Search, FileText, Download, Trash2, Plus, ChevronLeft, ChevronRight, X, Upload } from 'lucide-react';

const CATEGORIES = ['all', 'health-guides', 'forms', 'policies', 'educational'];
const FILE_TYPES = ['all', 'pdf', 'doc', 'docx', 'jpg', 'png'];

export default function StaffResourcesPage() {
  const { user, isAuthenticated } = useAuth();
  const [resources, setResources] = useState<StaffResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('health-guides');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');

  const resourcesPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    fetchResources();
  }, [isAuthenticated]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getAllStaffResources();
      setResources(data.resources);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load resources'));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newFileUrl.trim()) {
      setError('Title and File URL are required');
      return;
    }
    try {
      setUploading(true);
      await uploadResource({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
        fileType: newFileType,
        fileUrl: newFileUrl.trim(),
        fileSize: 1024 * 500, // 500 KB default
      });
      setShowUploadModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewFileUrl('');
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to upload resource'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    try {
      await deleteResource(resourceId);
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete resource'));
    }
  };

  const filteredResources = (resources || []).filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesFileType = selectedFileType === 'all' || resource.fileType.toLowerCase() === selectedFileType.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesFileType;
  });

  const totalPages = Math.ceil(filteredResources.length / resourcesPerPage);
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * resourcesPerPage,
    currentPage * resourcesPerPage
  );

  if (!isAuthenticated) {
    return null;
  }

  if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <UGLogo size="md" href="/staff/overview" />
              <Link
                href="/staff/overview"
                className="text-xs font-semibold text-[#1e3a8a] hover:underline"
              >
                ← Back to Overview
              </Link>
            </div>
            {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST' || user?.role === 'DOCTOR') && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Upload Resource
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size={48} />
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search resources by title, description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedFileType}
                    onChange={(e) => setSelectedFileType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                  >
                    {FILE_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedResources.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                  No resources found
                </div>
              ) : (
                paginatedResources.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-[#1e3a8a]">
                          <FileText className="w-6 h-6" />
                        </div>
                        {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST' || user?.role === 'DOCTOR') && (
                          <button
                            onClick={() => handleDelete(resource.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            title="Delete resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{resource.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description || 'No description provided'}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mb-3">
                        <span className="font-bold uppercase px-2 py-0.5 bg-gray-100 rounded text-gray-700">{resource.fileType}</span>
                        <span className="font-medium text-gray-600">{resource.category}</span>
                      </div>
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 text-sm font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download / View Document
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Page {currentPage} of {totalPages} ({filteredResources.length} total)
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
          </>
        )}

        {/* Upload Resource Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#1e3a8a]" />
                  Upload New Resource
                </h3>
                <button onClick={() => setShowUploadModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <form onSubmit={handleUploadResource} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Student Health Guidelines 2026"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief detail of the document..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    >
                      <option value="health-guides">Health Guides</option>
                      <option value="forms">Forms</option>
                      <option value="policies">Policies</option>
                      <option value="educational">Educational</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">File Type</label>
                    <select
                      value={newFileType}
                      onChange={(e) => setNewFileType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">DOC</option>
                      <option value="docx">DOCX</option>
                      <option value="png">PNG</option>
                      <option value="jpg">JPG</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">File URL / Download Link *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/files/document.pdf"
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#1e3a8a]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 text-xs bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 font-semibold disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Save & Publish Resource'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
