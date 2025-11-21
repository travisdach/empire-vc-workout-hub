import React from 'react';
import type { WorkoutDay } from '../data/workouts';
import { Timer } from './Timer';

interface Props {
  workout: WorkoutDay;
}

export const WorkoutDetail: React.FC<Props> = ({ workout }) => {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-1">
          {workout.month.toUpperCase()} • {workout.dayKey.toUpperCase()}
        </div>
        <h3 className="text-xl md:text-2xl font-semibold mb-1">{workout.title}</h3>
        <p className="text-sm text-slate-300 mb-2">{workout.focus}</p>
        {workout.notes && <p className="text-xs text-slate-400 mb-2">{workout.notes}</p>}
        <p className="text-xs text-slate-400">
          2-minute warm-up (jog in place, arm swings, hip mobility) before starting.
        </p>
      </div>

      {/* Exercises Card */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Workout Sets</div>
          <div className="text-xs text-slate-400">
            Sets: <span className="font-semibold text-amber-200">{workout.repeatSets}</span> •{' '}
            Default Rest:{' '}
            <span className="font-semibold text-amber-200">
              {workout.defaultRestSeconds ?? 20}s
            </span>
          </div>
        </div>

        <ol className="space-y-3 text-sm">
          {workout.exercises.map((ex, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3 md:p-4"
            >
              <div className="flex justify-between items-center gap-2">
                <div>
                  <div className="font-semibold">{ex.name}</div>
                  <div className="text-xs text-slate-400">
                    Work:{' '}
                    <span className="font-semibold text-amber-200">{ex.workSeconds}s</span>
                    {workout.defaultRestSeconds
                      ? ` • Rest: ${workout.defaultRestSeconds}s`
                      : null}
                  </div>
                  {ex.notes && <div className="text-xs text-slate-500 mt-1">{ex.notes}</div>}
                </div>
              </div>
              <Timer durationSeconds={ex.workSeconds} />
            </li>
          ))}
        </ol>

        <p className="text-[11px] text-slate-500 mt-3">
          Complete all exercises in order, then repeat the full list for the number of sets shown.
        </p>
      </div>
    </div>
  );
};
