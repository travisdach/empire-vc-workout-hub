// src/components/WorkoutDetail.tsx
import React from "react";
import type { WorkoutDay } from "../data/workouts";

interface WorkoutDetailProps {
  workout: WorkoutDay;
}

export const WorkoutDetail: React.FC<WorkoutDetailProps> = ({ workout }) => {
  const {
    title,
    focus,
    warmupSeconds,
    repeatSets,
    defaultRestSeconds,
    exercises,
    notes
  } = workout;

  // ---------------------------------------------------------
  // Estimated Time (Option C as requested)
  // ---------------------------------------------------------
  const getEstimatedTime = () => {
    const warmup = warmupSeconds || 0;

    const exerciseWork = exercises.reduce(
      (total, ex) => total + (ex.workSeconds || 0),
      0
    );

    const exerciseCount = exercises.length;

    const restPerExercise = defaultRestSeconds
      ? defaultRestSeconds * Math.max(0, exerciseCount - 1)
      : 0;

    const repeatSetBlock = exerciseWork + restPerExercise;

    const setsTotal = repeatSetBlock * (repeatSets || 1);

    const totalSeconds = warmup + setsTotal;

    return formatTime(totalSeconds);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // ---------------------------------------------------------

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 mb-4 text-base">

      {/* Header */}
      <h2 className="text-xl md:text-2xl font-bold mb-1 text-slate-100">
        {title}
      </h2>
      <p className="text-slate-300 text-sm mb-3">{focus}</p>

      {/* Summary row */}
      <div className="text-sm text-slate-400 mb-4 flex flex-wrap gap-4">
        <span>Warm-up: {warmupSeconds}s</span>
        <span>Sets: {repeatSets}x</span>
        {defaultRestSeconds && <span>Rest: {defaultRestSeconds}s</span>}
      </div>

      {/* Estimated Time */}
      <div className="flex justify-between items-center bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-2 mb-4">
        <span className="font-semibold text-slate-200 text-sm">
          Estimated Time
        </span>
        <span className="font-bold text-slate-100 text-sm">
          {getEstimatedTime()}
        </span>
      </div>

      {/* Optional Notes */}
      {notes && (
        <p className="text-sm text-slate-400 mb-4">
          <span className="font-semibold text-slate-300">Notes: </span>
          {notes}
        </p>
      )}

      {/* Workout structure */}
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-2">
          Workout Structure
        </div>

        <div className="space-y-2">
          {exercises.map((ex, idx) => (
            <div
              key={`${ex.name}-${idx}`}
              className="flex items-baseline justify-between gap-3 border-b border-slate-800/60 pb-1 last:border-b-0"
            >
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
