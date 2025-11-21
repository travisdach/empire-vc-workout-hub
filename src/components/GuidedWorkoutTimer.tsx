// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { WorkoutDay } from '../data/workouts';
import { getExerciseImage } from '../data/exerciseImages';

// HAPTIC HELPERS
function vibrate(pattern: number | number[]) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

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
  const [fullscreen, setFullscreen] = useState(false);

  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const goRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const currentImage = getExerciseImage(currentExercise?.name ?? '');

  // Preload audio & unlock for iOS Safari
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

  // Main countdown
  useEffect(() => {
    if (!running) return;
    if (phase === 'idle' || phase === 'complete') return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // Handle countdown beeps + transitions
  useEffect(() => {
    if (!running) return;

    // Countdown beeps: 5–4–3–2–1
    if (remaining > 0 && remaining <= 5 && (phase === 'work' || phase === 'rest')) {
      beepRef.current?.play().catch(() => {});
      vibrate(70);
    }

    // When timer hits zero
    if (remaining !== 0) return;

    if (phase === 'work') {
      // End of exercise
      alarmRef.current?.play().catch(() => {});
      vibrate([150, 80, 150]); // strong double tap

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      // Everything complete
      if (isLastExercise && isLastSet) {
        setRunning(false);
        setPhase('complete');
        completeRef.current?.play().catch(() => {});
        vibrate([200, 100, 200, 100, 300]); // celebration pattern
        return;
      }

      // Otherwise start REST
      setPhase('rest');
      setRemaining(breakSeconds);
      vibrate(100); // pulse at rest start
      return;
    }

    if (phase === 'rest') {
      // End of rest -> GO!
      goRef.current?.play().catch(() => {});
      vibrate([120, 40, 120]); // double tap "go" cue

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      if (!isLastExercise) {
        // Continue inside the same set
        const nextIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextIndex);
        setPhase('work');
        setRemaining(exercises[nextIndex].workSeconds);
      } else {
        // End of set, go to next set
        const nextSet = currentSet + 1;
        setCurrentSet(nextSet);
        setCurrentExerciseIndex(0);
        setPhase('work');
        setRemaining(exercises[0].workSeconds);
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

  // Controls
  function handleStart() {
    if (!exercises.length) return;
    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setRemaining(exercises[0].workSeconds);
    setRunning(true);
    setFullscreen(true); // enter full screen when workout starts
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

  function handleExitFullscreen() {
    setFullscreen(false);
    setRunning(false); // pause when exiting
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
    <>
      {/* Normal card view in the workout detail screen */}
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

          {/* Break Selector */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-xs">
              <span className="text-slate-400 mb-1">Rest between exercises</span>
              <select
                value={breakSeconds}
                onChange={(e) => setBreakSeconds(Number(e.target.value) as 10 | 20 | 30)}
                className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-1 text-xs"
                disabled={running && phase !== 'idle'}
              >
                <option value={10}>10 sec</option>
                <option value={20}>20 sec</option>
                <option value={30}>30 sec</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compact timer + start button in card */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="text-xs text-slate-400 mb-1">{phaseLabel}</div>
            <div className="text-2xl md:text-3xl font-mono">
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className="px-3 py-1.5 rounded-full border border-amber-300 text-xs md:text-sm hover:bg-amber-300/10"
            >
              Start Workout
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
          Tap “Start Workout” to enter full-screen guided mode with sounds, haptics, and
          automatic exercise + set transitions.
        </p>
      </div>

      {/* Full-screen overlay mode */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {currentSet + 1} / {totalSets}
              </div>
              <div className="text-sm">
                Exercise {currentExerciseIndex + 1} / {exercises.length}
              </div>
            </div>
            <button
              onClick={handleExitFullscreen}
              className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
            >
              Exit
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">
            {/* Exercise image */}
            <div className="w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                src={currentImage}
                alt={currentExercise?.name ?? 'Exercise'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Text + timer */}
            <div className="text-center space-y-2">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {phaseLabel}
              </div>
              {currentExercise && phase !== 'complete' && (
                <div className="text-lg font-semibold">{currentExercise.name}</div>
              )}
              {phase === 'complete' && (
                <div className="text-lg font-semibold text-emerald-300">
                  Workout complete! Great job.
                </div>
              )}
              <div className="text-5xl md:text-6xl font-mono mt-1">
                {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePauseResume}
                className="px-6 py-2 rounded-full border border-amber-300 text-sm font-semibold hover:bg-amber-300/10"
              >
                {phase === 'idle' ? 'Start' : running ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 rounded-full border border-slate-600 text-sm hover:border-amber-300/70"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
