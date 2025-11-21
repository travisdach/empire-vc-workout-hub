import type { MonthKey, DayKey } from './workouts';

export type OverrideType = 'rest' | 'template';

export interface ScheduleOverride {
  date: string; // 'YYYY-MM-DD'
  type: OverrideType;
  monthKey?: MonthKey;
  dayKey?: DayKey;
}

// Start empty; coaches can generate overrides in the dashboard and paste them here.
export const SCHEDULE_OVERRIDES: ScheduleOverride[] = [];

// Find override for a given date
export function findOverrideForDate(d: Date): ScheduleOverride | null {
  const iso = d.toISOString().slice(0, 10);
  return SCHEDULE_OVERRIDES.find((o) => o.date === iso) ?? null;
}
