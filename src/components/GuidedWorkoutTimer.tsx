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
  if (navigator?.vibrate) navigator.vibrate(pattern);
}

/* ============================================================
   FEMALE-ONLY VOICE PICKER + Natural cadence
============================================================ */
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;

  const voices = window.speechSynthesis.getVoices();

  const femaleKeywords = /(female|woman|samantha|karen|olivia|serena|google uk english female|google us english)/i;

  return (
    voices.find((v) => femaleKeywords.test(v.name + " " + v.voiceURI)) ||
    voices.find((v) => /female|woman/i.test(v.name)) ||
    null
  );
}

function speak(text: string) {
  if (typeof window === "undefined") return;

  const utter = new SpeechSynthesisUtterance(text);

  const v = pickFemaleVoice();
  if (v) utter.voice = v;

  // Reduce robotic effect
  utter.rate = 0.92;
  utter.pitch = 1.05;
  utter.volume = 1;

  utter.text = text.replace(/,/g, ", ").replace(/\./g, ". ");

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

/* ============================================================
   COACH PHRASES
============================================================ */
const coachPhrases = {
  getReady: [
    "Get ready. Focus in.",
    "Get set. Deep breath.",
    "Dial in. Here we go.",
    "Stay loose. Starting soon.",
    "Get mentally ready."
  ],
  go: [
    "Go! Push it!",
    "Go! Stay strong!",
    "Let's go! Your best pace!",
    "Go! You’ve got this!",
    "Go! Power through it!"
  ],
  next: [
    "Next up: {x}. Stay locked in.",
    "Coming up: {x}. Deep breath.",
    "Get ready for {x}. Crush this one.",
    "Prepare for {x}. Keep the momentum.",
    "Next exercise: {x}. Stay focused."
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

function randomPhrase(key: keyof typeof coachPhrases, arg?: string): string {
  const list = coachPhrases[key];
  let p = list[Math.floor(Math.random() * list.length)];
  if (arg) p = p.replace("{x}", arg);
  return p;
}

/* ============================================================
   iPhone-SAFE WEB AUDIO BEEP (does NOT interrupt Apple Music)
============================================================ */
function useBeep() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  return () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 880; // Crisp clean beep
      gain.gain.value = 0.18; // Quiet enough not to kill music

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      }, 120);
    } catch {}
  };
}

/* ============================================================
   WAKE LOCK (prevents screen dimming)
============================================================ */
function useWakeLock(active: boolean) {
  useEffect(() => {
    let lock: any = null;

    const requestLock = async () => {
      try {
        // @ts-ignore
        lock = await navigator.wakeLock?.request("screen");
      } catch {}
    };

    if (active) requestLock();

    return () => {
      try {
        lock?.release?.();
      } catch {}
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

  const nextName =
    currentExerciseIndex + 1 < exercises.length
      ? exercises[currentExerciseIndex + 1].name
      : "Next Set";

  // iPhone-safe beep
  const playBeep = useBeep();

  // prevent screen dim
  useWakeLock(fullscreen);

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
     TRANSITIONS
  ============================================================ */
  useEffect(() => {
    if (!running) return;

    // Pre-transition 3-2-1 visual pulse
    if (!preStart && remaining > 0 && remaining <= 3) {
      vibrate(40);
      setPulseRing(true);
      setTimeout(() => setPulseRing(false), 180);

      setCountdownNumber(remaining);
      setTimeout(() => setCountdownNumber(null), 700);
    }

    if (remaining !== 0) return;

    // WORK END
    if (phase === "work") {
      const lastExercise = currentExerciseIndex === exercises.length - 1;
      const lastSet = currentSet === totalSets - 1;

      if (lastExercise && lastSet) {
        setRunning(false);
        setPhase("complete");

        vibrate([200, 100, 200]);
        if (voiceEnabled) speak(randomPhrase("complete"));

        return;
      }

      vibrate([150, 80, 150]);

      if (lastExercise) {
        if (voiceEnabled) speak(randomPhrase("rest"));
      } else {
        if (voiceEnabled) speak(randomPhrase("next", nextName));
      }

      setPhase("rest");
      setPhaseTotal(breakSeconds);
      setRemaining(breakSeconds);
      setFadeKey((k) => k + 1);
      return;
    }

    // REST END → WORK
    if (phase === "rest") {
      vibrate([120, 40, 120]);

      const lastExercise = currentExerciseIndex === exercises.length - 1;
      let nextIndex = lastExercise ? 0 : currentExerciseIndex + 1;

      if (lastExercise) setCurrentSet((s) => s + 1);

      setCurrentExerciseIndex(nextIndex);
      const nextDur = exercises[nextIndex].workSeconds;

      setPhase("work");
      setPhaseTotal(nextDur);
      setRemaining(nextDur);
      setFadeKey((k) => k + 1);

      if (voiceEnabled) speak(randomPhrase("go"));
      return;
    }
  }, [remaining, running, preStart, phase, currentExerciseIndex]);

  /* ============================================================
     PRE-START 3–2–1
  ============================================================ */
  const handleStart = () => {
    const first = exercises[0].workSeconds;
    setCurrentExerciseIndex(0);
    setCurrentSet(0);
    setPhase("idle");
    setRemaining(first);
    setPhaseTotal(first);
    setFullscreen(true);
    setPreStart(true);
    setRunning(false);

    if (voiceEnabled) speak(randomPhrase("getReady"));

    let t = 0;
    const step = 1000;

    setTimeout(() => {
      setCountdownNumber(3);
      playBeep();
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(2);
      playBeep();
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(1);
      playBeep();
    }, (t += step));

    setTimeout(() => {
      setCountdownNumber(null);
      setPreStart(false);
      setPhase("work");
      setRunning(true);
      vibrate([100, 40, 100]);

      if (voiceEnabled) speak(randomPhrase("go"));
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
     RING VALUES
  ============================================================ */
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (remaining / (phaseTotal || 1));

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
                <label className="flex items-center gap-2 opacity-50">
                  <input type="checkbox" checked={true} disabled />
                  Beeps (Always On)
                </label>
              </div>
            )}
          </div>

          {/* IMAGE */}
          <div className="w-full flex justify-center px-4 mt-3">
            <div className="w-full max-w-md rounded-3xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                key={fadeKey}
                src={imgSrc}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* TITLE */}
          <div className="text-3xl font-bold text-center mt-3">
            {phase === "rest"
              ? `Rest – Next: ${nextName}`
              : phase === "complete"
              ? "Workout Complete!"
              : currentName}
          </div>

          {/* TIMER RING */}
          <div className="relative w-44 h-44 mx-auto mt-2 mb-3 flex items-center justify-center">
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