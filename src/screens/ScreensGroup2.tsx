// Merged screen file — combines: NutritionHub, Achievements, GoalProjection, Onboarding
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Apple, Bot, Camera, ChevronLeft, Clock, Droplets, Flame, LineChart, Moon, Plus, Scale, ScanLine, Search, Sparkles, Star, Sun, Target, Trophy, Utensils, Zap } from 'lucide-react';
import { format, getDaysInMonth } from 'date-fns';
import { useApp, useDailyTargets } from '@/context/AppContext';
import type { FoodItem } from '@/types';
import { QUICK_FOODS } from '@/data/foods';
import { BottomNav, BottomSheet, CoachAvatar, ProgressRing, QuickLogFAB, Toast } from '@/components/SharedComponents';
import { useTranslation } from '@/i18n/i18nHooks';

// ==================== NutritionHub ====================

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export function NutritionHub() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const targets = useDailyTargets();
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const nutrition = state.nutritionLog[todayKey] || { meals: [{ name: 'Breakfast', foods: [] }, { name: 'Lunch', foods: [] }, { name: 'Snack', foods: [] }, { name: 'Dinner', foods: [] }] };

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState('All');
  const [toast, setToast] = useState({ visible: false, message: '' });

  const calProgress = Math.min((state.dailyLog.calories / targets.calories) * 100, 100);
  const proteinProgress = Math.min((state.dailyLog.protein / targets.protein) * 100, 100);
  const carbsProgress = Math.min((state.dailyLog.carbs / targets.carbs) * 100, 100);

  const addFood = (food: FoodItem) => {
    dispatch({ type: 'ADD_FOOD', payload: { mealName: selectedMeal, food } });
    setShowFoodSearch(false);
    setShowAddSheet(false);
    setToast({ visible: true, message: `${food.name} added to ${selectedMeal}` });
  };

  const openAddFood = (mealName: string) => {
    setSelectedMeal(mealName);
    setShowAddSheet(true);
  };

  const filteredFoods = QUICK_FOODS
    .filter(f => selectedFoodCategory === 'All' || f.category === selectedFoodCategory)
    .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const addWater = (amount: number) => {
    dispatch({ type: 'LOG_WATER', payload: amount });
    setToast({ visible: true, message: `+${amount >= 1 ? amount + 'L' : amount * 1000 + 'ml'} water` });
  };

  const weeklyData = [
    { day: 'Mon', calories: 2300, target: 2350 },
    { day: 'Tue', calories: 2200, target: 2350 },
    { day: 'Wed', calories: 1900, target: 2050 },
    { day: 'Thu', calories: 2400, target: 2350 },
    { day: 'Fri', calories: 2350, target: 2350 },
    { day: 'Sat', calories: 1800, target: 2050 },
    { day: 'Sun', calories: 2000, target: 2050 },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-24">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-h1 text-[var(--text-primary)]">{t('nutritionHub')}</h1>
        <p className="text-caption text-[var(--text-secondary)]">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="px-4 space-y-3">
        {/* Macro Rings */}
        <motion.div variants={itemVariants} className="card" style={{ borderRadius: 16, padding: 20 }}>
          <h2 className="text-h3 text-[var(--text-primary)] mb-1">{t('todaysNutrition')}</h2>
          <div className="flex justify-around items-center mt-4">
            <div className="flex flex-col items-center">
              <ProgressRing size={90} strokeWidth={7} progress={calProgress} color="var(--accent-secondary)" centerText={`${state.dailyLog.calories}`} subText={`/${targets.calories}`} />
              <span className="text-caption text-[var(--text-secondary)] mt-1">kcal</span>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing size={70} strokeWidth={6} progress={proteinProgress} color="var(--accent-primary)" centerText={`${state.dailyLog.protein}g`} subText={`/${targets.protein}g`} />
              <span className="text-caption text-[var(--text-secondary)] mt-1">{t('protein')}</span>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing size={70} strokeWidth={6} progress={carbsProgress} color="var(--accent-tertiary)" centerText={`${state.dailyLog.carbs}g`} subText={`/${targets.carbs}g`} />
              <span className="text-caption text-[var(--text-secondary)] mt-1">{t('carbs')}</span>
            </div>
          </div>
          <div className="flex justify-between mt-4 px-2">
            <div className="text-center">
              <span className="text-body-sm text-[var(--text-secondary)]">{t('fat')} </span>
              <span className="text-body-sm text-[var(--text-primary)]">{state.dailyLog.fat}/{targets.fat}g</span>
            </div>
            <div className="text-center">
              <span className="text-body-sm text-[var(--text-secondary)]">{t('fiber')} </span>
              <span className="text-body-sm text-[var(--text-primary)]">{state.dailyLog.fiber}/{targets.fiber}g</span>
            </div>
          </div>
        </motion.div>

        {/* Meals */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-h3 text-[var(--text-primary)]">{t('todaysMeals')}</h3>
            <button onClick={() => navigate('/nutrition/planner')} className="text-body-sm text-[var(--accent-primary)]">{t('mealPlanner')}</button>
          </div>
          <div className="space-y-2">
            {nutrition.meals.map(meal => {
              const mealCals = meal.foods.reduce((s, f) => s + f.calories, 0);
              const mealProtein = meal.foods.reduce((s, f) => s + f.protein, 0);
              const mealCarbs = meal.foods.reduce((s, f) => s + f.carbs, 0);
              const mealFat = meal.foods.reduce((s, f) => s + f.fat, 0);

              return (
                <div key={meal.name} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body font-medium text-[var(--text-primary)]">{meal.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm text-[var(--text-secondary)]">{mealCals} kcal</span>
                      <button onClick={() => openAddFood(meal.name)} className="w-7 h-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <Plus size={14} className="text-[var(--accent-primary)]" />
                      </button>
                    </div>
                  </div>
                  {meal.foods.length === 0 ? (
                    <p className="text-body-sm text-[var(--text-tertiary)] italic">{t('noFoodsLogged')}</p>
                  ) : (
                    <div className="space-y-1">
                      {meal.foods.map((food, fi) => (
                        <div key={fi} className="flex justify-between text-body-sm">
                          <span className="text-[var(--text-secondary)]">{food.name}</span>
                          <span className="text-[var(--text-tertiary)]">{food.calories} cal</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-caption text-[var(--text-tertiary)] mt-1">
                    P: {mealProtein}g · C: {mealCarbs}g · F: {mealFat}g
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Water Tracker */}
        <motion.div variants={itemVariants} className="card" style={{ background: 'linear-gradient(180deg, rgba(12,74,110,0.15) 0%, var(--bg-secondary) 100%)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ProgressRing size={100} strokeWidth={8} progress={Math.min((state.dailyLog.water / targets.water) * 100, 100)} color="#38BDF8" centerText={`${state.dailyLog.water.toFixed(1)}L`} subText={`/ ${targets.water}L`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Droplets size={18} className="text-[#38BDF8]" />
                  <span className="text-body text-[var(--text-primary)]">{t('water')}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {[{ l: 0.25, label: '+250ml' }, { l: 0.5, label: '+500ml' }, { l: 1, label: '+1L' }].map(a => (
                    <button key={a.label} onClick={() => addWater(a.l)} className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-primary)] active:scale-95 transition-transform">
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weekly Calorie Chart */}
        <motion.div variants={itemVariants} className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('thisWeek')}</h3>
          <div className="flex items-end justify-between gap-1 h-24">
            {weeklyData.map((d, i) => {
              const pct = Math.min((d.calories / d.target) * 100, 120);
              const color = pct > 110 ? 'var(--accent-danger)' : pct > 95 ? 'var(--accent-secondary)' : 'var(--accent-primary)';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[var(--bg-tertiary)] rounded-t-md relative overflow-hidden" style={{ height: 80 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(pct / 120) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="absolute bottom-0 w-full rounded-t-md"
                      style={{ background: color }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{d.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Nutrition Tip */}
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '2px solid var(--accent-primary)' }}>
          <div className="flex items-start gap-2">
            <Zap size={16} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
            <p className="text-body-sm text-[var(--text-primary)]">
              Tip: Eating protein within 30 minutes post-workout maximizes muscle protein synthesis.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Add Food Bottom Sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)}>
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-h3 text-[var(--text-primary)] text-center mb-6">Add to {selectedMeal}</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Search size={22} />, label: t('searchFoodOption'), action: () => { setShowAddSheet(false); setShowFoodSearch(true); } },
              { icon: <Camera size={22} />, label: t('aiFoodPhoto'), action: () => navigate('/nutrition/ai-scan') },
              { icon: <ScanLine size={22} />, label: t('scanBarcode'), action: () => navigate('/nutrition/barcode') },
              { icon: <Star size={22} />, label: t('favoritesOption'), action: () => { setShowAddSheet(false); setShowFoodSearch(true); } },
              { icon: <Clock size={22} />, label: t('recentOption'), action: () => { setShowAddSheet(false); setShowFoodSearch(true); } },
              { icon: <Apple size={22} />, label: t('customFoodOption'), action: () => { setShowAddSheet(false); setShowFoodSearch(true); } },
              { icon: <Utensils size={22} />, label: t('mealRecipeOption'), action: () => { setShowAddSheet(false); setShowFoodSearch(true); } },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex flex-col items-center gap-2 py-4 rounded-xl bg-[var(--bg-tertiary)] active:scale-95 transition-transform"
              >
                <span className="text-[var(--accent-primary)]">{item.icon}</span>
                <span className="text-body-sm text-[var(--text-primary)]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* Food Search Bottom Sheet */}
      <BottomSheet isOpen={showFoodSearch} onClose={() => setShowFoodSearch(false)}>
        <div className="px-4 pt-2 pb-6">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchFoods')}
              autoFocus
              className="w-full h-11 pl-10 pr-4 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
            {['All', 'Protein', 'Carbs', 'Vegetables', 'Fruits', 'Dairy'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFoodCategory(cat)}
                className={`chip whitespace-nowrap ${selectedFoodCategory === cat ? 'chip-active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
          {filteredFoods.length === 0 && (
            <p className="text-body-sm text-[var(--text-tertiary)] text-center py-6">{t('noData')}</p>
          )}
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
            {filteredFoods.map((food, i) => (
              <button
                key={i}
                onClick={() => addFood(food)}
                className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-left"
              >
                <div>
                  <p className="text-body text-[var(--text-primary)]">{food.name}</p>
                  <p className="text-caption text-[var(--text-tertiary)]">{food.serving}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-sm text-[var(--text-secondary)]">{food.calories} cal</p>
                  <p className="text-caption text-[var(--text-tertiary)]">P:{food.protein}g C:{food.carbs}g</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomNav />
      <QuickLogFAB />
      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

// ==================== Achievements ====================
const ICON_MAP: Record<string, React.ReactNode> = {
  trophy: <Trophy size={28} />,
  zap: <Zap size={28} />,
  target: <Target size={28} />,
  droplets: <Droplets size={28} />,
  scale: <Scale size={28} />,
  sun: <Sun size={28} />,
  moon: <Moon size={28} />,
  flame: <Flame size={28} />,
};

const CATEGORY_MAP: Record<string, string> = {
  'All': 'allCategories',
  'Workouts': 'workouts',
  'Nutrition': 'nutrition',
  'Streaks': 'streaks',
  'Milestones': 'milestones',
  'Special': 'special',
};
const CATEGORIES = ['All', 'Workouts', 'Nutrition', 'Streaks', 'Milestones', 'Special'];

export function Achievements() {
  const { t } = useTranslation();
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? state.achievements
    : state.achievements.filter(a => a.category === activeCategory);

  // Calendar days -- the real number of days in the current month (not a
  // fixed 30, which drew a wrong/incomplete grid for 28/29/31-day months),
  // and "completed" is a real check against what was actually logged that
  // day (a finished workout, or any food logged), not a hardcoded list of
  // days that never changes.
  const now = new Date();
  const days = Array.from({ length: getDaysInMonth(now) }, (_, i) => i + 1);
  const dayIsCompleted = (day: number) => {
    const dateStr = format(new Date(now.getFullYear(), now.getMonth(), day), 'yyyy-MM-dd');
    const workedOut = state.workoutLog[dateStr]?.completed;
    const ateSomething = (state.nutritionLog[dateStr]?.meals || []).some(m => m.foods.length > 0);
    return Boolean(workedOut || ateSomething);
  };
  const today = now.getDate();

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('achievements')}</h1>
      </div>

      {/* Streak Hero */}
      <div className="px-4 mb-4">
        <div className="card py-8 text-center" style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(245,158,11,0.08) 100%)' }}>
          <Flame size={48} className="text-gradient-amber animate-flame-pulse mx-auto mb-2" />
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-display text-gradient-amber"
          >
            {state.streaks.current}
          </motion.p>
          <h2 className="text-h2 text-[var(--text-primary)] mt-1">{t('dayStreak')}</h2>
          <p className="text-body text-[var(--text-secondary)] mt-2 px-8">
            {t('keepItUpHabits')}
          </p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-caption text-[var(--text-tertiary)]">{t('longestStreakLabel')}</p>
              <p className="text-body-sm text-[var(--text-primary)]">{state.streaks.longest} days</p>
            </div>
            <div className="text-center">
              <p className="text-caption text-[var(--text-tertiary)]">{t('workoutStreakLabel')}</p>
              <p className="text-body-sm text-[var(--text-primary)]">{state.streaks.workoutStreak} days</p>
            </div>
            <div className="text-center">
              <p className="text-caption text-[var(--text-tertiary)]">{t('nutritionStreakLabel')}</p>
              <p className="text-body-sm text-[var(--text-primary)]">{state.streaks.nutritionStreak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Chips */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`chip ${activeCategory === cat ? 'chip-active' : ''}`}
            >
              {t(CATEGORY_MAP[cat] as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((achievement, i) => {
            const isUnlocked = !!achievement.unlockedAt;
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card flex flex-col items-center text-center py-5 aspect-square justify-center ${
                  isUnlocked ? 'border border-[var(--accent-primary)]/30' : ''
                }`}
              >
                <div className={`mb-2 ${isUnlocked ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)] opacity-40 grayscale'}`}>
                  {ICON_MAP[achievement.icon] || <Star size={28} />}
                </div>
                <p className={`text-body-sm font-medium ${isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                  {achievement.title}
                </p>
                <p className="text-caption text-[var(--text-tertiary)] mt-1 px-2 line-clamp-2">
                  {achievement.description}
                </p>
                {isUnlocked && (
                  <span className="text-[10px] text-[var(--accent-primary)] mt-1">{t('unlocked')}!</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="px-4 pb-8">
        <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('streakHistory')}</h3>
        <div className="card">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <span key={i} className="text-caption text-[var(--text-tertiary)]">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {days.map(day => {
              const isCompleted = day <= today && dayIsCompleted(day);
              const isToday = day === today;
              return (
                <div key={day} className="relative py-2">
                  <span className={`text-body-sm ${isToday ? 'font-semibold text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                    {day}
                  </span>
                  {isCompleted && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                  )}
                  {isToday && (
                    <div className="absolute inset-0 border border-[var(--accent-primary)] rounded-lg -z-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== GoalProjection ====================
export function GoalProjection() {
  const { t } = useTranslation();
  const { state } = useApp();
  const navigate = useNavigate();

  const currentWeight = state.measurements[state.measurements.length - 1]?.weight ?? state.user?.currentWeight ?? 0;
  const goalWeight = state.user?.goalWeight || 78;
  const weightLost = (state.user?.currentWeight || 90) - currentWeight;
  const weeksLeft = Math.ceil((currentWeight - goalWeight) / 0.8);
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + weeksLeft * 7);
  const probability = (() => {
    const requiredWeeklyRate = 0.8; // kg/week target pace used elsewhere on this screen
    const history = state.measurements;
    if (history.length < 2) return 82; // not enough data yet: reasonable neutral estimate
    const recent = history.slice(-4);
    const span = recent.length - 1;
    const actualWeeklyRate = span > 0 ? (recent[0].weight - recent[recent.length - 1].weight) / span : 0;
    const ratio = requiredWeeklyRate > 0 ? actualWeeklyRate / requiredWeeklyRate : 1;
    return Math.max(45, Math.min(98, Math.round(65 + ratio * 25)));
  })();

  const scenarios = [
    { actionKey: 'increaseCardio', resultKey: 'reachEarlier', days: 5, color: 'var(--accent-primary)' },
    { actionKey: 'reduceCalories', resultKey: 'reachEarlier', days: 3, color: 'var(--accent-primary)' },
    { actionKey: 'addWorkout', resultKey: 'reachEarlier', days: 7, color: 'var(--accent-primary)' },
    { actionKey: 'currentPlan', resultKey: 'onTrack', days: 0, color: 'var(--accent-tertiary)' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('goalProjection')}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card py-6 text-center"
          style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(52,211,153,0.08) 100%)' }}
        >
          <h2 className="text-h1 text-[var(--accent-primary)]">{t('onTrack')}</h2>
          <p className="text-body text-[var(--text-primary)] mt-2">{t('estimatedGoal')}: {goalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-body-sm text-[var(--text-secondary)]">{weeksLeft * 7} {t('daysRemaining')}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="text-metric text-[var(--accent-primary)] mt-3"
          >
            {probability}%
          </motion.p>
          <p className="text-caption text-[var(--text-secondary)]">{t('probability')}</p>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] mt-3 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(weightLost / ((state.user?.currentWeight || 90) - goalWeight)) * 100}%` }} transition={{ duration: 1.5 }} className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
          </div>
        </motion.div>

        {/* Chart */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('projection')}</h3>
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="w-full h-32">
            <defs>
              <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Goal line */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2,2" />
            {/* Historical */}
            <polyline points="0,5 10,8 20,12 30,15" fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" />
            {/* Projected */}
            <polyline points="30,15 40,20 50,28 60,35 70,42 80,48 90,50" fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeDasharray="3,2" strokeLinecap="round" />
            {/* Confidence area */}
            <polygon points="30,15 40,18 50,24 60,30 70,38 80,44 90,48 90,52 80,52 70,46 60,40 50,32 40,22 30,18" fill="url(#projGrad)" />
            {/* Today marker */}
            <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="0.3" strokeDasharray="2,2" />
          </svg>
        </div>

        {/* What-If Scenarios */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('whatIf')}</h3>
          <div className="space-y-2">
            {scenarios.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-tertiary)]"
              >
                <span className="text-body-sm text-[var(--text-primary)]">{t(s.actionKey as any)}</span>
                <span className="text-body-sm" style={{ color: s.color }}>
                  {s.days > 0 ? `${t(s.resultKey as any)} ${s.days} ${t('daysEarlier')}` : t('onTrack')}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coach Analysis */}
        <div className="card" style={{ borderLeft: '2px solid var(--accent-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CoachAvatar size={24} />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('coachAnalysis')}</h3>
          </div>
          <p className="text-body text-[var(--text-primary)]">
            {t('coachAnalysis')} — {t('onTrack')}. {t('estimatedGoal')}: {goalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== Onboarding ====================
// No shipped photo assets exist for these slides (the app has none bundled),
// so each slide is an original in-code illustration instead of an <img> that
// would 404 through the SPA fallback and silently render as a broken image.
const pages = [
  {
    icon: <LineChart size={64} strokeWidth={1.75} />,
    gradient: 'linear-gradient(160deg, rgba(96,165,250,0.25) 0%, rgba(96,165,250,0.03) 100%)',
    accent: '#60A5FA',
    titleKey: 'onboardingSlide1Title' as const,
    descKey: 'onboardingSlide1Desc' as const,
  },
  {
    icon: <Apple size={64} strokeWidth={1.75} />,
    gradient: 'linear-gradient(160deg, rgba(52,211,153,0.25) 0%, rgba(52,211,153,0.03) 100%)',
    accent: '#34D399',
    titleKey: 'onboardingSlide2Title' as const,
    descKey: 'onboardingSlide2Desc' as const,
  },
  {
    icon: <Bot size={64} strokeWidth={1.75} />,
    gradient: 'linear-gradient(160deg, rgba(245,158,11,0.25) 0%, rgba(245,158,11,0.03) 100%)',
    accent: '#F59E0B',
    titleKey: 'onboardingSlide3Title' as const,
    descKey: 'onboardingSlide3Desc' as const,
  },
];

const swipeVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

function OnboardingIllustration({ icon, gradient, accent }: { icon: React.ReactNode; gradient: string; accent: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center relative"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border" style={{ borderColor: `${accent}33` }} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-28 h-28 rounded-full border" style={{ borderColor: `${accent}4D` }} />
      </div>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
        className="w-20 h-20 rounded-full flex items-center justify-center relative"
        style={{ background: accent, color: '#0B0F14', boxShadow: `0 0 40px ${accent}66` }}
      >
        {icon}
      </motion.div>
      <Sparkles size={20} className="absolute top-6 right-10" style={{ color: accent, opacity: 0.6 }} />
      <Sparkles size={14} className="absolute bottom-8 left-8" style={{ color: accent, opacity: 0.4 }} />
    </div>
  );
}

export function Onboarding() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();

  const goTo = (newPage: number) => {
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-primary)] relative">
      {/* Image carousel */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center px-8">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-8 shadow-2xl">
              <OnboardingIllustration
                icon={pages[page].icon}
                gradient={pages[page].gradient}
                accent={pages[page].accent}
              />
            </div>
            <h2 className="text-h2 text-[var(--text-primary)] text-center mb-3">
              {t(pages[page].titleKey)}
            </h2>
            <p className="text-body-lg text-[var(--text-secondary)] text-center max-w-xs">
              {t(pages[page].descKey)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-12 flex flex-col items-center gap-6">
        {/* Page dots */}
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? 'w-8 bg-[var(--accent-primary)]' : 'w-2 bg-[var(--bg-tertiary)]'
              }`}
            />
          ))}
        </div>

        {/* CTA button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => page < pages.length - 1 ? goTo(page + 1) : navigate('/setup')}
          className="btn-primary glow-green"
        >
          {page < pages.length - 1 ? t('continue') : t('getStarted')}
        </motion.button>

        {/* Skip */}
        {page < pages.length - 1 && (
          <button
            onClick={() => navigate('/setup')}
            className="text-body-sm text-[var(--text-tertiary)]"
          >
            {t('skip')}
          </button>
        )}
      </div>
    </div>
  );
}
