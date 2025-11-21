import React, { useState } from 'react';
import type { WorkoutDay } from '../data/workouts';

interface Props {
  onSelectDate: (d: Date) => void;
  getWorkoutForDate: (d: Date) => WorkoutDay | null;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const CalendarView: React.FC<Props> = ({ onSelectDate, getWorkoutForDate }) => {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const year = current.getFullYear();
  const month = current.getMonth();

  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar cells
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const d = new Date(current);
            d.setMonth(d.getMonth() - 1);
            setCurrent(d);
          }}
          className="text-xs px-2 py-1 rounded-full border border-slate-700 hover:border-amber-300/80"
        >
          ‹ Prev
        </button>

        <div className="font-semibold text-sm md:text-base">
          {monthNames[month]} {year}
        </div>

        <button
          onClick={() => {
            const d = new Date(current);
            d.setMonth(d.getMonth() + 1);
            setCurrent(d);
          }}
          className="text-xs px-2 py-1 rounded-full border border-slate-700 hover:border-amber-300/80"
        >
          Next ›
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-[11px] text-center text-slate-400 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs">
        {cells.map((date, idx) => {
          if (!date)
            return <div key={idx} className="h-10 md:h-12 rounded-lg bg-transparent" />;

          const workout = getWorkoutForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(date)}
              className={`h-10 md:h-12 rounded-lg border text-left px-1.5 py-1 flex flex-col justify-between
                ${
                  workout
                    ? 'border-amber-300/70 bg-amber-300/5'
                    : 'border-slate-700 bg-slate-950/40'
                }
                ${isToday ? 'ring-1 ring-amber-300' : ''}
              `}
            >
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold">{date.getDate()}</span>
                {workout && <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>}
              </div>

              <div className="text-[9px] text-slate-400 line-clamp-2">
                {workout ? workout.title : 'Rest'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
