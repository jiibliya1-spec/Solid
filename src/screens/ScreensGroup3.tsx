// Merged screen file — combines: WorkoutDetail, WorkoutLibrary, MealPlanner, EditFood, BarcodeScanner
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Search, Shuffle, Timer, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useApp, useDailyTargets } from '@/context/AppContext';
import { WORKOUT_SCHEDULE, REST_WORKOUT_ID } from '@/types';
import type { FoodItem } from '@/types';
import { QUICK_FOODS } from '@/data/foods';
import { BottomNav, ConfettiCelebration, Toast } from '@/components/SharedComponents';
import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { useTranslation } from '@/i18n/i18nHooks';

// ==================== WorkoutDetail ====================
export function WorkoutDetail() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const workout = state.workoutLog[todayKey];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [restTimer, setRestTimer] = useState({ active: false, seconds: 0, total: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const restRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (restTimer.active && restTimer.seconds > 0) {
      restRef.current = setInterval(() => {
        setRestTimer(rt => {
          if (rt.seconds <= 1) {
            clearInterval(restRef.current);
            return { ...rt, active: false, seconds: 0 };
          }
          return { ...rt, seconds: rt.seconds - 1 };
        });
      }, 1000);
      return () => clearInterval(restRef.current);
    }
  }, [restTimer.active]);

  if (!workout || workout.exercises.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col items-center justify-center pb-24">
        <div className="text-center px-8">
          <h2 className="text-h2 text-[var(--text-primary)] mb-2">{t('restDay')}</h2>
          <p className="text-body text-[var(--text-secondary)]">Today is your recovery day. Focus on rest, hydration, and mobility.</p>
          <button onClick={() => navigate('/recovery')} className="btn-primary mt-6">{t('goToRecovery')}</button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const completedExercises = workout.exercises.filter(e => e.completedSets.every(s => s.completed)).length;
  const totalSets = workout.exercises.reduce((sum, e) => sum + e.completedSets.filter(s => s.completed).length, 0);
  const totalTargetSets = workout.exercises.reduce((sum, e) => sum + e.sets, 0);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const toggleSet = (exIdx: number, setIdx: number) => {
    dispatch({ type: 'TOGGLE_SET', payload: { exerciseIndex: exIdx, setIndex: setIdx } });
    const ex = workout.exercises[exIdx];
    if (ex && !ex.completedSets[setIdx]?.completed) {
      startRest(ex.restSeconds);
    }
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', val: number) => {
    dispatch({ type: 'UPDATE_SET', payload: { exerciseIndex: exIdx, setIndex: setIdx, field, value: val } });
  };

  const startRest = (seconds: number) => {
    clearInterval(restRef.current);
    setRestTimer({ active: true, seconds, total: seconds });
  };

  const completeWorkout = () => {
    clearInterval(timerRef.current);
    dispatch({ type: 'COMPLETE_WORKOUT' });
    setShowCelebration(true);
    setToast({ visible: true, message: 'Workout completed! Great job!' });
    setTimeout(() => navigate('/dashboard'), 3000);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <div className="text-center">
          <h3 className="text-h3 text-[var(--text-primary)]">{workout.title}</h3>
          <p className="text-caption text-[var(--text-secondary)]">{workout.exercises.length} exercises · {formatTime(elapsed)}</p>
        </div>
        <div className="flex items-center gap-1 text-body-sm text-[var(--accent-primary)]">
          <Timer size={16} /> {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-4">
        <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <motion.div
            animate={{ width: `${(completedExercises / workout.exercises.length) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full bg-[var(--accent-primary)]"
          />
        </div>
        <p className="text-caption text-[var(--text-secondary)] mt-1 text-center">
          {completedExercises}/{workout.exercises.length} exercises · {totalSets}/{totalTargetSets} sets
        </p>
      </div>

      {/* Exercise Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {workout.exercises.map((exercise, exIdx) => {
          const isExpanded = expandedIdx === exIdx;
          const completedCount = exercise.completedSets.filter(s => s.completed).length;
          const allDone = completedCount === exercise.sets;

          return (
            <motion.div
              key={exIdx}
              layout
              className={`card overflow-hidden ${isExpanded ? 'col-span-2' : ''}`}
              style={{ borderLeft: allDone ? '3px solid var(--accent-primary)' : undefined }}
            >
              {/* Collapsed header -- grid-card thumbnail */}
              <div
                onClick={() => setExpandedIdx(isExpanded ? null : exIdx)}
                className="cursor-pointer"
              >
                <div className="relative w-full aspect-square rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden mb-2">
                  <ExerciseAnimation name={exercise.name} muscle={exercise.muscle} className="w-4/5 h-4/5" />
                  <div className={`absolute top-2 ltr:left-2 rtl:right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    allDone ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-primary)]/80 text-[var(--text-secondary)]'
                  }`}>
                    {allDone ? <Check size={14} /> : exIdx + 1}
                  </div>
                  {isExpanded && (
                    <div className="absolute top-2 ltr:right-2 rtl:left-2 w-6 h-6 rounded-full bg-[var(--bg-primary)]/80 flex items-center justify-center">
                      <motion.div animate={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={14} className="text-[var(--text-secondary)]" />
                      </motion.div>
                    </div>
                  )}
                </div>
                <p className={`text-body-sm font-medium text-center leading-tight ${allDone ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {exercise.name}
                </p>
                <p className="text-caption text-[var(--text-secondary)] text-center">
                  {completedCount}/{exercise.sets} sets
                </p>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-4">
                      {/* Target muscle */}
                      <div>
                        <span className="text-caption text-[var(--accent-tertiary)]">Target: {exercise.muscle}</span>
                      </div>

                      {/* Instructions */}
                      <p className="text-body-sm text-[var(--text-secondary)]">{exercise.instructions}</p>

                      {/* Sets table */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-caption text-[var(--text-tertiary)] px-1">
                          <span>{t('set')}</span>
                          <span className="text-center">{t('weight')}</span>
                          <span className="text-center">{t('reps')}</span>
                          <span></span>
                        </div>
                        {exercise.completedSets.map((set, setIdx) => (
                          <div key={setIdx} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
                            <span className="text-body-sm text-[var(--text-secondary)] w-6">{setIdx + 1}</span>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))}
                              placeholder="kg"
                              className="h-10 rounded-lg bg-[var(--bg-tertiary)] text-center text-body-sm text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
                            />
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                              placeholder="reps"
                              className="h-10 rounded-lg bg-[var(--bg-tertiary)] text-center text-body-sm text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
                            />
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleSet(exIdx, setIdx)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                set.completed ? 'bg-[var(--accent-primary)]' : 'border-2 border-[var(--text-tertiary)]'
                              }`}
                            >
                              {set.completed && <Check size={16} className="text-white" />}
                            </motion.button>
                          </div>
                        ))}
                      </div>

                      {/* Mistakes */}
                      <div className="bg-[var(--bg-primary)] rounded-lg p-3">
                        <p className="text-caption text-[var(--accent-danger)] mb-1">{t('commonMistakes')}</p>
                        {exercise.mistakes.map((m, i) => (
                          <p key={i} className="text-body-sm text-[var(--text-tertiary)]">• {m}</p>
                        ))}
                      </div>

                      {/* Rest timer button */}
                      <button
                        onClick={() => startRest(exercise.restSeconds)}
                        className="flex items-center gap-2 text-body-sm text-[var(--accent-primary)]"
                      >
                        <Timer size={16} /> Start Rest ({exercise.restSeconds}s)
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Control bar — pinned just above BottomNav. BottomNav's real height is
          64px plus the iPhone home-indicator safe area, so this has to account for
          that too or it visually collides with/hides behind the nav on a real phone. */}
      <div
        className="fixed left-0 right-0 px-4 py-3 bg-[var(--bg-secondary)] border-t border-white/5 z-40"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={completeWorkout}
          className="btn-primary"
          style={{ height: 48 }}
        >
          Complete Workout
        </button>
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {restTimer.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="var(--accent-primary)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - restTimer.seconds / restTimer.total)}
                    className="transition-all duration-1000 linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-display text-[var(--text-primary)]">{restTimer.seconds}</span>
                </div>
              </div>
              <p className="text-body text-[var(--text-secondary)] mb-4">{t('restTime')}</p>
              <div className="flex gap-3">
                <button onClick={() => setRestTimer(rt => ({ ...rt, seconds: rt.seconds + 15 }))} className="btn-secondary" style={{ width: 'auto', padding: '0 20px', height: 40 }}>+15s</button>
                <button onClick={() => setRestTimer({ active: false, seconds: 0, total: 0 })} className="btn-secondary" style={{ width: 'auto', padding: '0 20px', height: 40 }}>{t('skip')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <ConfettiCelebration trigger={showCelebration} />
      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

// ==================== WorkoutLibrary ====================
const ALL_EXERCISES = Object.values(WORKOUT_SCHEDULE).flatMap(w => w.exercises);

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core'];

const MUSCLE_MAP: Record<string, string> = {
  'Shoulder Press': 'Shoulders', 'Lateral Raise': 'Shoulders', 'Rear Delt Fly': 'Shoulders',
  'Upright Row': 'Shoulders', 'Shrugs': 'Shoulders',
  'Lat Pulldown': 'Back', 'Seated Cable Row': 'Back', 'Chest Supported Row': 'Back',
  'Straight Arm Pulldown': 'Back', 'Face Pull': 'Back',
  'Bench Press': 'Chest', 'Incline Dumbbell Press': 'Chest', 'Chest Fly': 'Chest', 'Push Ups': 'Chest',
  'Squat': 'Legs', 'Romanian Deadlift': 'Legs', 'Leg Press': 'Legs',
  'Leg Curl': 'Legs', 'Leg Extension': 'Legs', 'Standing Calf Raise': 'Legs',
  'Barbell Curl': 'Arms', 'Hammer Curl': 'Arms', 'Cable Curl': 'Arms',
  'Triceps Pushdown': 'Arms', 'Overhead Extension': 'Arms', 'Dips': 'Arms',
};

export function WorkoutLibrary() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('All');

  const filtered = ALL_EXERCISES.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = activeMuscle === 'All' || MUSCLE_MAP[ex.name] === activeMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl bg-[var(--bg-primary)]/80 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft size={24} className="text-[var(--text-primary)]" />
          </button>
          <h1 className="text-h3 text-[var(--text-primary)]">{t('exerciseLibrary')}</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search') + '...'}
            className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {MUSCLE_GROUPS.map(g => (
            <button key={g} onClick={() => setActiveMuscle(g)} className={`chip ${activeMuscle === g ? 'chip-active' : ''}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 grid grid-cols-2 gap-3">
        {filtered.map((ex, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/workout/exercise/${encodeURIComponent(ex.name)}`)}
            className="card flex flex-col items-center text-center gap-2 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-full aspect-square rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden">
              <ExerciseAnimation name={ex.name} muscle={ex.muscle} className="w-4/5 h-4/5" />
            </div>
            <p className="text-body-sm font-medium text-[var(--text-primary)] leading-tight">{ex.name}</p>
            <span className="chip" style={{ height: 22, padding: '0 8px', fontSize: 10 }}>{ex.muscle}</span>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-body text-[var(--text-tertiary)] py-8">{t('noExercisesFound')}</p>
        )}
      </div>
    </div>
  );
}

// ==================== MealPlanner ====================
// Builds an actual meal suggestion from the real food database (@/data/foods)
// instead of a handful of hardcoded example meals. It's a *suggestion* tool
// (like the old placeholder was meant to be) -- it doesn't log anything to
// the user's diary on its own; Shuffle/Generieren just re-roll the picks.
const MEAL_SLOTS: { nameKey: string; ratio: number; categories: string[] }[] = [
  { nameKey: 'breakfast', ratio: 0.25, categories: ['Carbs', 'Protein', 'Dairy', 'Fruits'] },
  { nameKey: 'lunch', ratio: 0.35, categories: ['Protein', 'Carbs', 'Vegetables'] },
  { nameKey: 'snack', ratio: 0.15, categories: ['Fruits', 'Dairy', 'Protein'] },
  { nameKey: 'dinner', ratio: 0.25, categories: ['Protein', 'Carbs', 'Vegetables'] },
];

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_TO_FULL: Record<string, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const DAY_TO_KEY: Record<string, string> = { Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday', Sun: 'sunday' };

// Small deterministic RNG so a day's suggestion stays put across re-renders
// (switching tabs, coming back to the screen) and only changes when the
// person actually taps Shuffle or Generieren.
function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type PlannedItem = { food: FoodItem; qty: number };
type PlannedMeal = { nameKey: string; items: PlannedItem[] };

function generateMeal(rng: () => number, slot: (typeof MEAL_SLOTS)[number], targetCals: number): PlannedMeal {
  const pool = QUICK_FOODS.filter(f => slot.categories.includes(f.category || ''));
  const pickCount = pool.length ? 2 + Math.floor(rng() * 2) : 0; // 2-3 items
  const items: PlannedItem[] = [];
  let runningCals = 0;
  for (let i = 0; i < pickCount; i++) {
    const food = pool[Math.floor(rng() * pool.length)];
    const remaining = Math.max(targetCals - runningCals, targetCals * 0.2);
    const share = remaining / (pickCount - i);
    const rawMultiplier = food.calories > 0 ? share / food.calories : 1;
    const multiplier = Math.min(Math.max(rawMultiplier, 0.5), 3);
    const qty = Math.round(multiplier * 2) / 2; // nearest 0.5x serving
    items.push({ food, qty });
    runningCals += food.calories * qty;
  }
  return { nameKey: slot.nameKey, items };
}

function generateDayPlan(daySeed: number, dailyCalories: number): PlannedMeal[] {
  const rng = makeRng(daySeed);
  return MEAL_SLOTS.map(slot => generateMeal(rng, slot, dailyCalories * slot.ratio));
}

function formatQty(food: FoodItem, qty: number): string {
  if (qty === 1) return food.serving;
  const m = food.serving.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/);
  if (m) {
    const val = Math.round(parseFloat(m[1]) * qty);
    return `${val}${m[2]}`;
  }
  return `${qty}× ${food.serving}`;
}

function mealTotals(meal: PlannedMeal) {
  return meal.items.reduce(
    (acc, { food, qty }) => ({
      cals: acc.cals + food.calories * qty,
      p: acc.p + food.protein * qty,
      c: acc.c + food.carbs * qty,
      f: acc.f + food.fat * qty,
    }),
    { cals: 0, p: 0, c: 0, f: 0 }
  );
}

export function MealPlanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useApp();
  const targets = useDailyTargets();
  const [activeDay, setActiveDay] = useState('Mon');
  // Bumped per-day to force a fresh random plan; keeps each day's suggestion
  // stable until Shuffle (this day) or Generieren (whole week) is pressed.
  const [seedVersion, setSeedVersion] = useState<Record<string, number>>({});

  const dayMeals = useMemo(() => {
    const version = seedVersion[activeDay] ?? 0;
    const daySeed = (DAY_ORDER.indexOf(activeDay) + 1) * 97 + version * 7919 + 13;
    return generateDayPlan(daySeed, targets.calories);
  }, [activeDay, seedVersion, targets.calories]);

  const isRestDay = (state.weeklySchedule[DAY_TO_FULL[activeDay]] ?? REST_WORKOUT_ID) === REST_WORKOUT_ID;

  const totals = dayMeals.reduce(
    (acc, meal) => {
      const mt = mealTotals(meal);
      return { cals: acc.cals + mt.cals, p: acc.p + mt.p, c: acc.c + mt.c, f: acc.f + mt.f };
    },
    { cals: 0, p: 0, c: 0, f: 0 }
  );

  const shuffleDay = () => setSeedVersion(v => ({ ...v, [activeDay]: (v[activeDay] ?? 0) + 1 }));
  const generateWeek = () =>
    setSeedVersion(v => {
      const next = { ...v };
      DAY_ORDER.forEach(d => {
        next[d] = (next[d] ?? 0) + 1;
      });
      return next;
    });

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft size={24} className="text-[var(--text-primary)]" />
          </button>
          <h1 className="text-h3 text-[var(--text-primary)]">{t('mealPlanner')}</h1>
        </div>
        <p className="text-caption text-[var(--accent-primary)] mt-1">
          {targets.calories} cal · {targets.protein}g P · {targets.carbs}g C · {targets.fat}g F
        </p>
      </div>

      {/* Day Selector */}
      <div className="px-4 mt-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {DAY_ORDER.map(d => (
            <button key={d} onClick={() => setActiveDay(d)} className={`chip ${activeDay === d ? 'chip-active' : ''}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeDay + '-' + (seedVersion[activeDay] ?? 0)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 mt-4 space-y-3"
      >
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-h3 text-[var(--text-primary)]">{t(DAY_TO_KEY[activeDay] as any)}</h3>
              <span className="text-caption text-[var(--accent-primary)]">{t(isRestDay ? 'restDay' : 'trainingDay')}</span>
            </div>
            <button onClick={shuffleDay} className="flex items-center gap-1 text-body-sm text-[var(--accent-primary)]">
              <Shuffle size={14} /> {t('shuffle')}
            </button>
          </div>

          {dayMeals.map((meal, i) => {
            const mt = mealTotals(meal);
            return (
              <div key={i} className="py-3 border-b border-white/5 last:border-0">
                <p className="text-body font-medium text-[var(--text-primary)]">{t(meal.nameKey as any)}</p>
                <p className="text-body-sm text-[var(--text-secondary)] mt-1">
                  {meal.items.length
                    ? meal.items.map(({ food, qty }) => `${food.name} (${formatQty(food, qty)})`).join(' + ')
                    : t('noData')}
                </p>
                <p className="text-caption text-[var(--text-tertiary)] mt-1">
                  {Math.round(mt.cals)} {t('calories')} · P:{Math.round(mt.p)}g · C:{Math.round(mt.c)}g · F:{Math.round(mt.f)}g
                </p>
              </div>
            );
          })}

          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-body-sm text-[var(--accent-primary)]">
              {t('calories')}: {Math.round(totals.cals)} · P:{Math.round(totals.p)}g · C:{Math.round(totals.c)}g · F:{Math.round(totals.f)}g
              {Math.abs(totals.cals - targets.calories) < 150 && ' ✓ ' + t('onTrack')}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="px-4 mt-4">
        <button onClick={generateWeek} className="btn-primary flex items-center justify-center gap-2">
          <Shuffle size={18} /> {t('generate')}
        </button>
      </div>
    </div>
  );
}

// ==================== EditFood ====================
export function EditFood() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { meal, index } = useParams<{ meal: string; index: string }>();
  const { state, dispatch } = useApp();
  const [toast, setToast] = useState({ visible: false, message: '' });

  const todayKey = new Date().toISOString().split('T')[0];
  const nutritionDay = state.nutritionLog[todayKey];
  const foodItem = nutritionDay?.meals.find(m => m.name === meal)?.foods[Number(index)];

  const [quantity, setQuantity] = useState(100);
  const [targetMeal, setTargetMeal] = useState(meal || 'Breakfast');
  const multiplier = quantity / 100;

  if (!foodItem) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-body text-[var(--text-secondary)]">{t('noData')}</p>
      </div>
    );
  }

  const removeFood = () => {
    dispatch({ type: 'REMOVE_FOOD', payload: { mealName: meal || '', foodIndex: Number(index) } });
    setToast({ visible: true, message: 'Food removed' });
    setTimeout(() => navigate('/nutrition'), 800);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none truncate px-16">{foodItem.name}</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-4">
        {/* Nutrition preview */}
        <div className="card">
          <p className="text-metric text-[var(--accent-primary)] text-center">
            {Math.round(foodItem.calories * multiplier)}
          </p>
          <p className="text-caption text-[var(--text-secondary)] text-center">calories</p>
          <div className="flex justify-around mt-3">
            <div className="text-center"><p className="text-body-sm text-[var(--accent-primary)]">{(foodItem.protein * multiplier).toFixed(1)}g</p><p className="text-[10px] text-[var(--text-tertiary)]">{t('protein')}</p></div>
            <div className="text-center"><p className="text-body-sm text-[var(--accent-tertiary)]">{(foodItem.carbs * multiplier).toFixed(1)}g</p><p className="text-[10px] text-[var(--text-tertiary)]">{t('carbs')}</p></div>
            <div className="text-center"><p className="text-body-sm text-[var(--accent-secondary)]">{(foodItem.fat * multiplier).toFixed(1)}g</p><p className="text-[10px] text-[var(--text-tertiary)]">{t('fat')}</p></div>
          </div>
        </div>

        {/* Quantity */}
        <div className="card">
          <h3 className="text-body text-[var(--text-primary)] mb-3">Quantity: {quantity}g</h3>
          <input type="range" min={10} max={500} step={5} value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full accent-[var(--accent-primary)]" />
          <div className="flex gap-2 mt-3">
            {[50, 100, 150, 200].map(s => (
              <button key={s} onClick={() => setQuantity(s)} className={`chip ${quantity === s ? 'chip-active' : ''}`}>
                {s}g
              </button>
            ))}
          </div>
        </div>

        {/* Meal selector */}
        <div className="card">
          <h3 className="text-body text-[var(--text-primary)] mb-3">{t('moveTo')}</h3>
          <div className="flex gap-2">
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(m => (
              <button key={m} onClick={() => setTargetMeal(m)} className={`chip ${targetMeal === m ? 'chip-active' : ''}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => { setToast({ visible: true, message: t('changesSaved') }); setTimeout(() => navigate('/nutrition'), 500); }} className="btn-primary">
          {t('save')}
        </button>

        <button onClick={removeFood} className="btn-secondary flex items-center justify-center gap-2 text-[var(--accent-danger)]">
          <Trash2 size={16} /> {t('remove')} - {meal}
        </button>
      </motion.div>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
