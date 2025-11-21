// src/data/exerciseImages.ts

// For now, everything uses the same placeholder image.
// Put your illustration at: public/exercises/squat.png
const DEFAULT_EXERCISE_IMAGE = '/exercises/squat.png';

// Later we can map specific exercise names to unique images.
export function getExerciseImage(exerciseName: string): string {
  // Example of future mapping:
  // const key = exerciseName.toLowerCase();
  // if (key.includes('squat')) return '/exercises/squat.png';
  // if (key.includes('plank')) return '/exercises/plank.png';
  // ...

  return DEFAULT_EXERCISE_IMAGE;
}
