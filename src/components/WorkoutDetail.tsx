// src/components/WorkoutDetail.tsx
import React from "react";
import type { WorkoutDay } from "../data/workouts";

interface WorkoutDetailProps {
  workout: WorkoutDay;
}

export const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ workout }) => {
  const { title, focus, warmupSeconds, repeatSets, defaultRestSeconds, exercises, notes } = workout;

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 mb-4 text-sm">
      {/* Header */}
      <h2 className="text-lg md:text-xl font-semibold mb-1">{title}</h2>
      <p className="text-slate-300 mb-2">{focus}</p>

      {/* Summary row */}
      <div className="text-xs text-slate-400 mb-3 flex flex-wrap gap-3">
        <span>Warm-up: {warmupSeconds}s</span>
        <span>Sets: {repeatSets}x</span>
        {defaultRestSeconds && <span>Rest: {defaultRestSeconds}s</span>}
      </div>

      {/* Optional notes */}
      {notes && (
        <p className="text-xs text-slate-400 mb-3">
          <span className="font-semibold text-slate-300">Notes: </span>
          {notes}
        </p>
      )}

      {/* Workout structure */}
      <div className="mt-2">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
          Workout structure
        </div>
        <div className="space-y-2">
          {exercises.map((ex, idx) => (
            <div
              key={`${ex.name}-${idx}`}
              className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-1 last:border-b-0"
            >
              {/* Name + optional notes (left) */}
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-100">
                  {idx + 1}. {ex.name}
                </div>
                {ex.notes && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {ex.notes}
                  </div>
                )}
              </div>

              {/* Work time (right) */}
              <div className="text-xs text-slate-300 whitespace-nowrap ml-2">
                Work: {ex.workSeconds}s
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
