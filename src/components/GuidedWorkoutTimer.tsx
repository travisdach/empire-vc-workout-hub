// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { WorkoutDay } from '../data/workouts';
import { EXERCISE_IMAGES } from '../data/exerciseImages';

type Phase = 'idle' | 'work' | 'rest' | 'complete';

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

// HAPTIC helper
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [breakSeconds, setBreakSeconds] = useState<10 | 20 | 30>(20);
  const [fullscreen, setFullscreen] = useState(false);

  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const goRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];

  const currentExerciseName = currentExercise?.name ?? '';
  const imgSrc = EXERCISE_IMAGES[currentExerciseName] ?? '/images/exercises/default.png';

  // Preload audio & unlock for iOS
  useEffect(() => {
    beepRef.current = new Audio('/sounds/beep.wav');
    alarmRef.current = new Audio('/sounds/alarm.wav');
    goRef.current = new Audio('/sounds/go.wav');
    completeRef.current = new Audio('/sounds/complete.wav');

    const unlock = () => {
      [beepRef.current, alarmRef.current, goRef.current, completeRef.current].forEach((a) => {
        if (!a) return;
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
  }, []);

  // Countdown interval
  useEffect(() => {
    if (!running) return;
    if (phase === 'idle' || phase === 'complete') return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // Transitions + sounds
  useEffect(() => {
    if (!running) return;

    // 5-4-3-2-1 beep
    if (remaining > 0 && remaining <= 5 && (phase === 'work' || phase === 'rest')) {
      beepRef.current?.play().catch(() => {});
      vibrate(70);
    }

    if (remaining !== 0) return;

    // When hitting 0:
    if (phase === 'work') {
      alarmRef.current?.play().catch(() => {});
      vibrate([150, 80, 150]);

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      if (isLastExercise && isLastSet) {
        setRunning(false);
        setPhase('complete');
        completeRef.current?.play().catch(() => {});
        vibrate([200, 100, 200, 100, 300]);
        return;
      }

      setPhase('rest');
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      vibrate(120);
      return;
    }

    if (phase === 'rest') {
      goRef.current?.play().catch(() => {});
      vibrate([120, 40, 120]);

      const isLastExercise = currentExerciseIndex === exercises.length - 1;

      if (!isLastExercise) {
        const nextIndex = currentExerciseIndex + 1;
        const nextDur = exercises[nextIndex].workSeconds;
        setCurrentExerciseIndex(nextIndex);
        setPhase('work');
        setPhaseTotal(nextDur);
        setRemaining(nextDur);
      } else {
        const nextSet = currentSet + 1;
        const nextDur = exercises[0].workSeconds;
        setCurrentSet(nextSet);
        setCurrentExerciseIndex(0);
        setPhase('work');
        setPhaseTotal(nextDur);
        setRemaining(nextDur);
      }
    }
  }, [
    running,
    remaining,
    phase,
    currentExerciseIndex,
    currentSet,
    exercises,
    totalSets,
    breakSeconds
  ]);

  // Controls
  function handleStart() {
    if (!exercises.length) return;
    const firstDur = exercises[0].workSeconds;
    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setPhaseTotal(firstDur);
    setRemaining(firstDur);
    setRunning(true);
    setFullscreen(true);
  }

  function handlePauseResume() {
    if (phase === 'idle') handleStart();
    else setRunning((r) => !r);
  }

  function handleReset() {
    setRunning(false);
    setPhase('idle');
    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setRemaining(0);
    setPhaseTotal(1);
  }

  function handleExitFullscreen() {
    setFullscreen(false);
    setRunning(false);
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const phaseLabel =
    phase === 'idle' ? 'Ready' : phase === 'work' ? 'Work' : phase === 'rest' ? 'Rest' : 'Complete';

  const effectiveTotal = phaseTotal || 1;
  const progress =
    phase === 'idle'
      ? 0
      : phase === 'complete'
      ? 1
      : Math.min(1, Math.max(0, 1 - remaining / effectiveTotal));

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const showFullscreenTimer = phase !== 'idle';

  return (
    <>
      {/* Card mode (Today view) */}
      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 md:p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-1">
              Guided Timer
            </div>

            <div className="text-sm text-slate-300">
              Set{' '}
              <span className="font-semibold text-amber-200">
                {Math.min(currentSet + 1, totalSets)}/{totalSets}
              </span>{' '}
              • Exercise{' '}
              <span className="font-semibold text-amber-200">
                {Math.min(currentExerciseIndex + 1, exercises.length)}/{exercises.length}
              </span>
            </div>

            {currentExercise && phase !== 'complete' && (
              <div className="text-sm mt-1">
                <span className="text-slate-400">Now:</span>{' '}
                <span className="font-semibold">{currentExercise.name}</span>
              </div>
            )}
          </div>

          {/* Rest selector */}
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

        {/* Start + Reset */}
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
          Tap "Start Workout" to enter full-screen mode with images, sounds, haptics, and auto
          exercise transitions.
        </p>
      </div>

      {/* Full-Screen Mode */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {Math.min(currentSet + 1, totalSets)} / {totalSets}
              </div>
              <div className="text-sm">
                Exercise {Math.min(currentExerciseIndex + 1, exercises.length)} /{' '}
                {exercises.length}
              </div>
            </div>
            <button
              onClick={handleExitFullscreen}
              className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
            >
              Exit
            </button>
          </div>

          {/* Main area */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-6">
            {/* Exercise image */}
            <div
              key={currentExerciseName}
              className="
                w-[300px] h-[300px] md:w-[360px] md:h-[360px]
                rounded-3xl overflow-hidden border border-slate-700 bg-slate-900
                flex items-center justify-center mx-auto
                exercise-image-enter exercise-image-enter-active
              "
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={currentExerciseName || 'Exercise'}
                  className={`
                    w-full h-full object-contain rounded-2xl
                    ${phase === 'work' ? 'exercise-image-work' : ''}
                  `}
                  style={{ objectPosition: 'center' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No image set
                </div>
              )}
            </div>

            {/* Timer + labels */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {phaseLabel}
              </div>

              {currentExercise && phase !== 'complete' && (
                <div className="text-lg font-semibold text-center px-4">
                  {currentExercise.name}
                </div>
              )}

              {phase === 'complete' && (
                <div className="text-lg font-semibold text-emerald-300 text-center">
                  Workout complete! Great job.
                </div>
              )}

              {/* Progress Ring */}
              {showFullscreenTimer && (
                <div className="relative w-44 h-44 md:w-52 md:h-52">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth="10"
                      fill="none"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#DEC55B"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: 'stroke-dashoffset 0.25s linear' }}
                    />
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl md:text-5xl font-mono">
                      {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {phase === 'work'
                        ? 'Work time'
                        : phase === 'rest'
                        ? 'Rest before next exercise'
                        : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-2">
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

export default GuidedWorkoutTimer;
