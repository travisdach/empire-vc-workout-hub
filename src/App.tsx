// FULL UPDATED App.tsx WITH UNIVERSAL SPLASH SCREEN
// =================================================
// Copy/paste into src/App.tsx

import React, { useMemo, useState, useEffect } from 'react';
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
import BRAND_GOLD_IMG from '/icons/empire-crown.png';
import GuidedWorkoutTimer from './components/GuidedWorkoutTimer';

// ===============================
// UNIVERSAL SPLASH SCREEN (WORKS ON iOS CHROME + SAFARI)
// ===============================
function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(() => onDone(), 1200);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center">
      <img
        src="/icons/empire-crown.png"
        alt="Empire VC"
        className="w-28 h-28 animate-fade-in"
      />
      <div className="mt-3 text-amber-300 tracking-[0.25em] text-xs uppercase">
        WORKOUT HUB
      </div>
    </div>
  );
}

// ===============================
// WORKOUT DATE LOGIC
// ===============================
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

// ===============================
// MAIN APP
// ===============================
type ViewMode = 'today' | 'upcoming' | 'calendar' | 'coach';

export default function App() {
  const [view, setView] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Splash screen
  const [showSplash, setShowSplash] = useState(true);

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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative">

      {/* ========================= */}
      {/* UNIVERSAL SPLASH OVERLAY */}
      {/* ========================= */}
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      {/* ================================= */}
      {/* CONTENT AREA (FADE IN AFTER SPLASH) */}
      {/* ================================= */}
      <div
        className={`transition-opacity duration-500 ${
          showSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* HEADER */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur animate-fade-slide-down">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center px-4 py-4">
            <div className="flex flex-col items-center">
              <img
                src={BRAND_GOLD_IMG}
                alt="Empire Crown"
                className="w-12 h-12 mb-2 animate-pop animate-crown-glow"
              />
              <div className="text-2xl font-semibold text-center" style={{ color: '#DEC55B' }}>
                Empire VC Workout Hub
              </div>
            </div>

            <nav className="flex gap-3 text-sm mt-4 animate-fade-in">
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
                className={`px-3 py-1 rounded-full border.text-xs md:text-sm ${
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

        {/* MAIN CONTENT */}
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
                  <>
                    <WorkoutDetail workout={todayWorkout} />
                    <GuidedWorkoutTimer workout={todayWorkout} />
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm">
                    <p className="font-medium mb-1">No assigned home workout today.</p>
                    <p className="text-slate-400">
                      This might be a rest day or outside the Dec–May program.
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
    </div>
  );
}
