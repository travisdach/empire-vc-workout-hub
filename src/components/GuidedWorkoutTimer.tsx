// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { WorkoutDay } from '../data/workouts';
import { EXERCISE_IMAGES } from '../data/exerciseImages';

// ⭐ Import your rest image (volleyball in crown)
import RestImg from '../assets/rest.png';

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

  // Animations
  const [flashGo, setFlashGo] = useState(false);
  const [pulseRing, setPulseRing] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

  // Audio refs
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const goRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const currentExerciseName = currentExercise?.name ?? '';

  // ⭐ REST image mapping — FIXED
  const imgSrc =
    phase === 'rest'
      ? RestImg
      : EXERCISE_IMAGES[currentExerciseName] ?? '/images/exercises/default.png';

  // ————————————————————————————————
  // PRELOAD AUDIO
  // ————————————————————————————————
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

  // ————————————————————————————————
  // MAIN COUNTDOWN
  // ————————————————————————————————
  useEffect(() => {
    if (!running) return;
    if (phase === 'idle' || phase === 'complete') return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // ————————————————————————————————
  // TRANSITIONS + 3-SECOND COUNTDOWN FIX
  // ————————————————————————————————
  useEffect(() => {
    if (!running) return;

    // ⭐ ONLY last 3 seconds → beep + pulse
    if (remaining > 0 && remaining <= 3 && (phase === 'work' || phase === 'rest')) {
      beepRef.current?.play().catch(() => {});
      vibrate(50);

      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 180);
    }

    if (remaining !== 0) return;

    //
    // ——— WORK PHASE ———
    //
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

      // → REST PHASE
      setPhase('rest');
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    //
    // ——— REST PHASE ———
    //
    if (phase === 'rest') {
      setFlashGo(true);
      setTimeout(() => setFlashGo(false), 150);

      goRef.current?.play().catch(() => {});
      vibrate([120, 40, 120]);

      const isLastExercise = currentExerciseIndex === exercises.length - 1;

      if (!isLastExercise) {
        const next = currentExerciseIndex + 1;
        const nextDur = exercises[next].workSeconds;

        setCurrentExerciseIndex(next);
        setPhase('work');
        setPhaseTotal(nextDur);
        setRemaining(nextDur);
        setFadeKey((k) => k + 1);
      } else {
        // Next set
        const nextDur = exercises[0].workSeconds;

        setCurrentSet(currentSet + 1);
        setCurrentExerciseIndex(0);
        setPhase('work');
        setPhaseTotal(nextDur);
        setRemaining(nextDur);
        setFadeKey((k) => k + 1);
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

  // ————————————————————————————————
  // CONTROLS
  // ————————————————————————————————
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
    setFadeKey((k) => k + 1);
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
    setFullscreen(false);
  }

  function handleExitFullscreen() {
    setFullscreen(false);
    setRunning(false);
  }

  // ————————————————————————————————
  // TIME FORMAT
  // ————————————————————————————————
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const phaseLabel =
    phase === 'idle' ? 'Ready' : phase === 'work' ? 'Work' : phase === 'rest' ? 'Rest' : 'Complete';

  // ————————————————————————————————
  // PROGRESS CIRCLE
  // ————————————————————————————————
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining > 0 ? 1 - remaining / (phaseTotal || 1) : 1;
  const strokeDashoffset = circumference * (1 - progress);

  // ————————————————————————————————
  // RETURN JSX
  // ————————————————————————————————
  return (
    <>
      {/* ⭐ GO FLASH */}
      {fullscreen && flashGo && <div className="go-flash"></div>}

      {/* ⭐ START SCREEN (FIXED) */}
      {!fullscreen && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-white">
          <div className="text-xl font-bold tracking-wide">Empire VC Workout Hub</div>

          <button
            onClick={handleStart}
            className="px-6 py-3 rounded-xl bg-amber-400 text-slate-900 font-bold shadow-md hover:bg-amber-300"
          >
            Start Workout
          </button>
        </div>
      )}

      {/* ⭐ FULLSCREEN WORKOUT MODE */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {currentSet + 1} / {totalSets}
              </div>
              <div className="text-sm">
                Exercise {Math.min(currentExerciseIndex + 1, exercises.length)} / {exercises.length}
              </div>
            </div>

            <button
              onClick={handleExitFullscreen}
              className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
            >
              Exit
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-6">

            {/* ⭐ EXERCISE IMAGE W/ CROSSFADE */}
            <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentExerciseName || 'Exercise'}
                className="fade-image visible w-full h-full object-contain p-4"
              />
            </div>

            {/* ⭐ TIMER + LABELS */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{phaseLabel}</div>

              <div className="text-lg font-semibold text-center px-4">
                {phase === 'complete' ? 'Workout complete!' : currentExerciseName}
              </div>

              {/* ⭐ PROGRESS CIRCLE */}
              <div className={`relative w-44 h-44 md:w-52 md:h-52 ${pulseRing ? 'timer-pulse' : ''}`}>
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
                    {phase === 'rest'
                      ? 'Rest before next exercise'
                      : phase === 'work'
                      ? 'Work time'
                      : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* ⭐ CONTROLS */}
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
