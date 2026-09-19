export interface User {
  name: string;
  age: number;
  height: number;
  currentWeight: number;
  goalWeight: number;
  startDate: string;
  targetDate: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  workDays: 3 | 4;
  shiftSleep: number;
  offSleep: number;
  workoutTime: 'morning' | 'evening';
}

export interface DailyLog {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
  steps: number;
  sleep: number;
  weight: number;
  workoutsCompleted: number;
  supplementsTaken: number;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
  instructions: string;
  mistakes: string[];
  restSeconds: number;
  completedSets: ExerciseSet[];
}

export interface WorkoutEntry {
  day: string;
  title: string;
  exercises: Exercise[];
  completed: boolean;
  duration: number;
  cardioMinutes: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
}

export interface Meal {
  name: string;
  foods: FoodItem[];
}

export interface NutritionDay {
  meals: Meal[];
}

export interface Measurement {
  date: string;
  weight: number;
  bmi: number;
  waist: number;
  chest: number;
  arms: number;
  legs: number;
  bodyFat: number;
}

export interface RecoveryDay {
  date: string;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  soreness: { [muscle: string]: number };
  recoveryScore: number;
}

export interface Streaks {
  current: number;
  longest: number;
  lastActiveDate: string;
  workoutStreak: number;
  nutritionStreak: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: string | null;
  icon: string;
  category: string;
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
  taken: boolean;
  notes: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  notifications: {
    dailyReminders: boolean;
    workoutReminders: boolean;
    nutritionReminders: boolean;
    supplementReminders: boolean;
    weeklyReport: boolean;
    achievements: boolean;
  };
  units: 'metric' | 'imperial';
}

export interface AppState {
  user: User | null;
  currentScreen: string;
  dailyLog: DailyLog;
  workoutLog: { [date: string]: WorkoutEntry };
  nutritionLog: { [date: string]: NutritionDay };
  measurements: Measurement[];
  recovery: { [date: string]: RecoveryDay };
  streaks: Streaks;
  achievements: Achievement[];
  supplements: Supplement[];
  settings: AppSettings;
  notifications: AppNotification[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'morning' | 'workout' | 'nutrition' | 'supplement' | 'recovery' | 'weekly' | 'achievement';
}

export type ScreenName =
  | 'onboarding'
  | 'setup'
  | 'dashboard'
  | 'workout'
  | 'nutrition'
  | 'recovery'
  | 'progress'
  | 'achievements'
  | 'aiCoach'
  | 'supplements'
  | 'workoutLibrary'
  | 'settings'
  | 'notifications'
  | 'weeklyReport'
  | 'mealPlanner'
  | 'goalProjection'
  | 'timer'
  | 'barcodeScanner'
  | 'profile'
  | 'workoutSchedule'
  | 'exerciseDetail'
  | 'foodDetail'
  | 'editFood';

export const WORKOUT_SCHEDULE: Record<string, { title: string; exercises: Omit<Exercise, 'completedSets'>[]; cardio: boolean }> = {
  Monday: {
    title: 'Shoulder Day',
    cardio: false,
    exercises: [
      { name: 'Shoulder Press', sets: 4, reps: '8-12', muscle: 'Shoulders', restSeconds: 90, instructions: 'Sit with back supported. Press dumbbells overhead until arms are fully extended. Lower slowly.', mistakes: ['Arching lower back', 'Not full range of motion', 'Using momentum'] },
      { name: 'Lateral Raise', sets: 4, reps: '12-15', muscle: 'Side Delts', restSeconds: 60, instructions: 'Stand with dumbbells at sides. Raise arms out to sides until parallel with floor. Control on way down.', mistakes: ['Swinging body', 'Going too heavy', 'Not controlling descent'] },
      { name: 'Rear Delt Fly', sets: 4, reps: '12-15', muscle: 'Rear Delts', restSeconds: 60, instructions: 'Bend at hips, chest supported. Raise dumbbells out to sides squeezing rear delts.', mistakes: ['Using back momentum', 'Too much weight', 'Not squeezing at top'] },
      { name: 'Upright Row', sets: 3, reps: '10-12', muscle: 'Traps & Delts', restSeconds: 75, instructions: 'Pull barbell or dumbbells straight up toward chin, leading with elbows.', mistakes: ['Pulling with wrists', 'Going too high', 'Using excessive weight'] },
      { name: 'Shrugs', sets: 3, reps: '12-15', muscle: 'Traps', restSeconds: 60, instructions: 'Hold dumbbells at sides. Shrug shoulders up toward ears, hold and squeeze.', mistakes: ['Rolling shoulders', 'Bending arms', 'Not holding contraction'] },
    ],
  },
  Tuesday: {
    title: 'Back Day',
    cardio: false,
    exercises: [
      { name: 'Lat Pulldown', sets: 4, reps: '8-12', muscle: 'Lats', restSeconds: 90, instructions: 'Grip bar wider than shoulders. Pull down to upper chest, squeezing shoulder blades together.', mistakes: ['Using momentum', 'Not squeezing lats', 'Going too fast'] },
      { name: 'Seated Cable Row', sets: 4, reps: '8-12', muscle: 'Mid Back', restSeconds: 90, instructions: 'Sit upright, pull handle to lower chest, squeezing shoulder blades.', mistakes: ['Rounding back', 'Jerking motion', 'Not full stretch'] },
      { name: 'Chest Supported Row', sets: 3, reps: '10-12', muscle: 'Upper Back', restSeconds: 75, instructions: 'Lie face down on incline bench. Row dumbbells up squeezing back muscles.', mistakes: ['Lifting head', 'Using momentum', 'Short range of motion'] },
      { name: 'Straight Arm Pulldown', sets: 3, reps: '12-15', muscle: 'Lats', restSeconds: 60, instructions: 'Stand facing cable, arms straight. Pull bar down to thighs using lats.', mistakes: ['Bending elbows', 'Not engaging lats', 'Going too heavy'] },
      { name: 'Face Pull', sets: 3, reps: '15', muscle: 'Rear Delts', restSeconds: 60, instructions: 'Pull rope attachment to face level, separating hands and squeezing rear delts.', mistakes: ['Going too heavy', 'Not separating hands', 'Using body swing'] },
    ],
  },
  Wednesday: { title: 'Recovery / Rest', cardio: false, exercises: [] },
  Thursday: {
    title: 'Chest Day',
    cardio: false,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-12', muscle: 'Chest', restSeconds: 120, instructions: 'Lie on bench, press bar from chest to full extension. Control descent.', mistakes: ['Bouncing bar off chest', 'Uneven grip', 'Not retracting shoulder blades'] },
      { name: 'Incline Dumbbell Press', sets: 4, reps: '8-12', muscle: 'Upper Chest', restSeconds: 90, instructions: 'Set bench to 30-45°. Press dumbbells up focusing on upper chest.', mistakes: ['Too much incline', 'Flaring elbows', 'Not controlling dumbbells'] },
      { name: 'Chest Fly', sets: 3, reps: '12-15', muscle: 'Chest', restSeconds: 60, instructions: 'Lie flat, arms slightly bent. Open arms wide then squeeze chest to bring together.', mistakes: ['Bending elbows too much', 'Going too heavy', 'Not feeling chest stretch'] },
      { name: 'Push Ups', sets: 3, reps: 'To failure', muscle: 'Chest & Triceps', restSeconds: 60, instructions: 'Body straight, lower chest to floor, push back up. Modify on knees if needed.', mistakes: ['Sagging hips', 'Partial reps', 'Flaring elbows too wide'] },
    ],
  },
  Friday: {
    title: 'Leg Day',
    cardio: false,
    exercises: [
      { name: 'Squat', sets: 4, reps: '8-10', muscle: 'Quads & Glutes', restSeconds: 120, instructions: 'Bar on upper back/shoulders. Squat down until thighs parallel, drive through heels up.', mistakes: ['Knees caving in', 'Not reaching depth', 'Rounding lower back'] },
      { name: 'Romanian Deadlift', sets: 4, reps: '8-10', muscle: 'Hamstrings & Glutes', restSeconds: 90, instructions: 'Hold bar at hips, hinge at hips pushing butt back. Feel hamstring stretch, return upright.', mistakes: ['Rounding back', 'Bending knees too much', 'Not feeling hamstring stretch'] },
      { name: 'Leg Press', sets: 3, reps: '12', muscle: 'Quads', restSeconds: 90, instructions: 'Feet shoulder-width on platform. Lower until knees at 90°, press back up.', mistakes: ['Locking knees at top', 'Feet too high/low', 'Not full range'] },
      { name: 'Leg Curl', sets: 3, reps: '12', muscle: 'Hamstrings', restSeconds: 60, instructions: 'Lie face down, curl heels toward glutes, squeeze hamstrings.', mistakes: ['Lifting hips', 'Going too fast', 'Not full contraction'] },
      { name: 'Leg Extension', sets: 3, reps: '12', muscle: 'Quads', restSeconds: 60, instructions: 'Sit with back supported. Extend legs until straight, squeeze quads.', mistakes: ['Going too heavy', 'Not controlling weight', 'Partial reps'] },
      { name: 'Standing Calf Raise', sets: 4, reps: '15', muscle: 'Calves', restSeconds: 45, instructions: 'Stand on edge of step, raise heels up squeezing calves, lower below step level.', mistakes: ['Bouncing', 'Not full stretch', 'Rushing reps'] },
    ],
  },
  Saturday: {
    title: 'Arms Day',
    cardio: false,
    exercises: [
      { name: 'Barbell Curl', sets: 4, reps: '10', muscle: 'Biceps', restSeconds: 60, instructions: 'Hold bar with palms up. Curl toward shoulders keeping elbows stationary.', mistakes: ['Swinging body', 'Elbows moving forward', 'Not controlling lowering'] },
      { name: 'Hammer Curl', sets: 3, reps: '12', muscle: 'Brachialis', restSeconds: 60, instructions: 'Neutral grip (palms facing each other). Curl dumbbells toward shoulders.', mistakes: ['Wrist bending', 'Using momentum', 'Incomplete range'] },
      { name: 'Cable Curl', sets: 3, reps: '12', muscle: 'Biceps', restSeconds: 60, instructions: 'Stand at cable station, curl bar/handle up squeezing biceps at top.', mistakes: ['Leaning back', 'Going too heavy', 'Not squeezing at top'] },
      { name: 'Triceps Pushdown', sets: 4, reps: '10', muscle: 'Triceps', restSeconds: 60, instructions: 'Push rope/bar down until arms fully extended, squeeze triceps.', mistakes: ['Elbows flaring', 'Not full extension', 'Using body momentum'] },
      { name: 'Overhead Extension', sets: 3, reps: '12', muscle: 'Triceps', restSeconds: 60, instructions: 'Hold dumbbell overhead with both hands. Lower behind head, extend arms.', mistakes: ['Elbows spreading', 'Going too heavy', 'Not controlling weight'] },
      { name: 'Dips', sets: 3, reps: '12', muscle: 'Triceps & Chest', restSeconds: 75, instructions: 'On parallel bars or bench. Lower until elbows at 90°, push back up.', mistakes: ['Not enough depth', 'Flaring elbows', 'Shoulder strain'] },
    ],
  },
  Sunday: { title: 'Recovery / Rest', cardio: false, exercises: [] },
};

export const CARDIO_PROGRESSION = [
  { weeks: '1-2', minutes: 15 },
  { weeks: '3-4', minutes: 20 },
  { weeks: '5-6', minutes: 25 },
  { weeks: '7-8', minutes: 30 },
  { weeks: '9-12', minutes: 35 },
];

export const DEFAULT_SUPPLEMENTS: Supplement[] = [
  { id: 'omega3', name: 'Omega 3', dose: '1000mg', timing: 'Morning', taken: false, notes: 'Take with breakfast' },
  { id: 'creatine', name: 'Creatine Monohydrate', dose: '5g', timing: 'Pre-Workout', taken: false, notes: 'Mix with water or juice' },
  { id: 'zinc', name: 'Zinc', dose: '15mg', timing: 'Evening', taken: false, notes: 'Take with food' },
  { id: 'ashwagandha', name: 'Ashwagandha', dose: '300mg', timing: 'Bedtime', taken: false, notes: 'Take 30 min before bed' },
];

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-workout', title: 'First Steps', description: 'Complete your first workout', unlockedAt: null, icon: 'trophy', category: 'Workouts' },
  { id: 'week-warrior', title: 'Week Warrior', description: 'Complete 7 days of workouts', unlockedAt: null, icon: 'zap', category: 'Workouts' },
  { id: 'macro-master', title: 'Macro Master', description: 'Hit protein target 7 days in a row', unlockedAt: null, icon: 'target', category: 'Nutrition' },
  { id: 'hydration-hero', title: 'Hydration Hero', description: 'Drink 3.5L water for 5 days', unlockedAt: null, icon: 'droplets', category: 'Nutrition' },
  { id: 'halfway', title: 'Halfway There', description: 'Reach 84 kg', unlockedAt: null, icon: 'scale', category: 'Milestones' },
  { id: 'goal-crusher', title: 'Goal Crusher', description: 'Reach 78 kg', unlockedAt: null, icon: 'trophy', category: 'Milestones' },
  { id: 'morning-person', title: 'Morning Person', description: 'Complete 5 morning workouts', unlockedAt: null, icon: 'sun', category: 'Special' },
  { id: 'night-owl', title: 'Night Owl', description: 'Complete 5 evening workouts', unlockedAt: null, icon: 'moon', category: 'Special' },
  { id: 'streak-3', title: 'Streak Starter', description: '3-day streak', unlockedAt: null, icon: 'flame', category: 'Streaks' },
  { id: 'streak-7', title: 'On Fire', description: '7-day streak', unlockedAt: null, icon: 'flame', category: 'Streaks' },
  { id: 'streak-14', title: 'Unstoppable', description: '14-day streak', unlockedAt: null, icon: 'flame', category: 'Streaks' },
  { id: 'century', title: 'Century Club', description: 'Burn 10,000 total calories', unlockedAt: null, icon: 'flame', category: 'Milestones' },
];

export const PREFERRED_FOODS = [
  'Scrambled Eggs', 'Whole Wheat Toast', 'Chicken Breast', 'Salmon',
  'Air Fryer Potatoes', 'Rice', 'Oats', 'Protein Waffle', 'Banana',
  'Vegetables', 'Lean Beef', 'Coffee', 'Tea', 'Almond Milk',
  'Whey Protein Shake', 'Greek Yogurt', 'Avocado', 'Berries',
  'Broccoli', 'Sweet Potato', 'Egg Whites', 'Tuna',
];

export const QUICK_LOG_ITEMS = [
  { icon: 'scale', label: 'Log Weight', color: '#34D399' },
  { icon: 'apple', label: 'Log Meal', color: '#F59E0B' },
  { icon: 'droplets', label: 'Log Water', color: '#38BDF8' },
  { icon: 'dumbbell', label: 'Log Workout', color: '#34D399' },
  { icon: 'ruler', label: 'Log Measurement', color: '#60A5FA' },
  { icon: 'pill', label: 'Log Supplement', color: '#60A5FA' },
];
