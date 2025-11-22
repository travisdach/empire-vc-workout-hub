// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from "react";
import type { WorkoutDay } from "../data/workouts";
import { EXERCISE_IMAGES } from "../data/exerciseImages";

type Phase = "idle" | "work" | "rest" | "complete";

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

/* ============================================================
   HAPTIC
============================================================ */
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

/* ============================================================
   FEMALE-ONLY VOICE PICKER + SPEAK
============================================================ */
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();

  const preferred = voices.find((v) =>
    /(samantha|olivia|serena|karen|google uk english female|google us english|female|woman)/i.test(
      v.name + " " + v.voiceURI
    )
  );

  return (
    preferred ||
    voices.find((v) => /female|woman/i.test(v.name + " " + v.voiceURI)) ||
    null
  );
}

function speak(text: string) {
  if (typeof window === "undefined") return;

  const utter = new SpeechSynthesisUtterance(
    text.replace(/,/g, ", ").replace(/\./g, ". ")
  );

  const v = pickFemaleVoice();
  if (v) utter.voice = v;

  utter.rate = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* ============================================================
   SIMPLE COACH PHRASES (for get ready + complete)
============================================================ */
const coachPhrases = {
  getReady: [
    "Get ready. Focus in.",
    "Get set. Deep breath.",
    "Dial in. Here we go.",
    "Stay loose. Starting soon."
  ],
  complete: [
    "Amazing work! Workout complete!",
    "Great job! That’s a wrap!",
    "You crushed it! Workout finished!",
    "Workout complete. Be proud!"
  ]
};

function randomGetReady() {
  const list = coachPhrases.getReady;
  return list[Math.floor(Math.random() * list.length)];
}

function randomComplete() {
  const list = coachPhrases.complete;
  return list[Math.floor(Math.random() * list.length)];
}

/* ============================================================
   iPHONE-SAFE WEB AUDIO BEEP (doesn't kill Apple Music)
============================================================ */
function useBeep() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  return () => {
    try {
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 880; // crisp beep
      gain.gain.value = 0.18; // gentle volume

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      }, 120);
    } catch (e) {
      console.log("beep error", e);
    }
  };
}

/* ============================================================
   WAKE LOCK (reduce dimming)
============================================================ */
function useWakeLock(active: boolean) {
  useEffect(() => {
    let lock: any = null;

    const requestLock = async () => {
      try {
        // @ts-ignore
        if ("wakeLock" in navigator && active) {
          // @ts-ignore
          lock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.log("WakeLock error:", err);
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        requestLock();
      } else if (lock) {
        lock.release?.().catch(() => {});
        lock = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (lock) {
        lock.release?.().catch(() => {});
        lock = null;
      }
    };
  }, [active]);
}

/* ============================================================
   COMPONENT
============================================================ */
const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fullscreen, setFullscreen] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [preStart, setPreStart] = useState(false);

  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [fadeKey, setFadeKey] = useState(0);
  const [pulseRing, setPulseRing] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;
  const breakSeconds = 20;

  const currentExercise = exercises[currentExerciseIndex];
  const currentName = currentExercise?.name ?? "";

  // Next real exercise name (for rest screen + voice)
  const nextExerciseName =
    exercises.length === 0
      ? ""
      : currentExerciseIndex + 1 < exercises.length
      ? exercises[currentExerciseIndex + 1].name
      : exercises[0].name;

  // WebAudio beep
  const playBeep = useBeep();

  // prevent dim while fullscreen
  useWakeLock(fullscreen && running);

  const imgSrc =
    phase === "rest"
      ? "/images/exercises/rest.png"
      : EXERCISE_IMAGES[currentName] ?? "/images/exercises/default.png";

  /* ============================================================
     TIMER
  ============================================================ */
  useEffect(() => {
    if (!running) return;
    if (phase === "idle" || phase === "complete") return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  /* ============================================================
     TRANSITIONS (REST + BEGIN)
  ============================================================ */
  useEffect(() => {
    if (!running) return;

    // 3–2–1 visual pulse near phase end
    if (!preStart && remaining > 0 && remaining <= 3) {
      vibrate(40);
      playBeep();
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

      // Workout done
      if (lastExercise && lastSet) {
        setRunning(false);
        setPhase("complete");
        vibrate([200, 100, 200]);
        if (voiceEnabled) speak(randomComplete());
        return;
      }

      // Enter REST
      vibrate([150, 80, 150]);

      // Voice: "Rest. Next: ___"
      if (voiceEnabled) {
        const upNext =
          currentExerciseIndex === exercises.length - 1
            ? exercises[0].name
            : exercises[currentExerciseIndex + 1].name;
        speak(`Rest. Next: ${upNext}.`);
      }

      setPhase("rest");
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // ---- REST END → WORK ----
    if (phase === "rest") {
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

      // Voice: "Begin {exercise}" exactly when timer starts
      if (voiceEnabled) speak(`Begin ${nextName}.`);

      return;
    }
  }, [
    running,
    preStart,
    remaining,
    phase,
    currentExerciseIndex,
    currentSet,
    exercises,
    totalSets,
    playBeep,
    voiceEnabled
  ]);

  /* ============================================================
     PRE-START 3–2–1
  ============================================================ */
  const handleStart = () => {
    if (!exercises.length) return;

    const firstDur = exercises[0].workSeconds;

    setCurrentExerciseIndex(0);
    setCurrentSet(0);
    setPhase("idle");
    setPhaseTotal(firstDur);
    setRemaining(firstDur);
    setFullscreen(true);
    setPreStart(true);
    setRunning(false);

    if (voiceEnabled) speak(randomGetReady());

    let t = 0;
    const step = 1000;

    setTimeout(() => {
      setCountdownNumber(3);
      playBeep();
      vibrate(40);
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(2);
      playBeep();
      vibrate(40);
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(1);
      playBeep();
      vibrate(40);
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(null);
      setPreStart(false);
      setPhase("work");
      setRunning(true);
      vibrate([100, 40, 100]);

      if (voiceEnabled) speak(`Begin ${exercises[0].name}.`);
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
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
  };

  /* ============================================================
     RING + PROGRESS
  ============================================================ */
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / (phaseTotal || 1);
  const strokeDashoffset = circumference * progress;

  const totalItems = totalSets * exercises.length;
  const currentProgress = currentSet * exercises.length + currentExerciseIndex;
  const progressPercent =
    totalItems > 0 ? (currentProgress / totalItems) * 100 : 0;

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {/* START SCREEN */}
      {!fullscreen && (
        <div className="flex flex-col items-center justify-center py-12 text-white gap-4">
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
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-y-auto pb-8">
          {/* HEADER */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Set {currentSet + 1} / {totalSets}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings((s) => !s)}
                  className="px-3 py-1 rounded-full border border-slate-600 text-xs"
                >
                  Settings
                </button>
                <button
                  onClick={handleExit}
                  className="px-3 py-1 rounded-full border border-slate-600 text-xs"
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
                <span className="flex items-center gap-2 opacity-60">
                  <input type="checkbox" checked readOnly /> Beeps
                </span>
              </div>
            )}
          </div>

          {/* IMAGE */}
          <div className="w-full flex justify-center px-4 mt-3">
            <div className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentName}
                className="w-full h-full object-contain rounded-3xl"
              />
            </div>
          </div>

          {/* TITLE */}
          <div className="text-3xl font-bold text-center mt-3">
            {phase === "complete"
              ? "Workout Complete!"
              : phase === "rest"
              ? `Next: ${nextExerciseName}`
              : currentName}
          </div>

          {/* TIMER RING (BIGGER ON PHONES) */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 mx-auto mt-2 mb-3 flex items-center justify-center">
            {!preStart && (
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="rgba(148,163,184,0.3)"
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
            )}

            {/* Countdown or Timer Number */}
            {countdownNumber !== null && (
              <div className="absolute inset-0 flex items-center justify-center text-7xl font-extrabold text-amber-400">
                {countdownNumber}
              </div>
            )}

            {countdownNumber === null && (
              <div className="absolute inset-0 flex items-center justify-center text-5xl font-mono">
                {remaining}
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="flex justify-center mt-2 mb-8">
            <button
              onClick={handlePause}
              className="px-10 py-3 rounded-full border border-amber-300 text-base font-semibold hover:bg-amber-300/10"
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GuidedWorkoutTimer;