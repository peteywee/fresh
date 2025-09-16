'use client';

import { useCallback, useMemo, useState } from 'react';
import { useFetch, useOptimisticMutation } from '@/lib/useFetch';
import { LoadingSpinner, CardSkeleton } from '@/components/LoadingComponents';

type Schedule = {
  id: string;
  title?: string;
  description?: string;
  start?: number;
  end?: number;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
  confirmed?: boolean;
  declined?: boolean;
  declineReason?: string;
};

export default function CalendarPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use optimized fetch hook
  const { data, loading, error: fetchError, refetch, mutate } = useFetch<{ schedules: Schedule[] }>(
    '/api/schedules'
  );

  const schedules = data?.schedules || [];

  // Only confirmed & not declined for grid
  const confirmedSchedules = useMemo(() => schedules.filter(s => s.confirmed && !s.declined), [schedules]);

  // Month view state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
  });

  const monthKey = currentMonth.toISOString().slice(0,7);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayWeekIndex = new Date(year, month, 1).getDay(); // 0 Sun ... 6 Sat
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i=0;i<firstDayWeekIndex;i++) cells.push({ date: null });
    for (let d=1; d<= totalDays; d++) {
      cells.push({ date: new Date(year, month, d) });
    }
    return cells;
  }, [monthKey]);

  const schedulesByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    confirmedSchedules.forEach(s => {
      if (!s.start) return;
      const day = new Date(s.start);
      const key = day.toISOString().slice(0,10);
      map[key] = map[key] || [];
      map[key].push(s);
    });
    return map;
  }, [confirmedSchedules]);

  // Optimistic mutation hooks
  const { mutate: createSchedule, loading: creating } = useOptimisticMutation('/api/schedules');
  const { mutate: updateSchedule, loading: updating } = useOptimisticMutation('/api/schedules');
  const { mutate: deleteSchedule, loading: deleting } = useOptimisticMutation('/api/schedules');

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setStart('');
    setEnd('');
    setError(null);
  }, []);

  const startEdit = useCallback((item: Schedule) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setStart(item.start ? new Date(item.start).toISOString().slice(0, 16) : '');
    setEnd(item.end ? new Date(item.end).toISOString().slice(0, 16) : '');
    setError(null);
  }, []);

  const save = useCallback(async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      start: start ? Date.parse(start) : undefined,
      end: end ? Date.parse(end) : undefined,
    };

    const newItem = {
      id: editingId || `temp-${Date.now()}`,
      ...payload,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (editingId) {
        // Update existing
        const optimisticUpdate = {
          schedules: schedules.map(s => s.id === editingId ? { ...s, ...payload, updatedAt: Date.now() } : s)
        };
        
        await updateSchedule(
          optimisticUpdate,
          { ...payload, id: editingId },
          (data) => {
            mutate(data);
            resetForm();
          },
          () => refetch()
        );
      } else {
        // Create new
        const optimisticUpdate = {
          schedules: [newItem, ...schedules]
        };
        
        await createSchedule(
          optimisticUpdate,
          payload,
          (data) => {
            mutate(data);
            resetForm();
          },
          () => refetch()
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  }, [title, description, start, end, editingId, schedules, createSchedule, updateSchedule, mutate, resetForm, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    const optimisticUpdate = {
      schedules: schedules.filter(s => s.id !== id)
    };

    try {
      await deleteSchedule(
        optimisticUpdate,
        { id },
        (data) => mutate(data),
        () => refetch()
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  }, [schedules, deleteSchedule, mutate, refetch]);

  const displayError = error || fetchError;

  if (loading) {
    return (
      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Calendar</h1>
        </div>
        <CardSkeleton count={4} />
      </main>
    );
  }

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Calendar</h1>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Showing confirmed schedules only
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
            style={{
              background: '#f3f4f6', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
            }}
          >Prev</button>
          <div style={{ fontSize: 14, fontWeight: 600, minWidth: 140, textAlign: 'center', alignSelf: 'center' }}>
            {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
            style={{
              background: '#f3f4f6', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
            }}
          >Next</button>
          <button
            onClick={() => setCurrentMonth(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); })}
            style={{
              background: '#2563eb', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer'
            }}
          >Today</button>
        </div>
      </div>

      {/* Month Grid */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} style={{ fontSize: 12, fontWeight: 600, padding: '8px 12px', textAlign: 'center', color: '#374151' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: 360 }}>
          {daysInMonth.map((cell, idx) => {
            if (!cell.date) return <div key={idx} style={{ border: '1px solid #f3f4f6', background: '#f9fafb' }} />;
            const key = cell.date.toISOString().slice(0,10);
            const items = schedulesByDay[key] || [];
            return (
              <div key={key} style={{ border: '1px solid #f3f4f6', padding: 4, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: '#374151' }}>{cell.date.getDate()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  {items.slice(0,3).map(item => (
                    <div key={item.id} title={item.title} style={{
                      background: '#2563eb', color: 'white', borderRadius: 4, padding: '2px 4px', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>{item.title || 'Untitled'}</div>
                  ))}
                  {items.length > 3 && (
                    <div style={{ fontSize: 10, color: '#2563eb' }}>+{items.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Form */}
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>
          {editingId ? 'Edit Schedule' : 'Create New Schedule'}
        </h2>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Schedule title"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                Start Date/Time
              </label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                End Date/Time
              </label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {displayError && (
            <div
              style={{
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: 12,
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              {displayError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={save}
              disabled={creating || updating}
              style={{
                backgroundColor: creating || updating ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: creating || updating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {(creating || updating) && <LoadingSpinner size="sm" />}
              {editingId ? 'Update' : 'Create'} Schedule
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Existing List (Admin / Raw View) */}
      <div style={{ display: 'grid', gap: 16 }}>
        {schedules.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0' }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  {!item.confirmed && !item.declined && (
                    <span style={{ fontSize: 10, background: '#fcd34d', color: '#92400e', padding: '2px 6px', borderRadius: 12 }}>Pending</span>
                  )}
                  {item.confirmed && !item.declined && (
                    <span style={{ fontSize: 10, background: '#bbf7d0', color: '#166534', padding: '2px 6px', borderRadius: 12 }}>Confirmed</span>
                  )}
                  {item.declined && (
                    <span style={{ fontSize: 10, background: '#fecaca', color: '#991b1b', padding: '2px 6px', borderRadius: 12 }}>Declined</span>
                  )}
                </div>
                {item.description && (
                  <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px 0' }}>
                    {item.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af' }}>
                  {item.start && (
                    <span>
                      <strong>Start:</strong> {new Date(item.start).toLocaleString()}
                    </span>
                  )}
                  {item.end && (
                    <span>
                      <strong>End:</strong> {new Date(item.end).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <button
                  onClick={() => startEdit(item)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting}
                  style={{
                    backgroundColor: deleting ? '#fca5a5' : '#ef4444',
                    border: 'none',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {deleting && <LoadingSpinner size="sm" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {schedules.length === 0 && (
          <div
            style={{
              backgroundColor: 'white',
              border: '2px dashed #d1d5db',
              borderRadius: 8,
              padding: 40,
              textAlign: 'center',
              color: '#6b7280',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 8px 0' }}>No schedules yet</h3>
            <p style={{ fontSize: 14, margin: 0 }}>Create your first schedule using the form above.</p>
          </div>
        )}
      </div>
    </main>
  );
}