import { describe, expect, it } from 'vitest';

import { Schedule, filterCalendarVisible, splitByStatus } from '../packages/types/src/index';

function make(id: string, confirmed?: boolean, declined?: boolean): Schedule {
  return {
    id,
    title: id,
    description: '',
    start: Date.now(),
    end: Date.now() + 3600000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    confirmed: confirmed ?? false,
    declined: declined ?? false,
  } as any;
}

describe('schedule status utilities', () => {
  it('filterCalendarVisible returns only confirmed & not declined', () => {
    const input = [
      make('a', true, false),
      make('b', false, false),
      make('c', true, true),
      make('d', false, true),
    ];
    const visible = filterCalendarVisible(input as any);
    expect(visible.map(s => s.id)).toEqual(['a']);
  });

  it('splitByStatus partitions schedules', () => {
    const input = [make('c1', true, false), make('p1', false, false), make('d1', false, true)];
    const parts = splitByStatus(input as any);
    expect(parts.confirmed.length).toBe(1);
    expect(parts.pending.length).toBe(1);
    expect(parts.declined.length).toBe(1);
  });

  it('pending includes neither confirmed nor declined', () => {
    const input = [make('p1', false, false)];
    const parts = splitByStatus(input as any);
    expect(parts.pending[0].id).toBe('p1');
  });
});
