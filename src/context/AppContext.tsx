import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { AppState, User, DailyLog, WorkoutEntry, Measurement, RecoveryDay, Supplement, FoodItem } from '@/types';
import { DEFAULT_SUPPLEMENTS, DEFAULT_ACHIEVEMENTS, TRAINING_DAYS_BY_FREQUENCY, getWorkoutForDay } from '@/types';
import { format, getDay } from 'date-fns';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');
const getDayName = () => DAY_NAMES[getDay(new Date())];

const createInitialDailyLog = (startWeight = 0): DailyLog => ({
  date: getTodayKey(),
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  water: 0,
  steps: 0,
  sleep: 0,
  weight: startWeight,
  workoutsCompleted: 0,
  supplementsTaken: 0,
});

const getDefaultState = (): AppState => {
  const todayKey = getTodayKey();
  const dayName = getDayName();
  const workoutSchedule = getWorkoutForDay(dayName, 4);
  
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
    measurements: [],
    recovery: {},
    streaks: { current: 0, longest: 0, lastActiveDate: todayKey, workoutStreak: 0, nutritionStreak: 0 },
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
    notifications: [],
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
  | { type: 'UPDATE_USER'; payload: Partial<User> }
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
  | { type: 'ROLL_OVER_DAY' }
  | { type: 'RESET' };

function appReducer(state: AppState, action: Action): AppState {
  const todayKey = getTodayKey();
  
  switch (action.type) {
    case 'ROLL_OVER_DAY': {
      // Nothing changed -- we're still on the same calendar day this state was
      // last touched on, so there's nothing to roll over.
      if (state.dailyLog.date === todayKey) return state;
      if (!state.user) return state;

      const dayName = getDayName();
      const schedule = getWorkoutForDay(dayName, state.user.workDays);
      const workoutEntry: WorkoutEntry = {
        day: dayName,
        title: schedule.title,
        exercises: schedule.exercises.map(e => ({
          ...e,
          completedSets: Array(e.sets).fill(null).map(() => ({ reps: 0, weight: 0, completed: false })),
        })),
        completed: false,
        duration: 0,
        cardioMinutes: 0,
      };
      const lastWeight = state.measurements[state.measurements.length - 1]?.weight ?? state.dailyLog.weight;

      return {
        ...state,
        dailyLog: {
          date: todayKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          water: 0,
          steps: 0,
          sleep: 0,
          weight: lastWeight,
          workoutsCompleted: 0,
          supplementsTaken: 0,
        },
        workoutLog: { ...state.workoutLog, [todayKey]: state.workoutLog[todayKey] ?? workoutEntry },
        nutritionLog: {
          ...state.nutritionLog,
          [todayKey]: state.nutritionLog[todayKey] ?? {
            meals: [
              { name: 'Breakfast', foods: [] },
              { name: 'Lunch', foods: [] },
              { name: 'Snack', foods: [] },
              { name: 'Dinner', foods: [] },
            ],
          },
        },
      };
    }
    case 'SET_USER': {
      const weight = action.payload.currentWeight;
      const heightM = action.payload.height / 100;
      const bmi = heightM > 0 ? Math.round((weight / (heightM * heightM)) * 10) / 10 : 0;

      // getDefaultState() had to seed *today's* workout entry before we knew the
      // user's real workDays choice (they hadn't onboarded yet), so it guessed.
      // Now that onboarding just gave us the real answer, rebuild today's workout
      // from the schedule that actually matches it -- otherwise someone who picked
      // "3 days/week" could be stuck looking at a 5-day template's rest days (e.g.
      // Sunday always showing as rest even though it should be a training day for
      // their chosen frequency).
      const dayName = getDayName();
      const schedule = getWorkoutForDay(dayName, action.payload.workDays);
      const workoutEntry: WorkoutEntry = {
        day: dayName,
        title: schedule.title,
        exercises: schedule.exercises.map(e => ({
          ...e,
          completedSets: Array(e.sets).fill(null).map(() => ({ reps: 0, weight: 0, completed: false })),
        })),
        completed: false,
        duration: 0,
        cardioMinutes: 0,
      };

      return {
        ...state,
        user: action.payload,
        currentScreen: 'dashboard',
        dailyLog: { ...state.dailyLog, date: todayKey, weight },
        workoutLog: { ...state.workoutLog, [todayKey]: workoutEntry },
        // Seed the very first measurement from what the user actually entered during
        // onboarding, instead of showing fake history. Body-part measurements (waist,
        // chest, arms, legs, body fat) are left at 0 until the user logs them for real.
        measurements: state.measurements.length === 0
          ? [{ date: todayKey, weight, bmi, waist: 0, chest: 0, arms: 0, legs: 0, bodyFat: 0 }]
          : state.measurements,
      };
    }
    case 'UPDATE_USER': {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...action.payload };

      // If the training-days-per-week choice changed, today's workout needs
      // to follow the new schedule -- but only if nothing's actually been
      // logged against today's workout yet, so changing this setting can
      // never silently wipe out sets the user already completed.
      let workoutLog = state.workoutLog;
      if (action.payload.workDays !== undefined && action.payload.workDays !== state.user.workDays) {
        const existing = state.workoutLog[todayKey];
        const hasProgress = existing?.exercises.some(e => e.completedSets.some(s => s.completed)) || existing?.completed;
        if (!hasProgress) {
          const dayName = getDayName();
          const schedule = getWorkoutForDay(dayName, updatedUser.workDays);
          const workoutEntry: WorkoutEntry = {
            day: dayName,
            title: schedule.title,
            exercises: schedule.exercises.map(e => ({
              ...e,
              completedSets: Array(e.sets).fill(null).map(() => ({ reps: 0, weight: 0, completed: false })),
            })),
            completed: false,
            duration: 0,
            cardioMinutes: 0,
          };
          workoutLog = { ...state.workoutLog, [todayKey]: workoutEntry };
        }
      }

      return { ...state, user: updatedUser, workoutLog };
    }
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

  // Roll over to a fresh day's log/workout when the calendar date has actually
  // changed since state was last saved -- e.g. the user closed the app
  // yesterday and opens it again today. Without this, "today" kept showing
  // whatever day the app was first set up on (stale calories, stale workout,
  // and a workout day that never matches the real day of the week). Checked
  // on mount and whenever the app regains focus (covers overnight usage
  // without needing to keep a timer running).
  useEffect(() => {
    dispatch({ type: 'ROLL_OVER_DAY' });
    const onFocus = () => dispatch({ type: 'ROLL_OVER_DAY' });
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  // Actually apply the theme the user picked in Settings. Previously
  // UPDATE_SETTINGS only wrote `theme` into state -- nothing ever read it
  // back to change what's on screen, so Dark/Light/Auto all looked
  // identical.
  useEffect(() => {
    const theme = state.settings.theme;
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme();

    if (theme === 'system') {
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [state.settings.theme]);

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
  const isTrainingDay = (TRAINING_DAYS_BY_FREQUENCY[user?.workDays ?? 4] ?? TRAINING_DAYS_BY_FREQUENCY[4]).includes(getDayName());

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
