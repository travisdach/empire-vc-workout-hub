// src/components/GuidedWorkoutTimer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { WorkoutDay } from '../data/workouts';
import { EXERCISE_IMAGES } from '../data/exerciseImages'; // your images map

interface Props {
  workout: WorkoutDay;
}

export default function GuidedWorkoutTimer({ workout }: Props) {
  // -------------------------------
  // STATE
  // -------------------------------
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(workout.exercises[0].workSeconds);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [flashGo, setFlashGo] = useState(false);
  const [activeImage, setActiveImage] = useState(0); // for crossfade

  const intervalRef = useRef<number | null>(null);

  // -------------------------------
  // NATURAL VOICE (Improved)
  // -------------------------------
  const speak = (text: string) => {
    const utter = new SpeechSynthesisUtterance(text);

    // Try to choose a natural-sounding female voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('google') ||
        v.name.toLowerCase().includes('natural')
    );

    if (preferred) utter.voice = preferred;
    utter.pitch = 1.03;  // slightly smoother
    utter.rate = 0.93;   // slower and more natural
    utter.volume = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  // -------------------------------
  // TICK HANDLER
  // -------------------------------
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition moment
        handleTransition();
        return prev;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, currentIndex, isResting]);

  const handleTransition = () => {
    // Flash "GO" but **no sound**
    setFlashGo(true);
    setTimeout(() => setFlashGo(false), 450);

    if (!isResting) {
      // Move to rest or next exercise
      if (workout.defaultRestSeconds) {
        setIsResting(true);
        setSecondsLeft(workout.defaultRestSeconds);
        speak(`Rest`);
      } else {
        goToNextExercise();
      }
    } else {
      // Coming out of rest → next exercise
      goToNextExercise();
    }
  };

  const goToNextExercise = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= workout.exercises.length) {
      speak("Workout complete!");
      setIsPaused(true);
      return;
    }

    const nextExercise = workout.exercises[nextIndex];
    setCurrentIndex(nextIndex);
    setSecondsLeft(nextExercise.workSeconds);
    setIsResting(false);

    speak(`Next: ${nextExercise.name}`);

    // Crossfade image swap
    setActiveImage((prev) => (prev === 0 ? 1 : 0));
  };

  // -------------------------------
  // UI HELPERS
  // -------------------------------
  const currentExercise = workout.exercises[currentIndex];
  const imgKey = isResting ? 'rest' : currentExercise.name;
  const imageSrc = EXERCISE_IMAGES[imgKey] ?? EXERCISE_IMAGES['default'];

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="relative flex flex-col h-[100vh] px-4 pt-4 pb-24 text-white">

      {/* GO FLASH */}
      {flashGo && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/80 text-black text-7xl font-extrabold animate-pulse">
          GO
        </div>
      )}

      {/* Crossfade Image */}
      <div className="flex-1 flex items-center justify-center">
        <img
          key={activeImage}
          src={imageSrc}
          className="w-64 h-64 object-contain transition-opacity duration-500 opacity-100"
          alt=""
        />
      </div>

      {/* Timer */}
      <div className="text-center mt-2 mb-4">
        <div className="text-6xl font-bold tracking-tight">
          {secondsLeft}
        </div>
        <div className="text-xl opacity-70 mt-1">
          {isResting ? "Rest" : currentExercise.name}
        </div>
      </div>

      {/* ----- FIXED BOTTOM BUTTON (Rounded Pill) ----- */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
        <button
          onClick={() => setIsPaused((p) => !p)}
          className="px-8 py-3 rounded-full bg-white text-black text-lg font-semibold shadow-xl active:scale-95 transition-transform"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
}
