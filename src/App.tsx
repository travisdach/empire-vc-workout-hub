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

const BRAND_GOLD = '#DEC55B';

type ViewMode = 'today' | 'upcoming' | 'calendar' | 'coach';

/* -----------------------------------------
   iOS "Add to Home Screen" Prompt Component
------------------------------------------ */
function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInstalled =
      window.navigator.standalone ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && !isInstalled) {
      // Delay slightly so UI loads first
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900/95 border border-amber-300/50 p-4 rounded-xl text-center shadow-xl backdrop-blur">
      <div className="font-semibold text-amber-200 mb-1">Install Empire VC Workout Hub</div>
      <div className="text-xs text-slate-300 leading-relaxed">
        To install this app:<br />
        Tap <span className="text-amber-200">Share</span> →{' '}
        <span className="text-amber-200">Add to Home Screen</span>
      </div>
    </div>
  );
}

/* -----------------------------------------
      Workout Lookup Logic
------------------------------------------ */
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

  return WORKOUT_PROGRAM[monthKey as MonthKey]?.[dayKey] ?? null;
}

/* -----------------------------------------
          Main App Component
------------------------------------------ */
export default function App() {
  const [view, setView] = useState<ViewMode>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const todayWorkout = useMemo(() => getWorkoutForDate(selectedDate), [selectedDate]);

  const upcoming = useMemo(() => {
    const arr: { date: Date; workout: WorkoutDay | null }[] = [];
    const base = new Date();

    for (let i = 0; i < 10; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      arr.push({ date: d, workout: getWorkoutForDate(d) });
    }

    return arr;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* iOS Install Banner */}
      <IOSInstallPrompt />

      {/* Header */}
     <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur animate-fade-slide-down">
  <div className="max-w-4xl mx-auto flex flex-col items-center justify-center px-4 py-4">
    <div className="flex flex-col items-center">
      <img
        src="/icons/empire-crown.png"
        alt="Empire Crown"
        className="w-12 h-12 mb-2 animate-pop"
      />
      <div className="text-2xl font-semibold text-center" style={{ color: BRAND_GOLD }}>
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


      {/* Main Content */}
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
                    This may be a rest day or outside the Dec–May program. Coaches can adjust the
                    schedule as needed.
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
