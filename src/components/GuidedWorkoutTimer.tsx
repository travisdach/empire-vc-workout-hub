// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from "react";
import type { WorkoutDay } from "../data/workouts";
import { EXERCISE_IMAGES } from "../data/exerciseImages";

type Phase = "idle" | "work" | "rest" | "complete";

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

/* ============================================================
   HAPTIC HELPER
============================================================ */
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

/* ============================================================
   COACH PHRASES (Variation Pool)
============================================================ */
const coachPhrases = {
  getReady: [
    "Get ready. Focus in.",
    "Get set. Deep breath.",
    "Dial in. Get prepared.",
    "Stay loose. Starting soon.",
    "Get mentally ready."
  ],
  go: [
    "Go! Push it!",
    "Go! Stay strong!",
    "Let’s move! Your best pace!",
    "Go! Power through it!",
    "Go! You’ve got this!"
  ],
  next: [
    "Next up: {x}. You’re doing awesome.",
    "Coming up: {x}. Stay locked in.",
    "Get ready for {x}. Deep breath.",
    "Next exercise: {x}. Crush this one.",
    "Prepare for {x}. Keep the momentum."
  ],
  rest: [
    "Rest. Breathe.",
    "Rest time. Shake it out.",
    "Nice work. Rest now.",
    "Catch your breath.",
    "Rest up. Strong work!"
  ],
  complete: [
    "Amazing work! Workout complete!",
    "Great job! That’s a wrap!",
    "You crushed it! Workout finished!",
    "Done! Awesome effort today!",
    "Workout complete. Be proud!"
  ]
};

/* ============================================================
   SPEECH ENGINE (Natural cadence)
============================================================ */
function baseSpeak(text: string) {
  if (typeof window === "undefined") return;

  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  // Prefer natural female coach voices
  const preferred = voices.find((v) =>
    /(samantha|olivia|serena|allison|karen|google uk english female|google us english|female|woman)/i
      .test(v.name + " " + v.voiceURI)
  );

  if (preferred) utter.voice = preferred;

  utter.pitch = 1.03;
  utter.rate = 0.93;
  utter.volume = 1;

  // natural pauses
  utter.text = text.replace(/,/g, ", ").replace(/\./g, ". ");

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* ============================================================
   SAY HELPERS (Random phrase selection)
============================================================ */
const pick = (key: string, arg?: string): string => {
  const list = coachPhrases[key as keyof typeof coachPhrases];
  if (!list) return key;
  let phrase = list[Math.floor(Math.random() * list.length)];
  if (arg) phrase = phrase.replace("{x}", arg);
  return phrase;
};

const sayCoach = (enabled: boolean, key: string, arg?: string) => {
  if (!enabled) return;
  baseSpeak(pick(key, arg));
};

/* ============================================================
   RESPONSIVE HOOK
============================================================ */
function useScreenSize() {
  const [size, setSize] = useState({
    h: typeof window !== "undefined" ? window.innerHeight : 800
  });

  useEffect(() => {
    const update = () => setSize({ h: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

/* ============================================================
   COMPONENT
============================================================ */
const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  // Core state
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [preStart, setPreStart] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [beepsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Visuals
  const [flashGo, setFlashGo] = useState(false);
  const [pulseRing, setPulseRing] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Audio (only beep + complete)
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  // Workout data
  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const currentExercise = exercises[currentExerciseIndex];
  const currentExerciseName = currentExercise?.name ?? "";
  const breakSeconds = 20;

  // Responsive
  const { h } = useScreenSize();
  const isSmall = h < 750;

  const imgSrc =
    phase === "rest"
      ? "/images/exercises/rest.png"
      : EXERCISE_IMAGES[currentExerciseName] ?? "/images/exercises/default.png";

  /* ============================================================
     PRELOAD AUDIO (Beep + Complete)
  ============================================================ */
  useEffect(() => {
    beepRef.current = new Audio("/sounds/beep.wav");
    completeRef.current = new Audio("/sounds/complete.wav");

    const unlock = () => {
      [beepRef.current, completeRef.current].forEach((a) => {
        if (!a) return;
        a.play().catch(() => {});
        a.pause();
        a.currentTime = 0;
      });

      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  }, []);

  /* ============================================================
     MAIN TIMER
  ============================================================ */
  useEffect(() => {
    if (!running) return;
    if (phase === "idle" || phase === "complete") return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((p) => Math.max(0, p - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  /* ============================================================
     TRANSITIONS
  ============================================================ */
  useEffect(() => {
    if (!running) return;

    // Visual only 3–2–1 before transitions
    if (!preStart && remaining > 0 && remaining <= 3) {
      vibrate(50);
      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 180);

      setCountdownNumber(remaining);
      setTimeout(() => setCountdownNumber(null), 700);
    }

    if (remaining !== 0) return;

    // ---- WORK END ----
    if (phase === "work") {
      const lastExercise = currentExerciseIndex === exercises.length - 1;
      const lastSet = currentSet === totalSets - 1;

      if (lastExercise && lastSet) {
        setRunning(false);
        setPhase("complete");

        const done = completeRef.current;
        if (done) {
          done.currentTime = 0;
          done.play().catch(() => {});
        }

        vibrate([200, 100, 200]);
        sayCoach(voiceEnabled, "complete");

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        return;
      }

      // Enter rest
      vibrate([150, 80, 150]);

      const nextName =
        lastExercise ? exercises[0].name : exercises[currentExerciseIndex + 1].name;

      if (lastExercise) sayCoach(voiceEnabled, "rest");
      else sayCoach(voiceEnabled, "next", nextName);

      setPhase("rest");
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // ---- REST END → WORK ----
    if (phase === "rest") {
      setFlashGo(true);
      setTimeout(() => setFlashGo(false), 130);

      vibrate([120, 40, 120]);

      const lastExercise = currentExerciseIndex === exercises.length - 1;
      let nextIndex = lastExercise ? 0 : currentExerciseIndex + 1;

      if (lastExercise) {
        setCurrentSet((s) => s + 1);
      }
      setCurrentExerciseIndex(nextIndex);

      const nextDur = exercises[nextIndex].workSeconds;
      const nextName = exercises[nextIndex].name;

      setPhase("work");
      setPhaseTotal(nextDur);
      setRemaining(nextDur);
      setFadeKey((k) => k + 1);

      sayCoach(voiceEnabled, "go");
      return;
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
    voiceEnabled
  ]);

  /* ============================================================
     PRE-START
  ============================================================ */
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

    sayCoach(voiceEnabled, "getReady");

    let t = 0;
    const step = 1000;

    const doBeep = () => {
      if (!beepsEnabled || !beepRef.current) return;
      const clone = beepRef.current.cloneNode(true) as HTMLAudioElement;
      clone.play().catch(() => {});
      vibrate(50);
    };

    // 3
    setTimeout(() => {
      setCountdownNumber(3);
      doBeep();
    }, (t += step));

    // 2
    setTimeout(() => {
      setCountdownNumber(2);
      doBeep();
    }, (t += step));

    // 1
    setTimeout(() => {
      setCountdownNumber(1);
      doBeep();
    }, (t += step));

    // GO
    setTimeout(() => {
      setCountdownNumber(null);
      setPreStart(false);

      sayCoach(voiceEnabled, "go");
      vibrate([100, 40, 100]);

      setPhase("work");
      setRunning(true);
    }, (t += step));
  };

  /* ============================================================
     CONTROLS
  ============================================================ */
  const handlePause = () => setRunning((r) => !r);
  const handleExit = () => {
    setFullscreen(false);
    setRunning(false);
    setPreStart(false);
    setCountdownNumber(null);
  };

  /* ============================================================
     TIMER RING
  ============================================================ */
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / (phaseTotal || 1);
  const strokeDashoffset = circumference * progress;

  const totalItems = totalSets * exercises.length;
  const currentProgress = currentSet * exercises.length + currentExerciseIndex;
  const progressPercent = (currentProgress / totalItems) * 100;

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {fullscreen && flashGo && <div className="go-flash" />}

      {/* START SCREEN */}
      {!fullscreen && (
        <div className="flex flex-col items-center justify-center py-10 text-white gap-4">
          <div className="text-xl font-bold">Empire VC Workout Hub</div>

          <button
            onClick={handleStart}
            className="px-6 py-3 bg-amber-400 text-slate-900 rounded-xl font-bold shadow hover:bg-amber-300"
          >
            Start Workout
          </button>
        </div>
      )}

      {/* FULLSCREEN WORKOUT */}
      {fullscreen && (
        <div
          className="absolute inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto"
          style={{
            paddingBottom: `calc(env(safe-area-inset-bottom) + ${
              isSmall ? "14px" : "28px"
            })`
          }}
        >
          {showConfetti && <div className="confetti" />}

          {/* HEADER */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
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

            {/* MINI PROGRESS */}
            <div className="w-full h-[5px] mt-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* SETTINGS */}
            {showSettings && (
              <div className="mt-3 flex gap-4 text-xs text-slate-200">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={voiceEnabled}
                    onChange={(e) => setVoiceEnabled(e.target.checked)}
                    className="accent-amber-400"
                  />
                  Coach voice
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={beepsEnabled}
                    className="accent-amber-400"
                  />
                  Beeps
                </label>
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div
            className="flex flex-col items-center px-4"
            style={{
              paddingTop: isSmall ? "10px" : "16px",
              gap: isSmall ? "12px" : "18px"
            }}
          >
            {/* IMAGE */}
            <div
              className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-700 bg-slate-900"
              style={{
                maxHeight: isSmall ? "26vh" : "34vh"
              }}
            >
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentExerciseName}
                className="fade-image w-full h-full object-contain"
              />
            </div>

            {/* TITLE */}
            <div className="text-3xl font-bold text-center">
              {phase === "complete" ? "Workout Complete!" : currentExerciseName}
            </div>

            {/* TIMER RING */}
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center mt-1 mb-1">
              {!preStart && (
                <div
                  className={`relative w-full h-full ${
                    pulseRing ? "timer-pulse" : ""
                  }`}
                >
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
                      style={{ transition: "stroke-dashoffset 0.35s linear" }}
                    />
                  </svg>
                </div>
              )}

              {/* Countdown */}
              {countdownNumber !== null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-7xl font-extrabold text-amber-400">
                    {countdownNumber}
                  </div>
                </div>
              )}

              {/* Timer number */}
              {countdownNumber === null && !preStart && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-mono">{remaining}</div>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            <div
              style={{
                marginTop: isSmall ? "8px" : "14px",
                marginBottom: `calc(env(safe-area-inset-bottom) + ${
                  isSmall ? "14px" : "24px"
                })`
              }}
            >
              <button
                onClick={handlePause}
                className="px-10 py-3 rounded-full border border-amber-300 text-base font-semibold hover:bg-amber-300/10"
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
