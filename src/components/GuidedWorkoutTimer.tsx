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
  const [breakSeconds] = useState<10 | 20 | 30>(20);
  const [fullscreen, setFullscreen] = useState(false);

  // Animations
  const [flashGo, setFlashGo] = useState(false);
  const [pulseRing, setPulseRing] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Audio refs
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const goRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const currentExerciseName = currentExercise?.name ?? '';

  // REST image
  const imgSrc =
    phase === 'rest'
      ? '/images/exercises/rest.png'
      : EXERCISE_IMAGES[currentExerciseName] ?? '/images/exercises/default.png';

  // PRELOAD AUDIO
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

  // MAIN TIMER
  useEffect(() => {
    if (!running) return;
    if (phase === 'idle' || phase === 'complete') return;

    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // EFFECTS / TRANSITIONS
  useEffect(() => {
    if (!running) return;

    // 3-second countdown
    if (remaining > 0 && remaining <= 3) {
      beepRef.current?.play().catch(() => {});
      vibrate(50);
      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 200);

      setCountdownNumber(remaining);
      setTimeout(() => setCountdownNumber(null), 900);
    }

    if (remaining !== 0) return;

    // ========== WORK JUST ENDED ==========
    if (phase === 'work') {
      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      // ⭐ FULL WORKOUT COMPLETE
      if (isLastExercise && isLastSet) {
        setRunning(false);
        setPhase('complete');

        completeRef.current?.play().catch(() => {});
        vibrate([200, 90, 200, 90, 300]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        return;
      }

      // ⭐ Not complete → go to rest
      alarmRef.current?.play().catch(() => {});
      vibrate([150, 80, 150]);

      setPhase('rest');
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // ========== REST JUST ENDED ==========
    if (phase === 'rest') {
      setFlashGo(true);
      setTimeout(() => setFlashGo(false), 150);

      goRef.current?.play().catch(() => {});
      vibrate([100, 40, 100]);

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
        const nextDur = exercises[0].workSeconds;

        setCurrentSet((s) => s + 1);
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

  // CONTROLS
  const handleStart = () => {
    const firstDur = exercises[0].workSeconds;

    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setPhaseTotal(firstDur);
    setRemaining(firstDur);
    setRunning(true);
    setFullscreen(true);
    setFadeKey((k) => k + 1);
  };

  const handlePause = () => setRunning((r) => !r);
  const handleExit = () => setFullscreen(false);

  // TIMER VALUE (just seconds)
  const plainSeconds = remaining;

  // Smooth ring interpolation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / (phaseTotal || 1);
  const strokeDashoffset = circumference * (1 - (1 - progress));

  return (
    <>
      {/* GO FLASH */}
      {fullscreen && flashGo && <div className="go-flash" />}

      {/* START SCREEN */}
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

      {/* FULLSCREEN MODE */}
      {fullscreen && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col transition-all duration-500 ${
            phase === 'rest' ? 'rest-glow' : ''
          }`}
        >
          {/* CONFETTI */}
          {showConfetti && <div className="confetti" />}

          {/* 3-2-1 COUNTDOWN */}
          {countdownNumber !== null && (
            <div className="countdown-pop">{countdownNumber}</div>
          )}

          {/* TOP BAR */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {currentSet + 1} / {totalSets}
              </div>
            </div>

            <button
              onClick={handleExit}
              className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
            >
              Exit
            </button>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-6">

            {/* IMAGE */}
            <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentExerciseName}
                className="fade-image visible w-full h-full object-contain rounded-3xl"
              />
            </div>

            {/* ACTIVE WORKOUT NAME — BIGGER */}
            <div className="text-3xl font-bold mt-2 mb-1 text-center">
              {phase === 'complete' ? 'Workout Complete!' : currentExerciseName}
            </div>

            {/* TIMER */}
            <div className={`relative w-44 h-44 md:w-52.md:h-52 ${pulseRing ? 'timer-pulse' : ''}`}>
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
                  stroke={pulseRing ? '#FFD54A' : '#DEC55B'}
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.35s linear' }}
                />
              </svg>

              {/* Seconds */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-5xl font-mono">{plainSeconds}</div>
              </div>
            </div>

            {/* CONTROLS - NO RESET */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={handlePause}
                className="px-6 py-2 rounded-full border border-amber-300 text-sm font-semibold hover:bg-amber-300/10"
              >
                {running ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuidedWorkoutTimer;
