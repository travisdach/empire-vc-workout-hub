import React, { useMemo, useState } from 'react';
import {
  WORKOUT_PROGRAM,
  MONTH_INDEX_TO_KEY,
  WEEKDAY_TO_DAYKEY,
  type WorkoutDay,
  type MonthKey
} from './data/workouts';
import { findOverrideForDate } from './data/scheduleOverrides';
import { WorkoutDetail } from './components/WorkoutDetail';
import { CalendarView } from './components/CalendarView';
import { CoachDashboard } from './components/CoachDashboard';

const BRAND_GOLD = '#DEC55B';

type ViewMode = 'today' | 'upcoming' | 'calendar' | 'coach';

function getWorkoutForDate(d: Date): WorkoutDay | null {
  const override = findOverrideForDate(d);
  if (override) {
    if (override.type === 'rest') return null;
    if (override.type === 'template' && override.monthKey && override.dayKey) {
      return WORKOUT_PROGRAM[override.monthKey][override.dayKey] ?? null;
    }
  }

  const monthKey = MONTH_INDEX_TO_KEY[d.getMonth()];
  if (!monthKey) return null;
  const dayKey = WEEKDAY_TO_DAYKEY[d.getDay()];
  if (!dayKey) return null;
  const monthBlock = WORKOUT_PROGRAM[monthKey as MonthKey];
  return monthBlock?.[dayKey] ?? null;
}

export default function App() {
  const [view, setView] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const todayWorkout = useMemo(() => getWorkoutForDate(selectedDate), [selectedDate]);

  const upcoming = useMemo(() => {
    const list: { date: Date; workout: WorkoutDay | null }[] = [];
    const base = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      list.push({ date: d, workout: getWorkoutForDate(d) });
    }
    return list;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Empire Volleyball
            </div>
            <div className="text-xl font-semibold flex items-center gap-2">
              <span style={{ color: BRAND_GOLD }}>Empire VC Workout Hub</span>
            </div>
          </div>
          <nav className="flex gap-2 text-sm">
            <button
              onClick={() => setView('today')}
              className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                view === 'today'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-slate-700 hover:border-amber-300/70'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setView('upcoming')}
              className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                view === 'upcoming'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-slate-700 hover:border-amber-300/70'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                view === 'calendar'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-slate-700 hover:border-amber-300/70'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('coach')}
              className={`px-3 py-1 rounded-full border text-xs md:text-sm ${
                view === 'coach'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-slate-700 hover:border-amber-300/70'
              }`}
            >
              Coach
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          {view === 'today' && (
            <section>
              <h2 className="text-lg md:text-2xl font-semibold mb-3">
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h2>

              {todayWorkout ? (
                <WorkoutDetail workout={todayWorkout} />
              ) : (
                <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm">
                  <p className="font-medium mb-1">No assigned home workout today.</p>
                  <p className="text-slate-400">
                    This might be a rest day or outside the Dec–May program. Coaches can
                    update the schedule mapping as needed.
                  </p>
                </div>
              )}
            </section>
          )}

          {view === 'upcoming' && (
            <section className="space-y-4">
              <h2 className="text-lg md:text-2xl font-semibold mb-2">Upcoming 10 Days</h2>
              {upcoming.map(({ date, workout }) => (
                <button
                  key={date.toDateString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setView('today');
                  }}
                  className="w-full text-left rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 flex justify-between items-center hover:border-amber-300/70 transition"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {date.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {workout ? `${workout.title} — ${workout.focus}` : 'Rest / no workout'}
                    </div>
                  </div>
                  {workout && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border border-amber-300/70 text-amber-200">
                      Workout
                    </span>
                  )}
                </button>
              ))}
            </section>
          )}

          {view === 'calendar' && (
            <section>
              <CalendarView
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setView('today');
                }}
                getWorkoutForDate={getWorkoutForDate}
              />
            </section>
          )}

          {view === 'coach' && (
            <section>
              <CoachDashboard />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
