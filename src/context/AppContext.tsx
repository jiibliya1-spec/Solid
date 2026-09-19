import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, User, DailyLog, WorkoutEntry, Measurement, RecoveryDay, Supplement, FoodItem } from '@/types';
import { DEFAULT_SUPPLEMENTS, DEFAULT_ACHIEVEMENTS, WORKOUT_SCHEDULE } from '@/types';
import { format, getDay } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');
const getDayName = () => DAY_NAMES[getDay(new Date())];

const createInitialDailyLog = (): DailyLog => ({
  date: getTodayKey(),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  water: 0,
  steps: 0,
  sleep: 0,
  weight: 90,
  workoutsCompleted: 0,
  supplementsTaken: 0,
});

const getDefaultState = (): AppState => {
  const todayKey = getTodayKey();
  const dayName = getDayName();
  const workoutSchedule = WORKOUT_SCHEDULE[dayName] || WORKOUT_SCHEDULE['Monday'];
  
  const workoutEntry: WorkoutEntry = {
    day: dayName,
    title: workoutSchedule.title,
    exercises: workoutSchedule.exercises.map(e => ({
      ...e,
      completedSets: Array(e.sets).fill(null).map(() => ({ reps: 0, weight: 0, completed: false })),
    })),
    completed: false,
    duration: 0,
    cardioMinutes: workoutSchedule.cardio ? 0 : 0,
  };

  return {
    user: null,
    currentScreen: 'onboarding',
    dailyLog: createInitialDailyLog(),
    workoutLog: { [todayKey]: workoutEntry },
    nutritionLog: {
      [todayKey]: {
        meals: [
          { name: 'Breakfast', foods: [] },
          { name: 'Lunch', foods: [] },
          { name: 'Snack', foods: [] },
          { name: 'Dinner', foods: [] },
        ],
      },
    },
    measurements: [
      { date: todayKey, weight: 90, bmi: 26.2, waist: 92, chest: 102, arms: 35, legs: 58, bodyFat: 22 },
      { date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd'), weight: 90.2, bmi: 26.3, waist: 92.5, chest: 102, arms: 35, legs: 58, bodyFat: 22.1 },
      { date: format(new Date(Date.now() - 172800000), 'yyyy-MM-dd'), weight: 90.5, bmi: 26.4, waist: 93, chest: 102, arms: 35, legs: 58, bodyFat: 22.2 },
      { date: format(new Date(Date.now() - 259200000), 'yyyy-MM-dd'), weight: 90.8, bmi: 26.5, waist: 93.5, chest: 102, arms: 34.8, legs: 58, bodyFat: 22.3 },
      { date: format(new Date(Date.now() - 345600000), 'yyyy-MM-dd'), weight: 91.0, bmi: 26.5, waist: 94, chest: 102.5, arms: 34.8, legs: 58, bodyFat: 22.4 },
      { date: format(new Date(Date.now() - 432000000), 'yyyy-MM-dd'), weight: 91.2, bmi: 26.6, waist: 94, chest: 102.5, arms: 34.8, legs: 58, bodyFat: 22.5 },
      { date: format(new Date(Date.now() - 518400000), 'yyyy-MM-dd'), weight: 91.5, bmi: 26.7, waist: 94.5, chest: 103, arms: 34.7, legs: 58, bodyFat: 22.6 },
    ],
    recovery: {},
    streaks: { current: 5, longest: 12, lastActiveDate: todayKey, workoutStreak: 5, nutritionStreak: 5 },
    achievements: DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })),
    supplements: DEFAULT_SUPPLEMENTS.map(s => ({ ...s })),
    settings: {
      theme: 'dark',
      notifications: {
        dailyReminders: true,
        workoutReminders: true,
        nutritionReminders: true,
        supplementReminders: true,
        weeklyReport: true,
        achievements: true,
      },
      units: 'metric',
    },
    notifications: [
      { id: '1', title: 'Good morning!', message: 'Your calorie target today is 2,350 kcal. Back Day workout scheduled.', time: '7:00 AM', read: false, type: 'morning' },
      { id: '2', title: 'Time for Back Day!', message: '5 exercises, ~50 minutes. Ready to crush it?', time: '5:00 PM', read: false, type: 'workout' },
      { id: '3', title: 'Lunch check-in', message: 'You\'ve logged 800 calories. Target: 2,350.', time: '1:00 PM', read: true, type: 'nutrition' },
    ],
  };
};

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem('fitnessApp');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getDefaultState(), ...parsed, currentScreen: parsed.user ? 'dashboard' : 'onboarding' };
    }
  } catch { /* ignore */ }
  return getDefaultState();
};

type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_SCREEN'; payload: string }
  | { type: 'UPDATE_DAILY_LOG'; payload: Partial<DailyLog> }
  | { type: 'LOG_WATER'; payload: number }
  | { type: 'LOG_STEPS'; payload: number }
  | { type: 'ADD_FOOD'; payload: { mealName: string; food: FoodItem } }
  | { type: 'REMOVE_FOOD'; payload: { mealName: string; foodIndex: number } }
  | { type: 'TOGGLE_SET'; payload: { exerciseIndex: number; setIndex: number } }
  | { type: 'UPDATE_SET'; payload: { exerciseIndex: number; setIndex: number; field: 'reps' | 'weight'; value: number } }
  | { type: 'COMPLETE_WORKOUT' }
  | { type: 'LOG_WEIGHT'; payload: number }
  | { type: 'ADD_MEASUREMENT'; payload: Measurement }
  | { type: 'LOG_RECOVERY'; payload: RecoveryDay }
  | { type: 'TOGGLE_SUPPLEMENT'; payload: string }
  | { type: 'ADD_SUPPLEMENT'; payload: Supplement }
  | { type: 'SET_AVATAR'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'RESET' };

function appReducer(state: AppState, action: Action): AppState {
  const todayKey = getTodayKey();
  
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, currentScreen: 'dashboard' };
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'UPDATE_DAILY_LOG':
      return { ...state, dailyLog: { ...state.dailyLog, ...action.payload } };
    case 'LOG_WATER': {
      const newWater = state.dailyLog.water + action.payload;
      return { ...state, dailyLog: { ...state.dailyLog, water: Math.min(newWater, 5) } };
    }
    case 'LOG_STEPS':
      return { ...state, dailyLog: { ...state.dailyLog, steps: action.payload } };
    case 'ADD_FOOD': {
      const nutritionDay = state.nutritionLog[todayKey] || { meals: [{ name: 'Breakfast', foods: [] }, { name: 'Lunch', foods: [] }, { name: 'Snack', foods: [] }, { name: 'Dinner', foods: [] }] };
      const updatedMeals = nutritionDay.meals.map(m =>
        m.name === action.payload.mealName ? { ...m, foods: [...m.foods, action.payload.food] } : m
      );
      const totalCals = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.carbs, 0);
      const totalFat = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.fat, 0);
      return {
        ...state,
        nutritionLog: { ...state.nutritionLog, [todayKey]: { meals: updatedMeals } },
        dailyLog: { ...state.dailyLog, calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      };
    }
    case 'REMOVE_FOOD': {
      const nutritionDay = state.nutritionLog[todayKey];
      if (!nutritionDay) return state;
      const updatedMeals = nutritionDay.meals.map((m) => {
        if (m.name !== action.payload.mealName) return m;
        const newFoods = m.foods.filter((_, fi) => fi !== action.payload.foodIndex);
        return { ...m, foods: newFoods };
      });
      const totalCals = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.calories, 0);
      const totalProtein = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.protein, 0);
      const totalCarbs = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.carbs, 0);
      const totalFat = updatedMeals.flatMap(m => m.foods).reduce((sum, f) => sum + f.fat, 0);
      return {
        ...state,
        nutritionLog: { ...state.nutritionLog, [todayKey]: { meals: updatedMeals } },
        dailyLog: { ...state.dailyLog, calories: totalCals, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      };
    }
    case 'TOGGLE_SET': {
      const workout = state.workoutLog[todayKey];
      if (!workout) return state;
      const updatedExercises = workout.exercises.map((e, ei) => {
        if (ei !== action.payload.exerciseIndex) return e;
        const updatedSets = e.completedSets.map((s, si) =>
          si === action.payload.setIndex ? { ...s, completed: !s.completed } : s
        );
        return { ...e, completedSets: updatedSets };
      });
      return { ...state, workoutLog: { ...state.workoutLog, [todayKey]: { ...workout, exercises: updatedExercises } } };
    }
    case 'UPDATE_SET': {
      const workout = state.workoutLog[todayKey];
      if (!workout) return state;
      const updatedExercises = workout.exercises.map((e, ei) => {
        if (ei !== action.payload.exerciseIndex) return e;
        const updatedSets = e.completedSets.map((s, si) =>
          si === action.payload.setIndex ? { ...s, [action.payload.field]: action.payload.value } : s
        );
        return { ...e, completedSets: updatedSets };
      });
      return { ...state, workoutLog: { ...state.workoutLog, [todayKey]: { ...workout, exercises: updatedExercises } } };
    }
    case 'COMPLETE_WORKOUT': {
      const workout = state.workoutLog[todayKey];
      if (!workout) return state;
      const newStreaks = { ...state.streaks, workoutStreak: state.streaks.workoutStreak + 1 };
      return {
        ...state,
        workoutLog: { ...state.workoutLog, [todayKey]: { ...workout, completed: true } },
        dailyLog: { ...state.dailyLog, workoutsCompleted: state.dailyLog.workoutsCompleted + 1 },
        streaks: newStreaks,
      };
    }
    case 'LOG_WEIGHT': {
      const newMeasurements = [...state.measurements, { ...state.measurements[state.measurements.length - 1], date: todayKey, weight: action.payload }];
      return { ...state, measurements: newMeasurements, dailyLog: { ...state.dailyLog, weight: action.payload } };
    }
    case 'ADD_MEASUREMENT':
      return { ...state, measurements: [...state.measurements, action.payload] };
    case 'LOG_RECOVERY':
      return { ...state, recovery: { ...state.recovery, [todayKey]: action.payload } };
    case 'TOGGLE_SUPPLEMENT': {
      const updatedSupplements = state.supplements.map(s =>
        s.id === action.payload ? { ...s, taken: !s.taken } : s
      );
      const takenCount = updatedSupplements.filter(s => s.taken).length;
      return { ...state, supplements: updatedSupplements, dailyLog: { ...state.dailyLog, supplementsTaken: takenCount } };
    }
    case 'ADD_SUPPLEMENT':
      return { ...state, supplements: [...state.supplements, action.payload] };
    case 'SET_AVATAR':
      return state.user ? { ...state, user: { ...state.user, avatar: action.payload } } : state;
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'MARK_NOTIFICATION_READ':
      return { ...state, notifications: state.notifications.map(n => n.id === action.payload ? { ...n, read: true } : n) };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) };
    case 'UNLOCK_ACHIEVEMENT':
      return { ...state, achievements: state.achievements.map(a => a.id === action.payload ? { ...a, unlockedAt: todayKey } : a) };
    case 'RESET':
      localStorage.removeItem('fitnessApp');
      return getDefaultState();
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem('fitnessApp', JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function useTodayWorkout(): WorkoutEntry | undefined {
  const { state } = useApp();
  const todayKey = getTodayKey();
  return state.workoutLog[todayKey];
}

export function useTodayNutrition() {
  const { state } = useApp();
  const todayKey = getTodayKey();
  return state.nutritionLog[todayKey] || { meals: [] };
}

export function useDailyTargets() {
  const { state } = useApp();
  const user = state.user;
  const currentWeight = state.dailyLog.weight || user?.currentWeight || 90;
  const height = user?.height || 175;
  const age = user?.age || 30;
  const goalWeight = user?.goalWeight ?? currentWeight;
  const isTrainingDay = getDayName() !== 'Wednesday' && getDayName() !== 'Sunday';

  // Mifflin-St Jeor BMR, averaged across the male/female offset since the
  // app doesn't collect gender at onboarding.
  const bmr = 10 * currentWeight + 6.25 * height - 5 * age - 78;

  // Activity multiplier scales with the user's actual onboarding answers
  // (how many days/week they train, and their experience level) instead of
  // a single fixed number for everyone.
  const trainingActivity =
    (user?.workDays === 4 ? 1.55 : 1.45) +
    (user?.experience === 'advanced' ? 0.1 : user?.experience === 'beginner' ? -0.05 : 0);
  const restActivity = 1.2;
  const tdee = bmr * (isTrainingDay ? trainingActivity : restActivity);

  // Calories are nudged toward the user's actual goal direction: a real
  // deficit when they're trying to lose, a surplus when trying to gain,
  // maintenance when they're already at their goal weight.
  const weightDelta = goalWeight - currentWeight;
  const calorieAdjustment = weightDelta < -0.5 ? -500 : weightDelta > 0.5 ? 300 : 0;
  const calories = Math.round(tdee + calorieAdjustment);

  // Macros derived from the user's own bodyweight and calorie target rather
  // than a fixed 180g/65g for everyone.
  const protein = Math.round(currentWeight * 2); // ~2g/kg to preserve muscle in a deficit
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const fiber = Math.round((calories / 1000) * 14); // standard 14g/1000kcal guideline

  const water = Math.round(currentWeight * 0.035 * 10) / 10; // ~35ml per kg bodyweight
  const steps = 10000;
  // Sleep target uses the user's own shift-day vs. off-day sleep answers
  // from onboarding, which were previously collected and never used.
  const sleep = isTrainingDay ? (user?.shiftSleep ?? 6.5) : (user?.offSleep ?? 8.5);

  return { calories, protein, carbs, fat, fiber, water, steps, sleep, isTrainingDay };
}

export function getCurrentWeek(startDate?: string): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (7 * 86400000));
  return Math.max(1, Math.min(diff + 1, 12));
}

export function getCardioForWeek(week: number): number {
  if (week <= 2) return 15;
  if (week <= 4) return 20;
  if (week <= 6) return 25;
  if (week <= 8) return 30;
  return 35;
}
