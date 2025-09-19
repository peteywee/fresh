'use server';

import { redirect } from 'next/navigation';

import { hasRoleAtLeast } from '@/lib/roles';
import { getServerSession } from '@/lib/session';

async function requireRole(minRole: 'admin' | 'member' = 'admin') {
  const session = await getServerSession();
  if (!session?.sub) {
    throw new Error('Not authenticated');
  }
  if (!hasRoleAtLeast(session, minRole)) {
    throw new Error('Insufficient permissions');
  }
  return session.sub;
}

// Schedule Actions
export async function createScheduleAction(formData: FormData) {
  const userId = await requireRole('admin');

  const title = formData.get('title')?.toString();
  const description = formData.get('description')?.toString();
  const start = formData.get('start')?.toString();
  const end = formData.get('end')?.toString();

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  const payload = {
    title: title.trim(),
    description: description?.trim() || undefined,
    start: start ? Date.parse(start) : undefined,
    end: end ? Date.parse(end) : undefined,
  };

  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Failed to create schedule');
  }

  redirect('/calendar');
}

export async function updateScheduleAction(id: string, formData: FormData) {
  const userId = await requireRole('admin');

  const title = formData.get('title')?.toString();
  const description = formData.get('description')?.toString();
  const start = formData.get('start')?.toString();
  const end = formData.get('end')?.toString();

  if (!title?.trim()) {
    throw new Error('Title is required');
  }

  const payload = {
    title: title.trim(),
    description: description?.trim() || undefined,
    start: start ? Date.parse(start) : undefined,
    end: end ? Date.parse(end) : undefined,
  };

  const res = await fetch(`/api/schedules/${id}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Failed to update schedule');
  }

  redirect('/calendar');
}

export async function deleteScheduleAction(id: string) {
  // Validate that `id` is a UUID (edit the regex if your ID format differs)
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    throw new Error('Invalid schedule ID');
  }
  const userId = await requireRole('admin');

  const res = await fetch(`/api/schedules/${id}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': userId,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Failed to delete schedule');
  }

  redirect('/calendar');
}

// Team Management Actions
export async function updateMemberRoleAction(memberId: string, newRole: string) {
  const userId = await requireRole('admin');

  const res = await fetch('/api/team/roles', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ memberId, role: newRole }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Failed to update role');
  }

  redirect('/team');
}

export async function bulkUpdateRolesAction(formData: FormData) {
  const userId = await requireRole('admin');

  const updates: { memberId: string; role: string }[] = [];

  // Get all form field names and values
  const roleEntries: { key: string; value: string }[] = [];
  formData.forEach((value, key) => {
    if (key.startsWith('role_')) {
      roleEntries.push({ key, value: value.toString() });
    }
  });

  for (const { key, value } of roleEntries) {
    const memberId = key.replace('role_', '');
    updates.push({ memberId, role: value });
  }

  if (updates.length === 0) {
    throw new Error('No updates specified');
  }

  const res = await fetch('/api/team/bulk-roles', {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-user-id': userId,
    },
    body: JSON.stringify({ updates }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || 'Failed to update roles');
  }

  redirect('/team');
}
