export type MonthKey = 'december' | 'january' | 'february' | 'march' | 'april' | 'may';
export type DayKey = 'day1' | 'day2' | 'day3' | 'day4';

export interface Exercise {
  name: string;
  workSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  month: MonthKey;
  dayKey: DayKey;
  title: string;
  focus: string;
  warmupSeconds: number;
  repeatSets: number;
  defaultRestSeconds?: number;
  notes?: string;
  exercises: Exercise[];
}

const s = (n: number) => n;

export const WORKOUT_PROGRAM: Record<MonthKey, Record<DayKey, WorkoutDay>> = {
  december: {
    day1: {
      id: 'dec_day1',
      month: 'december',
      dayKey: 'day1',
      title: 'Lower Body Foundation',
      focus: 'Technique, joint stability, basic lower body strength.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      notes: 'Optional: add resistance band for glute bridges or hold light dumbbells.',
      exercises: [
        { name: 'Squats', workSeconds: s(40) },
        { name: 'Glute Bridges', workSeconds: s(40) },
        { name: 'Reverse Lunges', workSeconds: s(40) },
        { name: 'Calf Raises', workSeconds: s(40) },
        { name: 'Wall Sit', workSeconds: s(40) }
      ]
    },
    day2: {
      id: 'dec_day2',
      month: 'december',
      dayKey: 'day2',
      title: 'Core & Stability',
      focus: 'Core control and trunk stability.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Dead Bug', workSeconds: s(40) },
        { name: 'Side Plank (Right)', workSeconds: s(30) },
        { name: 'Side Plank (Left)', workSeconds: s(30) },
        { name: 'Bird Dog', workSeconds: s(40) },
        { name: 'Plank Shoulder Taps', workSeconds: s(40) }
      ]
    },
    day3: {
      id: 'dec_day3',
      month: 'december',
      dayKey: 'day3',
      title: 'Speed & Agility (Intro)',
      focus: 'Intro to quick feet and light conditioning.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Fast Feet in Place', workSeconds: s(30) },
        { name: 'Lateral Shuffles', workSeconds: s(30) },
        { name: 'Skater Hops', workSeconds: s(30) },
        { name: 'High Knees', workSeconds: s(30) },
        { name: 'Jump Rope (Imaginary)', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'dec_day4',
      month: 'december',
      dayKey: 'day4',
      title: 'Full Body Strength',
      focus: 'Basic strength for upper, lower, and core.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Push-Ups', workSeconds: s(40) },
        { name: 'Squat to Calf Raise', workSeconds: s(40) },
        { name: 'Superman Hold', workSeconds: s(40) },
        { name: 'Hip Hinge (Good-Morning)', workSeconds: s(40) },
        { name: 'Plank', workSeconds: s(40) }
      ]
    }
  },

  january: {
    day1: {
      id: 'jan_day1',
      month: 'january',
      dayKey: 'day1',
      title: 'Vertical Strength',
      focus: 'Stronger legs to support vertical jump.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      notes: 'Optional: add light dumbbells for split squats.',
      exercises: [
        { name: 'Squat Pulses', workSeconds: s(30) },
        { name: 'Split Squats (Right)', workSeconds: s(30) },
        { name: 'Split Squats (Left)', workSeconds: s(30) },
        { name: 'Glute Bridge March', workSeconds: s(40) },
        { name: 'Calf Raises (Slow)', workSeconds: s(40) }
      ]
    },
    day2: {
      id: 'jan_day2',
      month: 'january',
      dayKey: 'day2',
      title: 'Core Strength',
      focus: 'Core strength for stability in approach and landing.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      notes: 'Optional: add weight to Russian twists.',
      exercises: [
        { name: 'Plank', workSeconds: s(45) },
        { name: 'Hollow Hold', workSeconds: s(25) },
        { name: 'Russian Twists', workSeconds: s(40) },
        { name: 'Side Plank Hip Lifts (Right)', workSeconds: s(30) },
        { name: 'Side Plank Hip Lifts (Left)', workSeconds: s(30) }
      ]
    },
    day3: {
      id: 'jan_day3',
      month: 'january',
      dayKey: 'day3',
      title: 'Agility & Quickness',
      focus: 'Quick feet and reactive movement.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Quick Toe Taps', workSeconds: s(30) },
        { name: 'Lateral Line Hops', workSeconds: s(30) },
        { name: 'Forward/Back Line Hops', workSeconds: s(30) },
        { name: 'Skater Bounds', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'jan_day4',
      month: 'january',
      dayKey: 'day4',
      title: 'Full Body Strength',
      focus: 'Full body strength for powerful movements.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Push-Ups', workSeconds: s(40) },
        { name: 'Squat → Knee Drive', workSeconds: s(40) },
        { name: 'Reverse Snow Angels', workSeconds: s(40) },
        { name: 'Single-Leg RDL (Right, no weight)', workSeconds: s(30) },
        { name: 'Single-Leg RDL (Left, no weight)', workSeconds: s(30) },
        { name: 'Mountain Climbers', workSeconds: s(40) }
      ]
    }
  },

  february: {
    day1: {
      id: 'feb_day1',
      month: 'february',
      dayKey: 'day1',
      title: 'Jump Technique',
      focus: 'Introduce light plyometrics with safe landings.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Squat Jumps', workSeconds: s(20) },
        { name: 'Step-Back Lunge (No Jump)', workSeconds: s(30) },
        { name: 'Calf Pop Jumps', workSeconds: s(20) },
        { name: 'Broad Jump (Soft Landing)', workSeconds: s(20) },
        { name: 'Wall Sit', workSeconds: s(40) }
      ]
    },
    day2: {
      id: 'feb_day2',
      month: 'february',
      dayKey: 'day2',
      title: 'Core & Rotation',
      focus: 'Rotational strength for hitting and serving.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Plank Walkout', workSeconds: s(30) },
        { name: 'Bicycle Crunch', workSeconds: s(40) },
        { name: 'Side Plank Reach-Through (Right)', workSeconds: s(30) },
        { name: 'Side Plank Reach-Through (Left)', workSeconds: s(30) },
        { name: 'Dead Bug', workSeconds: s(40) }
      ]
    },
    day3: {
      id: 'feb_day3',
      month: 'february',
      dayKey: 'day3',
      title: 'Speed & Explosive Footwork',
      focus: 'Quick reactions and explosive first steps.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Fast Feet → Drop', workSeconds: s(30) },
        { name: 'Lateral Shuffle → 2-Step Sprint (In Place)', workSeconds: s(30) },
        { name: 'Tuck Jumps (Low Height)', workSeconds: s(15) },
        { name: 'High Knees', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'feb_day4',
      month: 'february',
      dayKey: 'day4',
      title: 'Strength & Balance',
      focus: 'Single-leg strength and balance.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Push-Ups to Shoulder Tap', workSeconds: s(30) },
        { name: 'Single-Leg Squat to Chair (Left)', workSeconds: s(30) },
        { name: 'Single-Leg Squat to Chair (Right)', workSeconds: s(30) },
        { name: 'Superman Holds', workSeconds: s(40) },
        { name: 'Side Plank', workSeconds: s(40) }
      ]
    }
  },

  march: {
    day1: {
      id: 'mar_day1',
      month: 'march',
      dayKey: 'day1',
      title: 'Vertical Power',
      focus: 'Increase jump height and power.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      notes: 'Optional: light weights for squats only, not jumps.',
      exercises: [
        { name: 'Jump Squats', workSeconds: s(25) },
        { name: 'Lunge Jumps (Alternating)', workSeconds: s(20) },
        { name: 'Calf Jumps', workSeconds: s(20) },
        { name: 'Broad Jump + Backpedal', workSeconds: s(25) }
      ]
    },
    day2: {
      id: 'mar_day2',
      month: 'march',
      dayKey: 'day2',
      title: 'Core + Strength',
      focus: 'Core strength to support explosive movements.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Plank with Knee Drives', workSeconds: s(40) },
        { name: 'V-Ups', workSeconds: s(30) },
        { name: 'Side Plank Pulses (Right)', workSeconds: s(30) },
        { name: 'Side Plank Pulses (Left)', workSeconds: s(30) },
        { name: 'Bird Dog Hold', workSeconds: s(40) }
      ]
    },
    day3: {
      id: 'mar_day3',
      month: 'march',
      dayKey: 'day3',
      title: 'Agility + Footwork Patterns',
      focus: 'Court-like lateral and diagonal movement.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: '5-5-5 Shuffle (R-L-R)', workSeconds: s(30) },
        { name: 'Diagonal Bounds', workSeconds: s(30) },
        { name: 'Quick Feet Box Pattern', workSeconds: s(30) },
        { name: 'High Knees into Sprint on Spot', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'mar_day4',
      month: 'march',
      dayKey: 'day4',
      title: 'Full Body Strength',
      focus: 'Total body strength for match load.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Push-Ups', workSeconds: s(40) },
        { name: 'Sumo Squats', workSeconds: s(40) },
        { name: 'Superman Snow Angels', workSeconds: s(40) },
        { name: 'Plank', workSeconds: s(45) }
      ]
    }
  },

  april: {
    day1: {
      id: 'apr_day1',
      month: 'april',
      dayKey: 'day1',
      title: 'Advanced Jump Work',
      focus: 'Peak jump performance before provincials.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Box Jumps / Vertical Touches', workSeconds: s(20) },
        { name: 'Alternating Lunge Jumps', workSeconds: s(20) },
        { name: 'Triple Broad Jump → Jog Back', workSeconds: s(25) },
        { name: 'Calf Raise Holds', workSeconds: s(30) }
      ]
    },
    day2: {
      id: 'apr_day2',
      month: 'april',
      dayKey: 'day2',
      title: 'Core & Abs Endurance',
      focus: 'Core endurance to handle long tournaments.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Plank', workSeconds: s(60) },
        { name: 'Flutter Kicks', workSeconds: s(40) },
        { name: 'Hollow Rock', workSeconds: s(20) },
        { name: 'Side Plank with Reach (Right)', workSeconds: s(30) },
        { name: 'Side Plank with Reach (Left)', workSeconds: s(30) }
      ]
    },
    day3: {
      id: 'apr_day3',
      month: 'april',
      dayKey: 'day3',
      title: 'Game-Speed Agility',
      focus: 'Game-speed shuffles, drops, and landings.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Shuffle → Drop → Sprint (In Place)', workSeconds: s(30) },
        { name: 'Skaters', workSeconds: s(30) },
        { name: 'Lateral Line Hops', workSeconds: s(30) },
        { name: 'Two-Foot to One-Foot Landings', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'apr_day4',
      month: 'april',
      dayKey: 'day4',
      title: 'Strength & Mobility',
      focus: 'Maintain strength and mobility pre-competition.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Slow Controlled Squats', workSeconds: s(40) },
        { name: 'Push-Ups', workSeconds: s(40) },
        { name: 'Single-Leg RDL (Right)', workSeconds: s(30) },
        { name: 'Single-Leg RDL (Left)', workSeconds: s(30) },
        { name: 'Hip Mobility Flow', workSeconds: s(60) }
      ]
    }
  },

  may: {
    day1: {
      id: 'may_day1',
      month: 'may',
      dayKey: 'day1',
      title: 'Light Jumps + Form',
      focus: 'Maintain jump form with reduced impact.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Mini Jumps (Small Height)', workSeconds: s(20) },
        { name: 'Step-Up Knee Drives (Stairs)', workSeconds: s(30) },
        { name: 'Slow Squat Holds', workSeconds: s(30) },
        { name: 'Calf Raises', workSeconds: s(30) }
      ]
    },
    day2: {
      id: 'may_day2',
      month: 'may',
      dayKey: 'day2',
      title: 'Core + Stability',
      focus: 'Maintain core and stability under low load.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Dead Bug', workSeconds: s(40) },
        { name: 'Side Plank', workSeconds: s(40) },
        { name: 'Bird Dog', workSeconds: s(40) },
        { name: 'Slow Mountain Climbers', workSeconds: s(40) }
      ]
    },
    day3: {
      id: 'may_day3',
      month: 'may',
      dayKey: 'day3',
      title: 'Light Agility / Footwork',
      focus: 'Keep footwork sharp with low intensity.',
      warmupSeconds: 120,
      repeatSets: 3,
      defaultRestSeconds: 30,
      exercises: [
        { name: 'Quick Feet', workSeconds: s(30) },
        { name: 'Lateral Shuffles', workSeconds: s(30) },
        { name: 'Skater Steps (No Jump)', workSeconds: s(30) },
        { name: 'Jog in Place', workSeconds: s(30) }
      ]
    },
    day4: {
      id: 'may_day4',
      month: 'may',
      dayKey: 'day4',
      title: 'Full Body (Easy)',
      focus: 'Gentle full body maintenance.',
      warmupSeconds: 120,
      repeatSets: 2,
      defaultRestSeconds: 20,
      exercises: [
        { name: 'Push-Ups (Easy or Knee)', workSeconds: s(30) },
        { name: 'Bodyweight Squats', workSeconds: s(40) },
        { name: 'Superman', workSeconds: s(40) },
        { name: 'Plank', workSeconds: s(40) }
      ]
    }
  }
};

// Map JS month index (0–11) to phase month key
export const MONTH_INDEX_TO_KEY: Record<number, MonthKey | null> = {
  0: 'january',
  1: 'february',
  2: 'march',
  3: 'april',
  4: 'may',
  5: null,
  6: null,
  7: null,
  8: null,
  9: null,
  10: 'december',
  11: null
};

// Map weekday (0=Sun … 6=Sat) to Day 1–4
export const WEEKDAY_TO_DAYKEY: Partial<Record<number, DayKey>> = {
  1: 'day1',
  2: 'day2',
  3: 'day3',
  4: 'day4'
};
