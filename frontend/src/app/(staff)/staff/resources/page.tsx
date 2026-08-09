'use client';

import Link from 'next/link';
import StaffNav from '@/components/shared/StaffNav';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  getAllStaffResources,
  uploadResource,
  updateResourceDetails,
  reviewResourceSubmission,
  deleteResource,
  type StaffResource,
  type SecurityScanResponse,
} from '@/lib/staffApi';
import {
  Search,
  FileText,
  Film,
  Download,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Pencil,
  Clock,
  RefreshCw,
  BookOpen,
  Users,
} from '@/components/icons';

const STATUS_TABS = [
  { id: 'all', label: 'All Resources', icon: BookOpen },
  { id: 'APPROVED', label: 'Published', icon: CheckCircle2 },
  { id: 'PENDING_REVIEW', label: 'Pending Review', icon: Clock },
  { id: 'FLAGGED', label: '🚨 Security Threats', icon: ShieldAlert },
  { id: 'REJECTED', label: 'Rejected', icon: XCircle },
];

const CATEGORIES = [
  'all',
  'Physical Health',
  'Mental Health',
  'Nutrition',
  'Sexual Health',
  'First Aid',
  'Sleep',
  'Educational',
  'Policies',
  'Forms',
  'General Health',
];

const FILE_TYPES = ['PDF', 'DOC', 'DOCX', 'VIDEO', 'ARTICLE', 'OTHER'];

function SecurityBadge({ status, details }: { status?: string; details?: string | null }) {
  if (!status) return null;
  const [showDetails, setShowDetails] = useState(false);

  const cfg =
    status === 'CLEAN'
      ? { label: '🛡️ Secure', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' }
      : status === 'SUSPICIOUS'
      ? { label: '⚠️ Suspicious', cls: 'bg-amber-50 border-amber-200 text-amber-700' }
      : { label: '🚨 Threat Detected', cls: 'bg-red-50 border-red-200 text-red-700' };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        title={details ?? ''}
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${cfg.cls}`}
      >
        {cfg.label}
      </button>
      {showDetails && details && (
        <div className="absolute z-30 bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-xs text-gray-700 max-w-xs">
          <p className="font-semibold mb-1 text-gray-900">Security Scan Report</p>
          <p>{details}</p>
          <button
            type="button"
            onClick={() => setShowDetails(false)}
            className="mt-2 text-[10px] text-blue-600 underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const cfg: Record<string, string> = {
    APPROVED: 'bg-emerald-100 text-emerald-700',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
    FLAGGED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    APPROVED: 'Published',
    PENDING_REVIEW: 'Pending Review',
    FLAGGED: 'Security Flagged',
    REJECTED: 'Rejected',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg[status ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[status ?? ''] ?? status ?? 'Unknown'}
    </span>
  );
}

const RESOURCE_PER_PAGE = 9;

export default function StaffResourcesPage() {
  const { user, isAuthenticated } = useAuth();
  const userRole = user?.role ?? '';

  const [resources, setResources] = useState<StaffResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<SecurityScanResponse | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Physical Health',
    fileType: 'PDF',
    fileUrl: '',
    isPublic: true,
    tags: '',
  });

  // Edit modal
  const [editResource, setEditResource] = useState<StaffResource | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    fileUrl: '',
    fileType: '',
    isPublic: true,
    status: '',
  });

  // Security detail modal
  const [viewScanResource, setViewScanResource] = useState<StaffResource | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllStaffResources({
        status: activeTab !== 'all' ? activeTab : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });
      setResources(data.resources);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load resources'));
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchResources();
  }, [isAuthenticated, fetchResources]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !uploadForm.fileUrl.trim()) {
      setError('Title and File URL are required');
      return;
    }
    try {
      setUploading(true);
      setScanResult(null);
      const result = await uploadResource({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
        category: uploadForm.category,
        fileType: uploadForm.fileType.toLowerCase(),
        fileUrl: uploadForm.fileUrl.trim(),
        isPublic: uploadForm.isPublic,
        tags: uploadForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        fileSize: 1024 * 500,
      });
      setScanResult(result.scanResult ?? null);
      if (result.scanResult?.status === 'MALICIOUS') {
        setError('⚠️ Upload blocked: Security scanner detected malicious content. The resource was saved as FLAGGED for review.');
      } else {
        setSuccessMsg(
          result.scanResult?.status === 'SUSPICIOUS'
            ? '✅ Resource uploaded but marked SUSPICIOUS by security scanner. Please review.'
            : '✅ Resource uploaded and passed security scan successfully!',
        );
        setShowUploadModal(false);
        setUploadForm({ title: '', description: '', category: 'Physical Health', fileType: 'PDF', fileUrl: '', isPublic: true, tags: '' });
      }
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to upload resource'));
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editResource) return;
    try {
      await updateResourceDetails(editResource.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        category: editForm.category,
        fileUrl: editForm.fileUrl,
        fileType: editForm.fileType.toLowerCase(),
        isPublic: editForm.isPublic,
        status: editForm.status,
      });
      setSuccessMsg('✅ Resource updated successfully!');
      setEditResource(null);
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update resource'));
    }
  };

  const handleReview = async (resourceId: string, action: 'APPROVE' | 'REJECT' | 'FLAG') => {
    try {
      await reviewResourceSubmission(resourceId, action);
      const labels = { APPROVE: 'Approved & Published', REJECT: 'Rejected', FLAG: 'Flagged for Security' };
      setSuccessMsg(`✅ Resource action complete: ${labels[action]}`);
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to review resource'));
    }
  };

  const handleDelete = async (resourceId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteResource(resourceId);
      setSuccessMsg('✅ Resource deleted successfully.');
      await fetchResources();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete resource'));
    }
  };

  const openEditModal = (resource: StaffResource) => {
    setEditResource(resource);
    setEditForm({
      title: resource.title,
      description: resource.description ?? '',
      category: resource.category,
      fileUrl: resource.fileUrl,
      fileType: resource.fileType?.toUpperCase() ?? 'PDF',
      isPublic: resource.isPublic ?? true,
      status: resource.status ?? 'APPROVED',
    });
  };

  const totalPages = Math.ceil(resources.length / RESOURCE_PER_PAGE);
  const paginated = resources.slice((currentPage - 1) * RESOURCE_PER_PAGE, currentPage * RESOURCE_PER_PAGE);

  if (!isAuthenticated) return null;
  if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) return null;

  const canManage = userRole === 'ADMIN' || userRole === 'RECEPTIONIST';

  const pendingCount = resources.filter((r) => r.status === 'PENDING_REVIEW').length;
  const flaggedCount = resources.filter((r) => r.status === 'FLAGGED').length;

  return (
    <div className="min-h-screen bg-[#F1F4F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffNav userRole={userRole} />

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#0369A1] text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Staff Content Portal</p>
              <h1 className="text-2xl font-extrabold mt-1">Health Resources Manager</h1>
              <p className="text-blue-200 text-sm mt-1 max-w-xl">
                Upload, manage, and review all health documents and videos. Submissions from students automatically appear in Pending Review with automated security scanning.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0F172A] rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm shrink-0"
              >
                <Upload className="w-4 h-4" />
                Upload New Resource
              </button>
            )}
          </div>

          {/* Alert badges */}
          {(pendingCount > 0 || flaggedCount > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('PENDING_REVIEW'); setCurrentPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 border border-amber-400/30 text-amber-200 rounded-xl text-xs font-bold"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {pendingCount} Pending Review
                </button>
              )}
              {flaggedCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('FLAGGED'); setCurrentPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-400/20 border border-red-400/30 text-red-200 rounded-xl text-xs font-bold"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {flaggedCount} Security Threats
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700 text-sm flex items-center justify-between">
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {STATUS_TABS.map((tab) => {
            const count = tab.id === 'all'
              ? resources.length
              : resources.filter((r) => r.status === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => fetchResources()}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, description, author..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1]"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0369A1]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size={48} />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No resources found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {paginated.map((resource) => (
              <div
                key={resource.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  resource.status === 'FLAGGED' ? 'border-red-300 bg-red-50/30' :
                  resource.status === 'PENDING_REVIEW' ? 'border-amber-300 bg-amber-50/20' :
                  resource.status === 'REJECTED' ? 'border-gray-200 opacity-70' : 'border-gray-200'
                }`}
              >
                <div>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${
                      resource.fileType === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-[#0369A1]'
                    }`}>
                      {resource.fileType === 'video' ? <Film className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={resource.status} />
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">{resource.title}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{resource.description ?? 'No description'}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 rounded text-gray-600">{resource.fileType?.toUpperCase()}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{resource.category}</span>
                  </div>

                  {/* Author for submissions */}
                  {resource.authorName && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Users className="w-3 h-3" />
                      <span>Submitted by: <strong>{resource.authorName}</strong></span>
                    </div>
                  )}
                  {resource.uploader && !resource.authorName && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                      <Users className="w-3 h-3" />
                      <span>Uploaded by: <strong>Dr. {resource.uploader.firstName} {resource.uploader.lastName}</strong></span>
                    </div>
                  )}

                  {/* Security Scan Badge */}
                  <div className="mb-3">
                    <SecurityBadge status={resource.securityScanStatus} details={resource.securityScanDetails} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  {/* Review actions for PENDING & FLAGGED */}
                  {canManage && (resource.status === 'PENDING_REVIEW' || resource.status === 'FLAGGED') && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleReview(resource.id, 'APPROVE')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve & Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(resource.id, 'REJECT')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Quick actions */}
                  <div className="flex gap-1.5">
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-[#0369A1] hover:bg-blue-800 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </a>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditModal(resource)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(resource.id, resource.title)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Flag security threats */}
                  {canManage && resource.status !== 'FLAGGED' && resource.securityScanStatus !== 'CLEAN' && (
                    <button
                      type="button"
                      onClick={() => handleReview(resource.id, 'FLAG')}
                      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Flag as Security Threat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#0369A1]" />
                <h2 className="text-lg font-bold text-gray-900">Upload Resource</h2>
              </div>
              <button type="button" onClick={() => { setShowUploadModal(false); setScanResult(null); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {scanResult && (
              <div className={`mx-5 mt-4 p-3 rounded-xl border text-xs font-medium ${
                scanResult.status === 'CLEAN' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                scanResult.status === 'SUSPICIOUS' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="font-bold mb-1">
                  {scanResult.status === 'CLEAN' ? '🛡️ Security Scan Passed' :
                   scanResult.status === 'SUSPICIOUS' ? '⚠️ Suspicious Content Detected' :
                   '🚨 Malicious Content Blocked'}
                </p>
                <p>{scanResult.scanDetails}</p>
              </div>
            )}

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                  placeholder="e.g. Mental Health Guide 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none resize-none"
                  placeholder="Brief description of the resource..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((cat) => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">File Type</label>
                  <select
                    value={uploadForm.fileType}
                    onChange={(e) => setUploadForm((f) => ({ ...f, fileType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                  >
                    {FILE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">File / Document URL *</label>
                <input
                  required
                  type="url"
                  value={uploadForm.fileUrl}
                  onChange={(e) => setUploadForm((f) => ({ ...f, fileUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                  placeholder="https://drive.google.com/... or https://..."
                />
                <p className="text-[10px] text-gray-400 mt-1">Paste a Google Drive, OneDrive, or direct document URL.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                  placeholder="health, mental, student"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={uploadForm.isPublic}
                  onChange={(e) => setUploadForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-xs font-medium text-gray-700">
                  Make publicly visible on health resources page
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-700">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Automated Security Scan:</strong> This resource will be scanned for viruses, malicious scripts, XSS, RCE, and harmful payloads before being saved.
                </span>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-[#0F172A] hover:bg-[#1e3a8a] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Running Security Scan & Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload & Scan Resource</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Edit Resource</h2>
              </div>
              <button type="button" onClick={() => setEditResource(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((cat) => <option key={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm outline-none"
                  >
                    <option value="APPROVED">Published</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="FLAGGED">Flagged</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">File URL</label>
                <input
                  type="url"
                  value={editForm.fileUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, fileUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0369A1] outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="editIsPublic" className="text-xs font-medium text-gray-700">
                  Publicly visible
                </label>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Any changes to file URL or text fields will trigger an automatic re-scan.</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditResource(null)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0F172A] hover:bg-[#1e3a8a] text-white rounded-xl font-bold text-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
