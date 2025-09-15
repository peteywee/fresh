'use client';

import { useMemo, useState } from 'react';

type Range = { start: Date | null; end: Date | null };

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function inRange(day: Date, range: Range) {
  if (!range.start || !range.end) return false;
  const t = day.setHours(0, 0, 0, 0);
  const s = range.start.setHours(0, 0, 0, 0);
  const e = range.end.setHours(0, 0, 0, 0);
  return t >= s && t <= e;
}

export default function Calendar({
  value,
  onChange,
}: {
  value?: Range;
  onChange?: (range: Range) => void;
}) {
  const [current, setCurrent] = useState(startOfMonth(new Date()));
  const [range, setRange] = useState<Range>(value ?? { start: null, end: null });
  const [pickerDay, setPickerDay] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(current);
    const end = endOfMonth(current);
    const startWeekday = start.getDay(); // 0=Sun
    const gridStart = addDays(start, -startWeekday);
    const total = 42; // 6 weeks grid
    return Array.from({ length: total }, (_, i) => addDays(gridStart, i));
  }, [current]);

  function handleDayClick(day: Date) {
    setPickerDay(day);
  }

  function applySelection(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const next = { start: s, end: e } as Range;
    setRange(next);
    onChange?.(next);
    setPickerDay(null);
  }

  function clearSelection() {
    const empty = { start: null, end: null } as Range;
    setRange(empty);
    onChange?.(empty);
    setPickerDay(null);
  }

  const monthLabel = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0.75rem',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <button
          onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          style={navBtn}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div style={{ fontWeight: 600 }}>{monthLabel}</div>
        <button
          onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          style={navBtn}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, padding: 8 }}>
        {'SMTWTFS'.split('').map(l => (
          <div key={l} style={{ textAlign: 'center', color: '#64748b', fontSize: 12 }}>
            {l}
          </div>
        ))}
        {days.map(d => {
          const isOtherMonth = d.getMonth() !== current.getMonth();
          const selected =
            (range.start && isSameDay(d, range.start)) || (range.end && isSameDay(d, range.end));
          const between = inRange(d, range);
          return (
            <button
              key={d.toISOString()}
              onClick={() => handleDayClick(d)}
              style={{
                padding: '0.5rem 0',
                borderRadius: 6,
                border: '1px solid transparent',
                background: selected ? '#3b82f6' : between ? '#dbeafe' : 'transparent',
                color: selected ? '#fff' : isOtherMonth ? '#cbd5e1' : '#0f172a',
                cursor: 'pointer',
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {pickerDay && (
        <div style={popupBackdrop} onClick={() => setPickerDay(null)}>
          <div style={popup} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 8px 0' }}>Pick range starting {pickerDay.toDateString()}</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={label}>
                Start date
                <input
                  type="date"
                  defaultValue={toInputDate(pickerDay)}
                  style={input}
                  id="start-date"
                />
              </label>
              <label style={label}>
                End date
                <input
                  type="date"
                  defaultValue={toInputDate(pickerDay)}
                  style={input}
                  id="end-date"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={clearSelection} style={secondary}>
                Clear
              </button>
              <button
                onClick={() => {
                  const s = (document.getElementById('start-date') as HTMLInputElement)?.value;
                  const e = (document.getElementById('end-date') as HTMLInputElement)?.value;
                  if (s && e) applySelection(s, e);
                }}
                style={primary}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toInputDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const navBtn: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  borderRadius: 6,
  padding: '2px 8px',
  cursor: 'pointer',
};

const popupBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 40,
};

const popup: React.CSSProperties = {
  width: 320,
  padding: 16,
  background: 'white',
  borderRadius: 8,
  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
  border: '1px solid #e2e8f0',
};

const label: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  fontSize: 12,
  color: '#334155',
};

const input: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 14,
};

const primary: React.CSSProperties = {
  padding: '6px 10px',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};

const secondary: React.CSSProperties = {
  padding: '6px 10px',
  background: '#f1f5f9',
  color: '#334155',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};
