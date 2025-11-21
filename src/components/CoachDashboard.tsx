import React, { useEffect, useState } from 'react';
import type { MonthKey, DayKey } from '../data/workouts';
import { ScheduleOverride, OverrideType } from '../data/scheduleOverrides';

const LOCAL_STORAGE_KEY = 'empire_schedule_overrides';
const COACH_PIN = '7391'; // change this if you like

const monthOptions: MonthKey[] = ['december', 'january', 'february', 'march', 'april', 'may'];
const dayOptions: DayKey[] = ['day1', 'day2', 'day3', 'day4'];

export const CoachDashboard: React.FC = () => {
  const [pinOk, setPinOk] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [overrideType, setOverrideType] = useState<OverrideType>('template');
  const [overrideMonth, setOverrideMonth] = useState<MonthKey>('december');
  const [overrideDay, setOverrideDay] = useState<DayKey>('day1');
  const [exportJson, setExportJson] = useState('');

  // Load overrides from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ScheduleOverride[];
        setOverrides(parsed);
      } catch {
        // do nothing
      }
    }
  }, []);

  // Add or update override
  function handleAddOverride() {
    if (!selectedDate) return;

    const updated: ScheduleOverride[] = [
      ...overrides.filter((o) => o.date !== selectedDate),
      {
        date: selectedDate,
        type: overrideType,
        monthKey: overrideType === 'template' ? overrideMonth : undefined,
        dayKey: overrideType === 'template' ? overrideDay : undefined
      }
    ];

    setOverrides(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  // Remove override
  function handleRemoveOverride(date: string) {
    const updated = overrides.filter((o) => o.date !== date);
    setOverrides(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  // Generate exportable TS file content
  function handleGenerateExport() {
    const sorted = [...overrides].sort((a, b) => a.date.localeCompare(b.date));

    const json =
      `import type { MonthKey, DayKey } from './workouts';\n\n` +
      `export type OverrideType = 'rest' | 'template';\n\n` +
      `export interface ScheduleOverride {\n` +
      `  date: string; // 'YYYY-MM-DD'\n` +
      `  type: OverrideType;\n` +
      `  monthKey?: MonthKey;\n` +
      `  dayKey?: DayKey;\n` +
      `}\n\n` +
      `export const SCHEDULE_OVERRIDES: ScheduleOverride[] = ` +
      JSON.stringify(sorted, null, 2) +
      `;\n\n` +
      `export function findOverrideForDate(d: Date): ScheduleOverride | null {\n` +
      `  const iso = d.toISOString().slice(0, 10);\n` +
      `  return SCHEDULE_OVERRIDES.find((o) => o.date === iso) ?? null;\n` +
      `}`;

    setExportJson(json);
  }

  // PIN screen
  if (!pinOk) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Coach Access</h2>
        <p className="text-xs text-slate-400 mb-3">
          Enter the coach PIN to adjust schedule overrides. This just keeps athletes out.
        </p>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full mb-3 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
          placeholder="Coach PIN"
        />
        <button
          onClick={() => {
            if (pinInput === COACH_PIN) setPinOk(true);
            else alert('Incorrect PIN');
          }}
          className="px-3 py-1 rounded-full border border-amber-300 text-xs hover:bg-amber-300/10"
        >
          Enter
        </button>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="space-y-4">
      {/* Intro Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
        <h2 className="text-lg font-semibold mb-2">Coach Dashboard</h2>
        <p className="text-xs text-slate-400">
          Default logic: Monday–Thursday map to Day 1–4 of the current month’s phase.
          Use overrides to assign a specific workout or force a rest day.
          To make global changes, export them and paste into
          <code className="ml-1 text-[11px] bg-slate-950 px-1 rounded">scheduleOverrides.ts</code>
          then redeploy.
        </p>
      </div>

      {/* Add/Edit Override Section */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5 space-y-3">
        <div className="text-sm font-semibold mb-1">Add / Update Date Override</div>

        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          {/* Date */}
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-slate-400">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-sm"
            />
          </div>

          {/* Type */}
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-slate-400">Override Type</label>
            <select
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value as OverrideType)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-sm"
            >
              <option value="template">Use Specific Workout</option>
              <option value="rest">Force Rest</option>
            </select>
          </div>

          {/* Month / Day (if template) */}
          {overrideType === 'template' && (
            <>
              <div className="flex flex-col text-xs">
                <label className="mb-1 text-slate-400">Month</label>
                <select
                  value={overrideMonth}
                  onChange={(e) => setOverrideMonth(e.target.value as MonthKey)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-sm"
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m[0].toUpperCase() + m.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col text-xs">
                <label className="mb-1 text-slate-400">Day</label>
                <select
                  value={overrideDay}
                  onChange={(e) => setOverrideDay(e.target.value as DayKey)}
                  className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-1 text-sm"
                >
                  {dayOptions.map((d) => (
                    <option key={d} value={d}>
                      {d.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleAddOverride}
            className="mt-2 md:mt-6 px-3 py-1 rounded-full border border-amber-300 text-xs hover:bg-amber-300/10"
          >
            Save Override
          </button>
        </div>
      </div>

      {/* Current Overrides List */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
        <div className="text-sm font-semibold mb-2">Current Overrides (local)</div>

        {overrides.length === 0 ? (
          <p className="text-xs text-slate-400">No overrides saved.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-1">Date</th>
                <th className="text-left py-1">Type</th>
                <th className="text-left py-1">Workout</th>
                <th className="text-right py-1">Actions</th>
              </tr>
            </thead>

            <tbody>
              {overrides
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((o) => (
                  <tr key={o.date} className="border-b border-slate-800/60">
                    <td className="py-1 pr-2">{o.date}</td>
                    <td className="py-1 pr-2">{o.type === 'rest' ? 'Rest' : 'Template'}</td>
                    <td className="py-1 pr-2">
                      {o.type === 'rest'
                        ? '-'
                        : o.monthKey && o.dayKey
                        ? `${o.monthKey} • ${o.dayKey.toUpperCase()}`
                        : ''}
                    </td>

                    <td className="py-1 text-right">
                      <button
                        onClick={() => handleRemoveOverride(o.date)}
                        className="px-2 py-0.5 rounded-full border border-red-500/80 text-[10px] text-red-300 hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Export Section */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Export for Code</div>
            <p className="text-xs text-slate-400">
              Click Generate to get a snippet to paste into{' '}
              <code className="bg-slate-950 px-1 rounded">scheduleOverrides.ts</code>.
              Redeploy to make overrides global for all athletes.
            </p>
          </div>

          <button
            onClick={handleGenerateExport}
            className="px-3 py-1 rounded-full border border-amber-300 text-xs hover:bg-amber-300/10"
          >
            Generate
          </button>
        </div>

        {exportJson && (
          <textarea
            className="w-full h-40 mt-2 text-[11px] bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono"
            value={exportJson}
            readOnly
          />
        )}
      </div>
    </div>
  );
};
