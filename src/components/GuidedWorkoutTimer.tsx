// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from "react";
import type { WorkoutDay } from "../data/workouts";
import { EXERCISE_IMAGES } from "../data/exerciseImages";

type Phase = "idle" | "work" | "rest" | "complete";

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

// HAPTIC helper
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// SPEECH helper — chooses a female workout-coach-style voice
function baseSpeak(text: string) {
  if (typeof window === "undefined") return;

  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const preferred = voices.find((v) =>
    /female|woman|zira|samantha|google uk english female|english/i.test(
      v.name + " " + v.voiceURI
    )
  );

  if (preferred) utter.voice = preferred;
  utter.pitch = 1;
  utter.rate = 1.05;
  utter.volume = 1;

  window.speechSynthesis.speak(utter);
}

const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [breakSeconds] = useState<10 | 20 | 30>(20);
  const [fullscreen, setFullscreen] = useState(false);

  // Pre-start countdown before first exercise
  const [preStart, setPreStart] = useState(false);

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [beepsEnabled, setBeepsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
  const currentExerciseName = currentExercise?.name ?? "";

  // REST image mapping
  const imgSrc =
    phase === "rest"
      ? "/images/exercises/rest.png"
      : EXERCISE_IMAGES[currentExerciseName] ??
        "/images/exercises/default.png";

  // Local speech wrapper honoring settings
  const say = (text: string) => {
    if (!voiceEnabled) return;
    baseSpeak(text);
  };

  // PRELOAD AUDIO
  useEffect(() => {
    beepRef.current = new Audio("/sounds/beep.wav");
    alarmRef.current = new Audio("/sounds/alarm.wav");
    goRef.current = new Audio("/sounds/go.wav");
    completeRef.current = new Audio("/sounds/complete.wav");

    const unlock = () => {
      [beepRef.current, alarmRef.current, goRef.current, completeRef.current].forEach(
        (a) => {
          if (!a) return;
          a.play().catch(() => {});
          a.pause();
          a.currentTime = 0;
        }
      );

      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  }, []);

  // MAIN TIMER TICK
  useEffect(() => {
    if (!running) return;
    if (phase === "idle" || phase === "complete") return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // EFFECTS / TRANSITION LOGIC
  useEffect(() => {
    if (!running) return;

    // 3…2…1 POP-IN (for normal phase transitions; not preStart)
    if (!preStart && remaining > 0 && remaining <= 3) {
      if (beepsEnabled) {
        const beep = beepRef.current;
        if (beep) {
          beep.currentTime = 0; // ensure beep is audible, not cut off
          beep.play().catch(() => {});
        }
      }
      vibrate(50);

      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 200);

      setCountdownNumber(remaining);
      setTimeout(() => setCountdownNumber(null), 800);
    }

    if (remaining !== 0) return;

    // ========== WORK ENDED ==========
    if (phase === "work") {
      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      const isLastSet = currentSet === totalSets - 1;

      // FULL WORKOUT COMPLETE
      if (isLastExercise && isLastSet) {
        setRunning(false);
        setPhase("complete");

        const complete = completeRef.current;
        if (complete) {
          complete.currentTime = 0;
          complete.play().catch(() => {});
        }
        vibrate([200, 100, 200, 100, 300]);
        say("Workout complete!");

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        return;
      }

      // Enter REST
      const alarm = alarmRef.current;
      if (alarm) {
        alarm.currentTime = 0;
        alarm.play().catch(() => {});
      }
      vibrate([150, 80, 150]);

      // ANNOUNCE NEXT EXERCISE OR NEXT SET
      const nextName =
        currentExerciseIndex === exercises.length - 1
          ? exercises[0].name
          : exercises[currentExerciseIndex + 1].name;

      if (currentExerciseIndex === exercises.length - 1) {
        say("Next set coming up!");
      } else {
        say(`Next: ${nextName}`);
      }

      setPhase("rest");
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // ========== REST ENDED ==========
    if (phase === "rest") {
      setFlashGo(true);
      setTimeout(() => setFlashGo(false), 130);

      const go = goRef.current;
      if (go) {
        go.currentTime = 0;
        go.play().catch(() => {});
      }
      vibrate([120, 40, 120]);

      const isLastExercise = currentExerciseIndex === exercises.length - 1;
      let nextIndex = currentExerciseIndex;
      let nextDur = 0;
      let nextName = "";

      if (!isLastExercise) {
        nextIndex = currentExerciseIndex + 1;
        nextDur = exercises[nextIndex].workSeconds;
        nextName = exercises[nextIndex].name;
        setCurrentExerciseIndex(nextIndex);
      } else {
        nextIndex = 0;
        nextDur = exercises[0].workSeconds;
        nextName = exercises[0].name;
        setCurrentSet((s) => s + 1);
        setCurrentExerciseIndex(0);
      }

      // Switch to WORK
      setPhase("work");
      setPhaseTotal(nextDur);
      setRemaining(nextDur);
      setFadeKey((k) => k + 1);

      // Voice: Go (NO "Begin ..." call now)
      say("Go!");
      // removed: say(`Begin ${nextName}`);
    }
  }, [
    running,
    remaining,
    phase,
    preStart,
    currentExerciseIndex,
    currentSet,
    exercises,
    totalSets,
    breakSeconds,
    beepsEnabled,
    say
  ]);

  // Start with a pre-start 3–2–1–GO before the first work phase
  const handleStart = () => {
    const firstDur = exercises[0].workSeconds;

    setCurrentSet(0);
    setCurrentExerciseIndex(0);
    setPhase("idle");
    setPhaseTotal(firstDur);
    setRemaining(firstDur);
    setFullscreen(true);
    setFadeKey((k) => k + 1);
    setRunning(false);
    setPreStart(true);

    // Pre-start voice & countdown
    say("Get ready");

    let t0 = 0;
    const stepMs = 1000;

    // 3
    setTimeout(() => {
      setCountdownNumber(3);
      if (beepsEnabled) {
        const beep = beepRef.current;
        if (beep) {
          beep.currentTime = 0;
          beep.play().catch(() => {});
        }
      }
      vibrate(50);
    }, (t0 += stepMs));

    // 2
    setTimeout(() => {
      setCountdownNumber(2);
      if (beepsEnabled) {
        const beep = beepRef.current;
        if (beep) {
          beep.currentTime = 0;
          beep.play().catch(() => {});
        }
      }
      vibrate(50);
    }, (t0 += stepMs));

    // 1
    setTimeout(() => {
      setCountdownNumber(1);
      if (beepsEnabled) {
        const beep = beepRef.current;
        if (beep) {
          beep.currentTime = 0;
          beep.play().catch(() => {});
        }
      }
      vibrate(50);
    }, (t0 += stepMs));

    // GO + start timer & ring
    setTimeout(() => {
      setCountdownNumber(null);
      setPreStart(false);
      say("Go!");
      // removed: say(`Begin ${exercises[0].name}`);
      const go = goRef.current;
      if (go) {
        go.currentTime = 0;
        go.play().catch(() => {});
      }
      vibrate([100, 40, 100]);

      setPhase("work");
      setRunning(true);
    }, (t0 += stepMs));
  };

  const handlePause = () => setRunning((r) => !r);

  const handleExit = () => {
    setFullscreen(false);
    setRunning(false);
    setPreStart(false);
    setCountdownNumber(null);
  };

  // TIMER NUMBER (plain seconds)
  const plainSeconds = remaining;

  // SMOOTH RING PROGRESS
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / (phaseTotal || 1);
  const strokeDashoffset = circumference * progress;

  // MINI PROGRESS BAR
  const totalItems = totalSets * exercises.length;
  const currentProgress = currentSet * exercises.length + currentExerciseIndex;
  const progressPercent = (currentProgress / totalItems) * 100;

  return (
    <>
      {/* GO FLASH (for phase transitions) */}
      {fullscreen && flashGo && <div className="go-flash" />}

            {/* START SCREEN (button pinned to bottom) */}
      {!fullscreen && (
        <>
          <div className="mt-3 text-center text-sm text-slate-300">
            Guided timer available for this workout.
          </div>

          <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40 pointer-events-none">
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-amber-400 text-slate-900 rounded-xl font-bold shadow hover:bg-amber-300 pointer-events-auto rounded-2xl"
            >
              Start Workout
            </button>
          </div>
        </>
      )}


      {/* FULLSCREEN MODE */}
      {fullscreen && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950 text-white flex flex-col transition-all duration-500 pb-[env(safe-area-inset-bottom)] ${
            phase === "rest" ? "rest-glow" : ""
          }`}
        >
          {/* CONFETTI */}
          {showConfetti && <div className="confetti" />}

          {/* TOP BAR + MINI PROGRESS BAR + SETTINGS TOGGLE */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 relative z-20">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {currentSet + 1} / {totalSets}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings((s) => !s)}
                  className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
                >
                  Settings
                </button>
                <button
                  onClick={handleExit}
                  className="px-3 py-1 rounded-full border border-slate-600 text-xs hover:border-amber-300/80"
                >
                  Exit
                </button>
              </div>
            </div>

            {/* MINI PROGRESS BAR */}
            <div className="w-full h-[5px] mt-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* SETTINGS PANEL */}
            {showSettings && (
              <div className="mt-3 flex gap-4 text-xs text-slate-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>Coach voice</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={beepsEnabled}
                    onChange={(e) => setBeepsEnabled(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>Beeps</span>
                </label>
              </div>
            )}
          </div>

          {/* MAIN AREA */}
          <div className="flex-1 flex flex-col items-center justify-start px-4 pt-6 pb-4 gap-6 relative">
            {/* IMAGE */}
            <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentExerciseName}
                className="fade-image visible w-full h-full object-contain rounded-3xl"
              />
            </div>

            {/* TITLE */}
            <div className="text-3xl font-bold mt-1 text-center">
              {phase === "complete" ? "Workout Complete!" : currentExerciseName}
            </div>

            {/* TIMER CIRCLE + COUNTDOWN */}
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center mt-2 mb-4">
              {/* Show ring only AFTER pre-start countdown */}
              {!preStart && (
                <div
                  className={`relative w-full h-full ${
                    pulseRing ? "timer-pulse" : ""
                  }`}
                >
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 160 160"
                  >
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
                      stroke={pulseRing ? "#FFD54A" : "#DEC55B"}
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      style={{ transition: "stroke-dashoffset 0.35s linear" }}
                    />
                  </svg>
                </div>
              )}

              {/* COUNTDOWN (pre-start + transitions) */}
              {countdownNumber !== null && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-7xl font-extrabold text-amber-400.animate-pop">
                    {countdownNumber}
                  </div>
                </div>
              )}

              {/* TIMER NUMBER (hide while countdown visible or pre-start) */}
              {countdownNumber === null && !preStart && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-mono">{plainSeconds}</div>
                </div>
              )}
            </div>

            {/* CONTROLS — PAUSE BUTTON */}
            <div className="flex gap-3 mt-1 mb-4">
              <button
                onClick={handlePause}
                className="px-8 py-3 rounded-full border border-amber-300 text-base font-semibold hover:bg-amber-300/10"
              >
                {running ? "Pause" : "Resume"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuidedWorkoutTimer;
