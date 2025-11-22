// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from "react";
import type { WorkoutDay } from "../data/workouts";
import { EXERCISE_IMAGES } from "../data/exerciseImages";

type Phase = "idle" | "work" | "rest" | "complete";

interface GuidedWorkoutTimerProps {
  workout: WorkoutDay;
}

// ======================
// HAPTIC helper
// ======================
function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

// ======================
// COACH PHRASES
// ======================
const coachPhrases = {
  go: [
    "Go! Push it!",
    "Go! Stay strong!",
    "Let's go! Give me your best!",
    "Move it! You're doing great!",
    "Go! Keep that energy up!"
  ],
  next: [
    "Next up: {x}. You've got this.",
    "Coming up: {x}. Stay with me.",
    "Get ready for {x}. Deep breath.",
    "Next exercise: {x}. Let's crush it.",
    "Prepare for {x}. Keep pushing."
  ],
  rest: [
    "Rest. Breathe.",
    "Rest time. Shake it out.",
    "Rest. You're doing awesome.",
    "Catch your breath.",
    "Rest up. You're doing great!"
  ],
  complete: [
    "Amazing work! Workout complete!",
    "Great job! That’s a wrap!",
    "You crushed it! Workout finished!",
    "Done! Awesome effort today!",
    "Workout complete. You should be proud!"
  ]
};

// ======================
// SPEECH helper (Natural cadence)
// ======================
function baseSpeak(text: string) {
  if (typeof window === "undefined") return;

  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const preferred = voices.find((v) =>
    /(samantha|google us english|google uk english female|olivia|allison|serena|karen|female|woman)/i
      .test(v.name + " " + v.voiceURI)
  );

  if (preferred) utter.voice = preferred;

  // Natural talk
  utter.pitch = 1.07;
  utter.rate = 0.92;
  utter.volume = 1;

  // Add natural pauses
  utter.text = text.replace(/,/g, ", ").replace(/\./g, ". ");

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// ======================
// SAY helper using phrase variations
// ======================
const sayPhrase = (
  phraseKey: string,
  arg?: string,
  enabled?: boolean
) => {
  if (!enabled) return;

  let phrase = phraseKey;

  if (coachPhrases[phraseKey as keyof typeof coachPhrases]) {
    const list = coachPhrases[phraseKey as keyof typeof coachPhrases];
    phrase = list[Math.floor(Math.random() * list.length)];
  }

  if (arg) phrase = phrase.replace("{x}", arg);

  baseSpeak(phrase);
};

const GuidedWorkoutTimer: React.FC<GuidedWorkoutTimerProps> = ({ workout }) => {
  // ======================
  // STATE
  // ======================
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [phaseTotal, setPhaseTotal] = useState(1);
  const [breakSeconds] = useState<10 | 20 | 30>(20);
  const [fullscreen, setFullscreen] = useState(false);

  // Countdown before the first exercise
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

  // AUDIO (clean beeps only)
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const completeRef = useRef<HTMLAudioElement | null>(null);

  const totalSets = workout.repeatSets;
  const exercises = workout.exercises;

  const currentExercise = exercises[currentExerciseIndex];
  const currentExerciseName = currentExercise?.name ?? "";

  const imgSrc =
    phase === "rest"
      ? "/images/exercises/rest.png"
      : EXERCISE_IMAGES[currentExerciseName] ??
        "/images/exercises/default.png";

  const say = (key: string, arg?: string) =>
    sayPhrase(key, arg, voiceEnabled);

  // ======================
  // PRELOAD AUDIO
  // ======================
  useEffect(() => {
    beepRef.current = new Audio("/sounds/beep.wav");
    completeRef.current = new Audio("/sounds/complete.wav");

    const unlock = () => {
      const arr = [beepRef.current, completeRef.current];
      arr.forEach((a) => {
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

  // ======================
  // MAIN TIMER
  // ======================
  useEffect(() => {
    if (!running) return;
    if (phase === "idle" || phase === "complete") return;
    if (remaining <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, remaining]);

  // ======================
  // TRANSITIONS
  // ======================
  useEffect(() => {
    if (!running) return;

    // ---- VISUAL ONLY countdown for phase transitions ----
    if (!preStart && remaining > 0 && remaining <= 3) {
      vibrate(50);

      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 200);

      setCountdownNumber(remaining);
      setTimeout(() => setCountdownNumber(null), 800);
    }

    if (remaining !== 0) return;

    // ========= WORK → REST or COMPLETE =========
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

        vibrate([200, 100, 200, 100, 300]);
        say("complete");

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        return;
      }

      // Enter rest
      vibrate([150, 80, 150]);

      const nextName =
        lastExercise ? exercises[0].name : exercises[currentExerciseIndex + 1].name;

      if (lastExercise) say("rest");
      else say("next", nextName);

      setPhase("rest");
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // ========= REST → WORK =========
    if (phase === "rest") {
      setFlashGo(true);
      setTimeout(() => setFlashGo(false), 130);

      vibrate([120, 40, 120]);

      const lastExercise = currentExerciseIndex === exercises.length - 1;

      let nextIndex = currentExerciseIndex;
      if (!lastExercise) {
        nextIndex = currentExerciseIndex + 1;
        setCurrentExerciseIndex(nextIndex);
      } else {
        nextIndex = 0;
        setCurrentExerciseIndex(0);
        setCurrentSet((s) => s + 1);
      }

      const nextDur = exercises[nextIndex].workSeconds;
      const nextName = exercises[nextIndex].name;

      setPhase("work");
      setPhaseTotal(nextDur);
      setRemaining(nextDur);
      setFadeKey((k) => k + 1);

      say("go");
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
    breakSeconds,
    say
  ]);

  // ======================
  // PRE-START
  // ======================
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

    say("next", exercises[0].name);

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

      say("go");

      vibrate([100, 40, 100]);

      setPhase("work");
      setRunning(true);
    }, (t += step));
  };

  // ======================
  // CONTROLS
  // ======================
  const handlePause = () => setRunning((r) => !r);
  const handleExit = () => {
    setFullscreen(false);
    setRunning(false);
    setPreStart(false);
    setCountdownNumber(null);
  };

  // ======================
  // TIMER RING VALUES
  // ======================
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / (phaseTotal || 1);
  const strokeDashoffset = circumference * progress;

  // ======================
  // MINI PROGRESS BAR
  // ======================
  const totalItems = totalSets * exercises.length;
  const currentProgress = currentSet * exercises.length + currentExerciseIndex;
  const progressPercent = (currentProgress / totalItems) * 100;

  // ======================
  // RENDER
  // ======================
  return (
    <>
      {/* FLASH GO */}
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

      {/* FULLSCREEN MODE */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-y-auto pb-6">
          {/* CONFETTI */}
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
                    onChange={(e) => setBeepsEnabled(e.target.checked)}
                    className="accent-amber-400"
                  />
                  Beeps
                </label>
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col items-center px-4 pt-4 gap-4">

            {/* IMAGE */}
            <div className="w-full max-w-md max-h-[38vh] rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt={currentExerciseName}
                className="fade-image w-full h-full object-contain"
              />
            </div>

            {/* TITLE */}
            <div className="text-3xl font-bold text-center">
              {phase === "complete" ? "Workout Complete!" : currentExercise

