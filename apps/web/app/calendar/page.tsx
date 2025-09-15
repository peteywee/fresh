'use client';

import { useEffect, useState } from 'react';

type Schedule = {
  id: string;
  title?: string;
  description?: string;
  start?: number;
  end?: number;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
};

export default function CalendarPage() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/schedules');
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Failed to load');
    setItems(data.schedules || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!title.trim()) return setError('Title is required');

    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      start: start ? Date.parse(start) : undefined,
      end: end ? Date.parse(end) : undefined,
    };

    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/schedules/${editingId}` : '/api/schedules', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Clear form
      setTitle('');
      setDescription('');
      setStart('');
      setEnd('');
      setEditingId(null);

      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      return alert(data.error || 'Failed to delete');
    }

    await load();
  }

  function editSchedule(schedule: Schedule) {
    setEditingId(schedule.id);
    setTitle(schedule.title || '');
    setDescription(schedule.description || '');
    setStart(schedule.start ? new Date(schedule.start).toISOString().slice(0, 16) : '');
    setEnd(schedule.end ? new Date(schedule.end).toISOString().slice(0, 16) : '');
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setStart('');
    setEnd('');
    setError(null);
  }

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (schedule: Schedule) => {
    if (!schedule.start) return '#6b7280';
    const now = Date.now();
    if (schedule.end && now > schedule.end) return '#dc2626'; // Past
    if (now >= schedule.start && (!schedule.end || now <= schedule.end)) return '#059669'; // Current
    return '#2563eb'; // Future
  };

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
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Calendar</h1>
        <div style={{ fontSize: 14, color: '#6b7280' }}>
          {items.length} schedule{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add/Edit Form */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, margin: 0 }}>
          {editingId ? 'Edit Schedule' : 'Add New Schedule'}
        </h2>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Title *
              </label>
              <input
                placeholder="Meeting title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Description
              </label>
              <input
                placeholder="Optional description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={e => setStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={e => setEnd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={save}
              disabled={saving || !title.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: saving || !title.trim() ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving && (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #ffffff40',
                    borderTop: '2px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
              )}
              {editingId ? 'Update Schedule' : 'Add Schedule'} (Admin only)
            </button>

            {editingId && (
              <button
                onClick={cancelEdit}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Schedules List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
          Loading schedules...
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${getStatusColor(item)}`,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                      {item.title || '(untitled)'}
                    </h3>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(item),
                      }}
                    />
                  </div>

                  {item.description && (
                    <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 8px 0' }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    <div>
                      📅 {formatDateTime(item.start)} → {formatDateTime(item.end)}
                    </div>
                    {item.createdAt && (
                      <div>Created {new Date(item.createdAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                  <button
                    onClick={() => editSchedule(item)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSchedule(item.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#dc2626',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: '#6b7280',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No schedules yet</div>
              <div style={{ fontSize: 14 }}>Add your first schedule above to get started.</div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
