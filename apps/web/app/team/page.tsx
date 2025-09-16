'use client';

import { useCallback, useMemo, useState } from 'react';

import dynamic from 'next/dynamic';

import { TableSkeleton } from '@/components/LoadingComponents';
import { DeleteConfirmation, TeamMemberForm } from '@/components/TeamMemberForms';
import { useFeatures, useTerminology } from '@/lib/useBranding';
import { useDebouncedFetch, useOptimisticMutation } from '@/lib/useFetch';
import { useSession } from '@/lib/useSession';

// Lazy load TeamChat to reduce initial bundle for team management table
const TeamChat = dynamic(() => import('@/components/TeamChat'), {
  ssr: false,
  loading: () => (
    <div
      style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}
    >
      Loading chat…
    </div>
  ),
});

type Member = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  joinedAt?: number;
  updatedAt?: number;
};

export default function TeamPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState('member');
  const [showChat, setShowChat] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Get user session for chat and branding terminology
  const session = useSession();
  const terminology = useTerminology();
  const features = useFeatures();

  // Available roles
  const availableRoles = ['viewer', 'staff', 'member', 'admin', 'owner'];

  // Build API URL with filters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (search.trim()) params.set('search', search.trim());
    return `/api/team/bulk-roles?${params}`;
  }, [roleFilter, search]);

  // Use debounced fetch for search performance
  const { data, loading, error, refetch, mutate } = useDebouncedFetch<{ members: Member[] }>(
    apiUrl,
    {},
    300, // 300ms debounce
    [roleFilter] // Re-fetch immediately on role filter change
  );

  const members = data?.members || [];

  // Optimistic mutation hook for role updates
  const { mutate: updateRoles, loading: bulkUpdating } =
    useOptimisticMutation('/api/team/bulk-roles');

  // Individual role update with optimistic updates
  const setRole = useCallback(
    async (id: string, role: string) => {
      const optimisticUpdate = {
        members: members.map(m => (m.id === id ? { ...m, role, updatedAt: Date.now() } : m)),
      };

      try {
        await updateRoles(
          optimisticUpdate,
          { userId: id, role },
          data => mutate(data),
          () => refetch() // Revert on error
        );
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    },
    [members, updateRoles, mutate, refetch]
  );

  // Bulk role update with optimistic updates
  const bulkUpdateRoles = useCallback(async () => {
    if (selectedMembers.size === 0) return;

    const userIds = Array.from(selectedMembers);
    const optimisticUpdate = {
      members: members.map(m =>
        selectedMembers.has(m.id) ? { ...m, role: bulkRole, updatedAt: Date.now() } : m
      ),
    };

    try {
      await updateRoles(
        optimisticUpdate,
        { userIds, role: bulkRole },
        data => {
          mutate(data);
          setSelectedMembers(new Set());
        },
        () => refetch() // Revert on error
      );
    } catch (error) {
      console.error('Failed to bulk update roles:', error);
    }
  }, [selectedMembers, bulkRole, members, updateRoles, mutate, refetch]);

  // Add new member
  const addMember = useCallback(
    async (memberData: Omit<Member, 'id' | 'joinedAt' | 'updatedAt'>) => {
      setFormLoading(true);
      try {
        const response = await fetch('/api/team/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData),
        });

        if (response.ok) {
          await refetch(); // Refresh the member list
          return true;
        } else {
          const error = await response.text();
          console.error('Failed to add member:', error);
          return false;
        }
      } catch (error) {
        console.error('Failed to add member:', error);
        return false;
      } finally {
        setFormLoading(false);
      }
    },
    [refetch]
  );

  // Edit existing member
  const editMember = useCallback(
    async (memberData: Omit<Member, 'id' | 'joinedAt' | 'updatedAt'>) => {
      if (!editingMember) return false;

      setFormLoading(true);
      try {
        const response = await fetch(`/api/team/members/${editingMember.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(memberData),
        });

        if (response.ok) {
          await refetch(); // Refresh the member list
          return true;
        } else {
          const error = await response.text();
          console.error('Failed to edit member:', error);
          return false;
        }
      } catch (error) {
        console.error('Failed to edit member:', error);
        return false;
      } finally {
        setFormLoading(false);
      }
    },
    [editingMember, refetch]
  );

  // Delete member
  const deleteMember = useCallback(async () => {
    if (!deletingMember) return false;

    setFormLoading(true);
    try {
      const response = await fetch(`/api/team/members/${deletingMember.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refetch(); // Refresh the member list
        return true;
      } else {
        const error = await response.text();
        console.error('Failed to delete member:', error);
        return false;
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
      return false;
    } finally {
      setFormLoading(false);
    }
  }, [deletingMember, refetch]);

  const toggleMemberSelection = useCallback((id: string) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  }, [selectedMembers.size, members]);

  const getRoleBadgeColor = useCallback((role?: string) => {
    switch (role) {
      case 'owner':
        return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
      case 'admin':
        return { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' };
      case 'member':
        return { bg: '#dcfce7', text: '#166534', border: '#22c55e' };
      case 'staff':
        return { bg: '#f3e8ff', text: '#7c3aed', border: '#a855f7' };
      case 'viewer':
        return { bg: '#f1f5f9', text: '#475569', border: '#64748b' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' };
    }
  }, []);

  if (loading) {
    return (
      <main>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Team Management</h1>
        </div>
        <TableSkeleton rows={5} columns={5} />
      </main>
    );
  }

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{terminology.team} Management</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ➕ Add {terminology.team_member}
          </button>
          {features.chat_enabled && (
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                padding: '8px 16px',
                backgroundColor: showChat ? '#3b82f6' : '#f3f4f6',
                color: showChat ? 'white' : '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {showChat ? '🗨️ Hide ' : '💬 Show '}
              {features.chat_name}
            </button>
          )}
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            {members.length} {terminology.team_member.toLowerCase()}
            {members.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Team Chat Section */}
      {showChat && session.orgId && session.userId && (
        <div style={{ marginBottom: 24 }}>
          <TeamChat
            orgId={session.orgId}
            userId={session.userId}
            userName={session.displayName || session.email || 'Unknown User'}
            userEmail={session.email || ''}
            userRole={session.role || 'viewer'}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: 12,
          marginBottom: 24,
          padding: 16,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
        }}
      >
        <input
          type="text"
          placeholder={`Search ${terminology.team_member.toLowerCase()}s...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: 'white',
          }}
        >
          <option value="all">All Roles</option>
          <option value="owner">Owners</option>
          <option value="admin">Admins</option>
          <option value="member">Members</option>
          <option value="staff">Staff</option>
          <option value="viewer">Viewers</option>
        </select>
        <button
          onClick={() => refetch()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedMembers.size > 0 && (
        <div
          style={{
            padding: 16,
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} selected
            </span>
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: 14,
                backgroundColor: 'white',
              }}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={bulkUpdateRoles}
              disabled={bulkUpdating}
              style={{
                padding: '6px 12px',
                backgroundColor: bulkUpdating ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                cursor: bulkUpdating ? 'not-allowed' : 'pointer',
              }}
            >
              {bulkUpdating ? 'Updating...' : 'Update Roles'}
            </button>
            <button
              onClick={() => setSelectedMembers(new Set())}
              style={{
                padding: '6px 12px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Members Table */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr auto auto auto',
            gap: 16,
            padding: '12px 16px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            fontSize: 12,
            fontWeight: 600,
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          <input
            type="checkbox"
            checked={selectedMembers.size === members.length && members.length > 0}
            onChange={toggleAllSelection}
          />
          <div>{terminology.team_member}</div>
          <div>Role</div>
          <div>Joined</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        <div>
          {members.map(m => {
            const colors = getRoleBadgeColor(m.role);
            return (
              <div
                key={m.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr auto auto auto',
                  gap: 16,
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  alignItems: 'center',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.has(m.id)}
                  onChange={() => toggleMemberSelection(m.id)}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {m.displayName || m.email || m.id}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{m.email}</div>
                </div>
                <div
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    display: 'inline-block',
                  }}
                >
                  {m.role || 'member'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={m.role || 'member'}
                    onChange={e => setRole(m.id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: 4,
                      fontSize: 12,
                      backgroundColor: 'white',
                    }}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={() => setEditingMember(m)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                    title="Edit member"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeletingMember(m)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 4,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#dc2626',
                    }}
                    title="Delete member"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 32,
                color: '#6b7280',
              }}
            >
              {search || roleFilter !== 'all'
                ? `No ${terminology.team_member.toLowerCase()}s match your filters.`
                : `No ${terminology.team_member.toLowerCase()}s yet.`}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <TeamMemberForm
          onSave={addMember}
          onCancel={() => setShowAddForm(false)}
          roles={availableRoles}
          isLoading={formLoading}
        />
      )}

      {/* Edit Member Form */}
      {editingMember && (
        <TeamMemberForm
          member={editingMember}
          onSave={editMember}
          onCancel={() => setEditingMember(null)}
          roles={availableRoles}
          isLoading={formLoading}
        />
      )}

      {/* Delete Confirmation */}
      {deletingMember && (
        <DeleteConfirmation
          member={deletingMember}
          onConfirm={deleteMember}
          onCancel={() => setDeletingMember(null)}
          isLoading={formLoading}
        />
      )}
    </main>
  );
}
