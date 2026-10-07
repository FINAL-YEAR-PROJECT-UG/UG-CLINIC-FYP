'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { isAdminRole } from '@/lib/utils';
import { getStaffAuthHeaders } from '@/lib/api';
import StaffNav from '@/components/shared/StaffNav';
import {
  ShieldCheck,
  Users,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Check,
  UserX,
  KeyRound,
  Mail,
} from '@/components/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  isActive: boolean;
  createdAt: string;
};

type InviteBody = {
  action: 'invite_or_link';
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

type AssignRoleBody = {
  action: 'assign_role';
  userId: string;
  role: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLES = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] as const;
type StaffRole = (typeof ROLES)[number];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  DOCTOR: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  RECEPTIONIST: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-700'}`}>
      {role}
    </span>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffPermissionsPage() {
  const user = useAuthStore((s) => s.user);
  const userRole = user?.role ?? '';
  const isAdmin = isAdminRole(userRole);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<StaffRole>('DOCTOR');
  const [inviteFirst, setInviteFirst] = useState('');
  const [inviteLast, setInviteLast] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteActionLink, setInviteActionLink] = useState<string | null>(null);

  // Role-edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<StaffRole>('DOCTOR');
  const [savingRole, setSavingRole] = useState(false);

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter) params.set('active', activeFilter);

      const headers = await getStaffAuthHeaders();
      const res = await fetch(`/api/backend/resources/staff?${params}`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to fetch staff');
      setStaff(json.data.staff ?? []);
      setTotal(json.data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, activeFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadStaff = async () => {
      await fetchStaff();
    };
    void loadStaff();
  }, [fetchStaff, isAdmin]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    setInviting(true);
    setInviteError(null);
    setInviteActionLink(null);
    try {
      const body: InviteBody = {
        action: 'invite_or_link',
        email: inviteEmail.trim(),
        role: inviteRole,
        firstName: inviteFirst.trim() || undefined,
        lastName: inviteLast.trim() || undefined,
      };
      const headers = await getStaffAuthHeaders();
      const res = await fetch('/api/staff/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      const json: { success?: boolean; message?: string; actionLink?: string } = await res.json();
      if (!res.ok || !json.success) {
        setInviteActionLink(typeof json.actionLink === 'string' ? json.actionLink : null);
        throw new Error(json.message || 'Invite failed');
      }
      toast(json.message || `Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteFirst('');
      setInviteLast('');
      void fetchStaff();
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setInviting(false);
    }
  };

  const handleAssignRole = async (memberId: string) => {
    setSavingRole(true);
    try {
      const body: AssignRoleBody = { action: 'assign_role', userId: memberId, role: editingRole };
      const headers = await getStaffAuthHeaders();
      const res = await fetch('/api/staff/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to update role');
      toast('✓ Role updated');
      setEditingId(null);
      void fetchStaff();
    } catch (e) {
      toast(`⚠ ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const headers = await getStaffAuthHeaders();
      const res = await fetch('/api/backend/resources/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ userId: member.id, is_active: !member.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed');
      toast(`✓ ${member.displayName} ${!member.isActive ? 'activated' : 'deactivated'}`);
      void fetchStaff();
    } catch (e) {
      toast(`⚠ ${e instanceof Error ? e.message : 'Failed'}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-700">Access Restricted</h2>
        <p className="mt-1 text-sm text-slate-500">Only administrators can manage staff permissions.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <StaffNav userRole={userRole} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1e3a8a]" />
            <h1 className="text-xl font-bold text-slate-900">Staff &amp; Permissions</h1>
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage staff accounts, roles, and access levels.
            <span className="ml-1 font-medium text-slate-700">{total} member{total !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <button
          id="invite-staff-btn"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Invite Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="staff-search-input"
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
          />
        </div>
        <select
          id="staff-role-filter"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          id="staff-active-filter"
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button
          id="staff-refresh-btn"
          onClick={() => void fetchStaff()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 sm:pl-6">Member</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Role</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
              <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && staff.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 text-slate-400" />
                </td>
              </tr>
            )}
            {!loading && staff.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-500">No staff members found.</p>
                </td>
              </tr>
            )}
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                {/* Member */}
                <td className="py-3 pl-4 pr-3 sm:pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8ECF1] text-xs font-bold text-[#1e3a8a]">
                      {initials(member.displayName) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{member.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-3 py-3">
                  {editingId === member.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        id={`role-select-${member.id}`}
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value as StaffRole)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/30"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        id={`save-role-${member.id}`}
                        onClick={() => void handleAssignRole(member.id)}
                        disabled={savingRole}
                        className="rounded-lg bg-[#1e3a8a] p-1 text-white hover:bg-[#1e40af] disabled:opacity-50"
                      >
                        {savingRole ? <Loader2 className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`edit-role-${member.id}`}
                      onClick={() => { setEditingId(member.id); setEditingRole(member.role as StaffRole); }}
                      className="group flex items-center gap-1.5"
                      title="Click to change role"
                    >
                      <RoleBadge role={member.role} />
                      <KeyRound className="h-3 w-3 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  )}
                </td>

                {/* Status */}
                <td className="px-3 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                {/* Joined */}
                <td className="px-3 py-3 text-xs text-slate-500">
                  {new Date(member.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>

                {/* Actions */}
                <td className="py-3 pl-3 pr-4 text-right sm:pr-6">
                  <button
                    id={`toggle-active-${member.id}`}
                    onClick={() => void handleToggleActive(member)}
                    title={member.isActive ? 'Deactivate' : 'Activate'}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {member.isActive ? <UserX className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {member.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                id="staff-prev-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                id="staff-next-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite Modal ──────────────────────────────────────────────────────── */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setInviteOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#1e3a8a]" />
              <h2 className="text-base font-bold text-slate-900">Invite Staff Member</h2>
            </div>
            <p className="mb-5 text-xs text-slate-500">
              An invitation email will be sent. The user must accept to activate their account.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-xs font-semibold text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="invite-email"
                  type="email"
                  placeholder="staff@ug.edu.gh"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="mb-1 block text-xs font-semibold text-slate-700">Role</label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as StaffRole)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="invite-first" className="mb-1 block text-xs font-semibold text-slate-700">First Name</label>
                  <input
                    id="invite-first"
                    type="text"
                    placeholder="Kwame"
                    value={inviteFirst}
                    onChange={(e) => setInviteFirst(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
                <div>
                  <label htmlFor="invite-last" className="mb-1 block text-xs font-semibold text-slate-700">Last Name</label>
                  <input
                    id="invite-last"
                    type="text"
                    placeholder="Mensah"
                    value={inviteLast}
                    onChange={(e) => setInviteLast(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
                  />
                </div>
              </div>
            </div>

            {inviteError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {inviteError}
                </div>
                {inviteActionLink && (
                  <a
                    href={inviteActionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    Open invitation link
                  </a>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                id="invite-cancel-btn"
                onClick={() => setInviteOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="invite-submit-btn"
                onClick={() => void handleInvite()}
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a8a] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-50 transition-colors"
              >
                {inviting ? <Loader2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg animate-fade-in-up">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
