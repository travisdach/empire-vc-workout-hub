import React, { useEffect, useRef, useState } from 'react';
import type { WorkoutDay } from '../data/workouts';

type Phase = 'idle' | 'work' | 'rest' | 'complete';

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

export const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState<10 | 20 | 30>(20);

  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const goRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];

  // Preload audio and unlock on first user interaction (for iOS)
  useEffect(() => {
    beepRef.current = new Audio('/sounds/beep.wav');
    alarmRef.current = new Audio('/sounds/alarm.wav');
    goRef.current = new Audio('/sounds/go.wav');
    completeRef.current = new Audio('/sounds/complete.wav');

    const unlockAudio = () => {
      const all = [beepRef.current, alarmRef.current, goRef.current, completeRef.current];
      all.forEach((a) => {
        if (!a) return;
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
  }, []);

  // Main countdown effect
  useEffect(() => {
    if (!running) return;
    if (phase === 'idle' || phase === 'complete') return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // Handle beeps + transitions
  useEffect(() => {
    if (!running) return;

    // Beep at 5,4,3,2,1 in both work and rest
    if (remaining > 0 && remaining <= 5 && (phase === 'work' || phase === 'rest')) {
      beepRef.current?.play().catch(() => {});
    }

    if (remaining !== 0) return;

    // When remaining hits 0, branch by phase
    if (phase === 'work') {
      // End of an exercise
      alarmRef.current?.play().catch(() => {});

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      if (isLastExercise && isLastSet) {
        // Done ALL sets and ALL exercises
        setRunning(false);
        setPhase('complete');
        completeRef.current?.play().catch(() => {});
        return;
      }

      // Otherwise, go into a rest period before next exercise / next set
      setPhase('rest');
      setRemaining(breakSeconds);
      return;
    }

    if (phase === 'rest') {
      // Rest finished -> "Go!" and move to next exercise or next set
      goRef.current?.play().catch(() => {});

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      if (!isLastExercise) {
        // Next exercise in same set
        const nextIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextIndex);
        const nextDuration = exercises[nextIndex]?.workSeconds ?? 0;
        setPhase('work');
        setRemaining(nextDuration);
      } else {
        // End of set
        if (!isLastSet) {
          const nextSet = currentSet + 1;
          setCurrentSet(nextSet);
          setCurrentExerciseIndex(0);
          const firstDuration = exercises[0]?.workSeconds ?? 0;
          setPhase('work');
          setRemaining(firstDuration);
        } else {
          // Should rarely hit this branch, but safe-guard
          setRunning(false);
          setPhase('complete');
          completeRef.current?.play().catch(() => {});
        }
      }
    }
  }, [
    running,
    remaining,
    phase,
    currentExerciseIndex,
    currentSet,
    totalSets,
    breakSeconds,
    exercises
  ]);

  function handleStart() {
    if (!exercises.length) return;
    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setRemaining(exercises[0].workSeconds);
    setRunning(true);
  }

  function handlePauseResume() {
    if (phase === 'idle') {
      handleStart();
    } else {
      setRunning((r) => !r);
    }
  }

  function handleReset() {
    setRunning(false);
    setPhase('idle');
    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setRemaining(0);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const phaseLabel =
    phase === 'idle'
      ? 'Ready'
      : phase === 'work'
      ? 'Work'
      : phase === 'rest'
      ? 'Rest'
      : 'Complete';

  return (
    <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 md:p-5 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-1">
            Guided Timer
          </div>
          <div className="text-sm text-slate-300">
            Set{' '}
            <span className="font-semibold text-amber-200">
              {currentSet + 1}/{totalSets}
            </span>{' '}
            • Exercise{' '}
            <span className="font-semibold text-amber-200">
              {currentExerciseIndex + 1}/{exercises.length}
            </span>
          </div>
          {currentExercise && phase !== 'complete' && (
            <div className="text-sm mt-1">
              <span className="text-slate-400">Now:</span>{' '}
              <span className="font-semibold">{currentExercise.name}</span>
            </div>
          )}
          {phase === 'complete' && (
            <div className="text-sm mt-1 font-semibold text-emerald-300">
              Workout complete! Great job.
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-xs">
            <span className="text-slate-400 mb-1">Rest between exercises</span>
            <select
              value={breakSeconds}
              onChange={(e) => setBreakSeconds(Number(e.target.value) as 10 | 20 | 30)}
              className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs"
              disabled={running && phase !== 'idle'}
            >
              <option value={10}>10 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="text-xs text-slate-400 mb-1">{phaseLabel}</div>
          <div className="text-3xl md:text-4xl font-mono">
            {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePauseResume}
            className="px-3 py-1.5 rounded-full border border-amber-300 text-xs md:text-sm hover:bg-amber-300/10"
          >
            {phase === 'idle' ? 'Start Workout' : running ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-full border border-slate-700 text-xs md:text-sm hover:border-amber-300/70"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Timer will auto-advance through all exercises and sets. Beeps at 5 seconds, alarm at the
        end of each exercise, “Go!” at the end of each rest, and cheering when the full workout is
        complete.
      </p>
    </div>
  );
};
