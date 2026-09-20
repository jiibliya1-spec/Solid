// Merged screen file — combines: Dashboard, WorkoutSchedule, FoodDetail, ExerciseDetail
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ArrowDown, BedDouble, Bell, ChevronLeft, ChevronRight, Droplets, Dumbbell, Flame, Heart, Moon, Play, Plus, Quote, Settings, Star, Target, Timer, TrendingUp, Trash2, Trophy } from 'lucide-react';
import { addDays, format, startOfWeek } from 'date-fns';
import { getCardioForWeek, getCurrentWeek, useApp, useDailyTargets } from '@/context/AppContext';
import type { FoodItem } from '@/types';
import { CARDIO_PROGRESSION, WORKOUT_SCHEDULE, BUILT_IN_WORKOUTS, REST_WORKOUT_ID, resolveWorkout } from '@/types';
import { Avatar, BottomNav, BottomSheet, ProgressRing, QuickLogFAB, Toast } from '@/components/SharedComponents';
import { ExerciseAnimation } from '@/components/ExerciseAnimation';
import { useTranslation } from '@/i18n/i18nHooks';

// ==================== Dashboard ====================
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const QUOTE_KEYS = [
  'quote1',
  'quote2', 
  'quote3',
  'quote4',
  'quote5',
] as const;

export function Dashboard() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const targets = useDailyTargets();
  const week = state.user ? getCurrentWeek(state.user.startDate) : 1;
  const cardioMins = getCardioForWeek(week);
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayWorkout = state.workoutLog[todayKey];
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [quoteKey] = useState(() => QUOTE_KEYS[Math.floor(Math.random() * QUOTE_KEYS.length)]);

  const unreadCount = state.notifications.filter(n => !n.read).length;

  const calProgress = Math.min((state.dailyLog.calories / targets.calories) * 100, 100);
  const proteinProgress = Math.min((state.dailyLog.protein / targets.protein) * 100, 100);
  const carbsProgress = Math.min((state.dailyLog.carbs / targets.carbs) * 100, 100);
  const waterProgress = Math.min((state.dailyLog.water / targets.water) * 100, 100);
  const fatProgress = Math.min((state.dailyLog.fat / targets.fat) * 100, 100);
  const fiberProgress = Math.min((state.dailyLog.fiber / targets.fiber) * 100, 100);

  const weightLost = state.measurements.length > 1
    ? (state.measurements[state.measurements.length - 1].weight - state.measurements[0].weight).toFixed(1)
    : '0';

  const addWater = (amount: number) => {
    dispatch({ type: 'LOG_WATER', payload: amount });
    setToast({ visible: true, message: `+${amount >= 1 ? amount + 'L' : amount * 1000 + 'ml'} water logged!` });
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-24">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-[var(--bg-primary)]/80"
      >
        <div>
          <h3 className="text-h3 text-[var(--accent-primary)]">Transform 90→78</h3>
          <p className="text-caption text-[var(--text-tertiary)]">Week {week} · Day {Math.min(week * 7, 84)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/notifications')} className="relative p-2">
            <Bell size={22} strokeWidth={1.5} className="text-[var(--text-primary)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent-danger)] animate-badge-bounce" />
            )}
          </button>
          <button onClick={() => navigate('/settings')} className="p-2">
            <Settings size={22} strokeWidth={1.5} className="text-[var(--text-primary)]" />
          </button>
        </div>
      </motion.header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-4 space-y-3 pt-2"
      >
        {/* Welcome */}
        <motion.div variants={itemVariants} className="flex items-center justify-between py-2">
          <div>
            <p className="text-body-lg text-[var(--text-primary)]">
              Good {getGreeting()}, <span className="font-semibold">{state.user?.name || 'User'}</span>
            </p>
            <p className="text-caption text-[var(--text-secondary)]">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--accent-primary)]">
            <Avatar avatar={state.user?.avatar} name={state.user?.name} size={48} className="w-full h-full" />
          </button>
        </motion.div>

        {/* Daily Targets Grid */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[var(--accent-primary)]" />
            <h2 className="text-h3 text-[var(--text-primary)]">{t('dailyTargets')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TargetCard icon={<Flame size={18} />} label={t('calories')} current={state.dailyLog.calories} target={targets.calories} unit="kcal" color="var(--accent-secondary)" progress={calProgress} />
            <TargetCard icon={<Dumbbell size={18} />} label={t('protein')} current={state.dailyLog.protein} target={targets.protein} unit="g" color="var(--accent-primary)" progress={proteinProgress} />
            <TargetCard icon={<Activity size={18} />} label={t('carbs')} current={state.dailyLog.carbs} target={targets.carbs} unit="g" color="var(--accent-tertiary)" progress={carbsProgress} />
            <TargetCard icon={<Droplets size={18} />} label={t('water')} current={state.dailyLog.water} target={targets.water} unit="L" color="var(--water-blue)" progress={waterProgress} />
          </div>
          {/* Fat & Fiber mini bars */}
          <div className="flex gap-3 mt-2">
            <div className="flex-1 card py-2 px-3">
              <div className="flex justify-between text-body-sm mb-1">
                <span className="text-[var(--text-secondary)]">{t('fat')}</span>
                <span className="text-[var(--text-primary)]">{state.dailyLog.fat}/{targets.fat}g</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${fatProgress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-[var(--accent-secondary)]" />
              </div>
            </div>
            <div className="flex-1 card py-2 px-3">
              <div className="flex justify-between text-body-sm mb-1">
                <span className="text-[var(--text-secondary)]">{t('fiber')}</span>
                <span className="text-[var(--text-primary)]">{state.dailyLog.fiber}/{targets.fiber}g</span>
              </div>
              <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${fiberProgress}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-[var(--accent-primary)]" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Today's Workout */}
        {todayWorkout && (
          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/workout')}
            className="card card-accent cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Dumbbell size={14} className="text-[var(--accent-primary)]" />
              <span className="text-caption text-[var(--accent-primary)] uppercase tracking-wider">{t('todaysWorkout')}</span>
            </div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-h2 text-[var(--text-primary)]">{todayWorkout.title}</h2>
                <p className="text-body-sm text-[var(--text-secondary)] mt-1">
                  {todayWorkout.exercises.length} exercises · ~50 minutes
                </p>
                <div className="mt-3 space-y-1">
                  {todayWorkout.exercises.slice(0, 2).map((ex, i) => (
                    <p key={i} className="text-body-sm text-[var(--text-tertiary)]">
                      {ex.name} — {ex.sets} sets × {ex.reps} reps
                    </p>
                  ))}
                  {todayWorkout.exercises.length > 2 && (
                    <p className="text-body-sm text-[var(--text-tertiary)]">+ {todayWorkout.exercises.length - 2} more exercises</p>
                  )}
                </div>
                <button className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-body-sm font-semibold bg-gradient-to-r from-[var(--accent-primary)] to-[#10B981]">
                  <Play size={16} fill="white" /> Start Workout
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cardio Card */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center gap-1.5 mb-1">
            <Timer size={14} className="text-[var(--accent-tertiary)]" />
            <span className="text-caption text-[var(--accent-tertiary)] uppercase tracking-wider">{t('cardioToday')}</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-h2 text-[var(--text-primary)]">{cardioMins} Minutes</h2>
              <p className="text-body-sm text-[var(--text-secondary)] mt-1">{t('cardioInstruction')}</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-[var(--accent-tertiary)]/30 flex items-center justify-center">
              <Timer size={24} className="text-[var(--accent-tertiary)]" />
            </div>
          </div>
        </motion.div>

        {/* Recovery Score */}
        <motion.div
          variants={itemVariants}
          onClick={() => navigate('/recovery')}
          className="card cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Heart size={14} className="text-[var(--accent-tertiary)]" />
            <span className="text-caption text-[var(--accent-tertiary)] uppercase tracking-wider">{t('recovery')}</span>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing size={80} strokeWidth={8} progress={75} color="var(--accent-tertiary)" centerText="75" subText={t("score")} />
            <div className="flex-1">
              <p className="text-body text-[var(--text-primary)] font-medium">{t("recoveryGood")}</p>
              <p className="text-body-sm text-[var(--text-secondary)] mt-1">{t("readyToCrush")}</p>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1 text-caption text-[var(--text-secondary)]">
                  <Moon size={12} /> 7.5h
                </div>
                <div className="flex items-center gap-1 text-caption text-[var(--text-secondary)]">
                  <Activity size={12} /> Low
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-[var(--text-tertiary)]" />
          </div>
        </motion.div>

        {/* Quick Trackers */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={18} className="text-[var(--water-blue)]" />
              <span className="text-body-sm text-[var(--text-primary)]">{t('water')}</span>
            </div>
            <p className="text-metric-sm text-[var(--water-blue)]">{state.dailyLog.water.toFixed(1)}L</p>
            <p className="text-caption text-[var(--text-secondary)]">/ {targets.water}L</p>
            <div className="flex gap-1 mt-2">
              {[{ l: 0.25, label: '+250ml' }, { l: 0.5, label: '+500ml' }].map(a => (
                <button key={a.label} onClick={() => addWater(a.l)} className="px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] text-[10px] text-[var(--text-primary)] active:scale-95 transition-transform">
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-[var(--accent-primary)]" />
              <span className="text-body-sm text-[var(--text-primary)]">{t('steps')}</span>
            </div>
            <p className="text-metric-sm text-[var(--text-primary)]">{state.dailyLog.steps.toLocaleString()}</p>
            <p className="text-caption text-[var(--text-secondary)]">/ {targets.steps.toLocaleString()}</p>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((state.dailyLog.steps / targets.steps) * 100, 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-[var(--accent-primary)]" />
            </div>
          </div>
        </motion.div>

        {/* Weight Trend Mini */}
        <motion.div
          variants={itemVariants}
          onClick={() => navigate('/progress')}
          className="card cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-h3 text-[var(--text-primary)]">{t('weightTrend')}</h3>
            </div>
            <ChevronRight size={18} className="text-[var(--text-tertiary)]" />
          </div>
          <MiniWeightChart measurements={state.measurements} />
          <div className="flex items-center justify-between mt-2">
            <span className="text-body-sm text-[var(--text-secondary)]">
              {state.measurements[state.measurements.length - 1]?.weight ?? 0} kg → {state.user?.goalWeight ?? 0} kg
            </span>
            <span className="flex items-center gap-1 text-body-sm text-[var(--accent-primary)]">
              <ArrowDown size={14} /> {Math.abs(Number(weightLost))} kg this week
            </span>
          </div>
        </motion.div>

        {/* Daily Motivation */}
        <motion.div variants={itemVariants} className="card" style={{ borderLeft: '2px solid var(--accent-secondary)' }}>
          <Quote size={32} className="text-[var(--text-tertiary)] opacity-30 mb-2" />
          <p className="text-body text-[var(--text-primary)] italic">"{t(quoteKey)}"</p>
          <p className="text-caption text-[var(--text-secondary)] mt-2">— Your AI Coach</p>
        </motion.div>

        {/* Streak + Achievements */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div
            onClick={() => navigate('/achievements')}
            className="card flex flex-col items-center justify-center py-5 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-1">
              <Flame size={24} className="text-gradient-amber animate-flame-pulse" />
              <span className="text-metric-sm text-gradient-amber">{state.streaks.current}</span>
            </div>
            <span className="text-caption text-[var(--text-secondary)] mt-1">{t('dayStreak')}</span>
          </div>
          <div
            onClick={() => navigate('/achievements')}
            className="card flex flex-col items-center justify-center py-5 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Trophy size={20} className="text-[var(--accent-secondary)] mb-1" />
            <span className="text-body-sm text-[var(--text-primary)]">
              {state.achievements.filter(a => a.unlockedAt).length}/{state.achievements.length}
            </span>
            <span className="text-caption text-[var(--text-secondary)]">{t('achievements')}</span>
          </div>
        </motion.div>
      </motion.div>

      <BottomNav />
      <QuickLogFAB />
      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

function TargetCard({ icon, label, current, target, unit, color, progress }: {
  icon: React.ReactNode; label: string; current: number; target: number; unit: string; color: string; progress: number;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-caption text-[var(--text-secondary)] uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-metric-sm text-[var(--text-primary)]">{label === 'Water' ? current.toFixed(1) : current}</span>
        <span className="text-caption text-[var(--text-secondary)]">/ {label === 'Water' ? target.toFixed(1) : target}{unit}</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--bg-tertiary)] mt-2 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }} className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function MiniWeightChart({ measurements }: { measurements: { date: string; weight: number }[] }) {
  const data = measurements.slice(-7);
  const min = Math.min(...data.map(d => d.weight)) - 0.5;
  const max = Math.max(...data.map(d => d.weight)) + 0.5;
  const range = max - min;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.weight - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-20">
      <defs>
        <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill="url(#miniGrad)" />
      <polyline points={points} fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.weight - min) / range) * 100;
        return (
          <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 2.5 : 1.5} fill={i === data.length - 1 ? '#34D399' : 'transparent'} stroke="#34D399" strokeWidth={0.5} />
        );
      })}
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// ==================== WorkoutSchedule ====================
export function WorkoutSchedule() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const week = state.user ? getCurrentWeek(state.user.startDate) : 1;
  const cardioMins = getCardioForWeek(week);
  const [offset, setOffset] = useState(0);
  const [pickerDay, setPickerDay] = useState<string | null>(null);
  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), offset * 7);

  const dayNameKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const allDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const pickWorkout = (workoutId: string) => {
    if (!pickerDay) return;
    dispatch({ type: 'SET_DAY_WORKOUT', payload: { day: pickerDay, workoutId } });
    setPickerDay(null);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('schedule')}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Week selector */}
        <div className="flex items-center justify-between">
          <button onClick={() => setOffset(o => o - 1)} className="p-2"><ChevronLeft size={20} className="text-[var(--text-primary)]" /></button>
          <div className="text-center">
            <p className="text-body text-[var(--text-primary)]">Week {week + offset}</p>
            <p className="text-caption text-[var(--text-secondary)]">{format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d')}</p>
          </div>
          <button onClick={() => setOffset(o => o + 1)} className="p-2"><ChevronRight size={20} className="text-[var(--text-primary)]" /></button>
        </div>
        <p className="text-caption text-[var(--text-tertiary)] text-center">Tap any day to change what you do on it — this repeats every week.</p>

        {/* Day cards */}
        <div className="space-y-2">
          {dayNameKeys.map((dayKey, idx) => {
            const dayName = allDayNames[idx];
            const workoutId = state.weeklySchedule[dayName] ?? REST_WORKOUT_ID;
            const schedule = resolveWorkout(workoutId, state.customWorkouts);
            const isToday = format(new Date(), 'EEEE') === dayName && offset === 0;
            const isRest = workoutId === REST_WORKOUT_ID;

            return (
              <motion.button
                key={dayKey}
                onClick={() => setPickerDay(dayName)}
                initial={{ opacity: 0, x: offset > 0 ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card w-full flex items-center gap-3 relative overflow-hidden text-left ${isToday ? 'border border-[var(--accent-primary)]/50' : ''}`}
              >
                {/* Color bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{
                    background: isRest ? 'var(--bg-tertiary)' : `var(--accent-primary)`,
                  }}
                />
                <div className="ml-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body font-medium text-[var(--text-primary)]">{t(dayKey as any)}</span>
                    {isToday && <span className="chip chip-active text-[10px] !h-5">{t('today').toUpperCase()}</span>}
                  </div>
                  <p className={`text-body-sm ${isRest ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}`}>
                    {isRest ? t('restDayMessage') : `${schedule.title} · ${schedule.exercises.length} ${t('exercises')}`}
                  </p>
                </div>
                <div className="text-[var(--text-tertiary)] flex items-center gap-1">
                  {isRest ? <BedDouble size={18} /> : <Dumbbell size={18} className="text-[var(--accent-primary)]" />}
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Day workout picker */}
        <BottomSheet isOpen={pickerDay !== null} onClose={() => setPickerDay(null)}>
          <div className="px-6 pt-2 pb-6 max-h-[70vh] overflow-y-auto">
            <h3 className="text-h3 text-[var(--text-primary)] text-center mb-4">
              {pickerDay ? t(pickerDay.toLowerCase() as any) : ''}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => pickWorkout(REST_WORKOUT_ID)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl ${
                  pickerDay && (state.weeklySchedule[pickerDay] ?? REST_WORKOUT_ID) === REST_WORKOUT_ID
                    ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30'
                    : 'bg-[var(--bg-tertiary)]'
                }`}
              >
                <BedDouble size={18} className="text-[var(--text-tertiary)]" />
                <span className="text-body text-[var(--text-primary)]">{t('restDayMessage')}</span>
              </button>
              {Object.entries(BUILT_IN_WORKOUTS).map(([id, w]) => (
                <button
                  key={id}
                  onClick={() => pickWorkout(id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl ${
                    pickerDay && state.weeklySchedule[pickerDay] === id
                      ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell size={18} className="text-[var(--accent-primary)]" />
                    <span className="text-body text-[var(--text-primary)]">{w.title}</span>
                  </div>
                  <span className="text-caption text-[var(--text-tertiary)]">{w.exercises.length} {t('exercises')}</span>
                </button>
              ))}
              {Object.entries(state.customWorkouts).map(([id, w]) => (
                <button
                  key={id}
                  onClick={() => pickWorkout(id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl ${
                    pickerDay && state.weeklySchedule[pickerDay] === id
                      ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star size={18} className="text-[var(--accent-secondary)]" />
                    <span className="text-body text-[var(--text-primary)]">{w.title}</span>
                  </div>
                  <span className="text-caption text-[var(--text-tertiary)]">{w.exercises.length} {t('exercises')}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setPickerDay(null); navigate('/workout/create'); }}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl mt-4 border border-dashed border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-medium"
            >
              <Plus size={18} /> Create New Workout
            </button>
          </div>
        </BottomSheet>

        {/* Cardio Progression */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('cardioProgression')}</h3>
          <div className="flex items-center gap-2">
            {CARDIO_PROGRESSION.map((cp, i) => {
              const isCurrent = week >= parseInt(cp.weeks.split('-')[0]) && week <= parseInt(cp.weeks.split('-')[1]);
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-2 rounded-full mb-1 ${isCurrent ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`} />
                  <p className={`text-[10px] ${isCurrent ? 'text-[var(--accent-primary)] font-semibold' : 'text-[var(--text-tertiary)]'}`}>{cp.minutes}m</p>
                  <p className={`text-[9px] ${isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}>W{cp.weeks}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Timer size={14} className="text-[var(--accent-tertiary)]" />
            <span className="text-body-sm text-[var(--accent-tertiary)]">{t('currentPlan')}: {cardioMins} min/day ({t('week')} {week})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== FoodDetail ====================
const FOOD_DB: Record<string, FoodItem> = {
  'grilled-chicken-breast': { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, serving: '100g' },
  'white-rice': { name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, serving: '100g' },
  'salmon-fillet': { name: 'Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, serving: '100g' },
  'greek-yogurt': { name: 'Greek Yogurt 0%', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, serving: '100g' },
  'banana': { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, serving: '1 medium' },
  'oats': { name: 'Oats', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, fiber: 10.6, serving: '100g' },
  'eggs': { name: 'Scrambled Eggs (2)', calories: 180, protein: 12, carbs: 2, fat: 14, fiber: 0, serving: '2 eggs' },
  'broccoli': { name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, serving: '100g' },
};

// ==================== CreateWorkout ====================
interface DraftExercise {
  name: string;
  sets: string;
  reps: string;
}

export function CreateWorkout() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([{ name: '', sets: '3', reps: '10' }]);

  const updateExercise = (i: number, field: keyof DraftExercise, value: string) => {
    setExercises(prev => prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)));
  };

  const addExercise = () => setExercises(prev => [...prev, { name: '', sets: '3', reps: '10' }]);
  const removeExercise = (i: number) => setExercises(prev => prev.filter((_, idx) => idx !== i));

  const validExercises = exercises.filter(e => e.name.trim().length > 0);
  const canSave = title.trim().length > 0 && validExercises.length > 0;

  const save = () => {
    if (!canSave) return;
    const id = `custom-${Date.now()}`;
    dispatch({
      type: 'SAVE_CUSTOM_WORKOUT',
      payload: {
        id,
        title: title.trim(),
        cardio: false,
        exercises: validExercises.map(e => ({
          name: e.name.trim(),
          sets: Math.max(1, parseInt(e.sets, 10) || 3),
          reps: e.reps.trim() || '10',
          muscle: '',
          instructions: '',
          mistakes: [],
          restSeconds: 60,
        })),
      },
    });
    navigate(-1);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">Create Workout</h1>
        <button onClick={save} disabled={!canSave} className={`text-body-sm font-semibold ${canSave ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}>
          Save
        </button>
      </div>

      <div className="px-4 space-y-4">
        <div>
          <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Workout Name</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Push Day, Full Body, Core"
            className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
          />
        </div>

        <div>
          <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Exercises</label>
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="card !p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={ex.name}
                    onChange={e => updateExercise(i, 'name', e.target.value)}
                    placeholder="Exercise name"
                    className="flex-1 h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
                  />
                  {exercises.length > 1 && (
                    <button onClick={() => removeExercise(i)} className="p-2 text-[var(--accent-danger)]">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Sets</span>
                    <input
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={e => updateExercise(i, 'sets', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Reps</span>
                    <input
                      type="text"
                      value={ex.reps}
                      onChange={e => updateExercise(i, 'reps', e.target.value)}
                      placeholder="e.g. 8-12"
                      className="w-full h-10 px-3 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-transparent focus:border-[var(--accent-primary)] outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addExercise}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl mt-3 border border-dashed border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-medium"
          >
            <Plus size={16} /> Add Exercise
          </button>
        </div>

        <button onClick={save} disabled={!canSave} className="btn-primary" style={{ opacity: canSave ? 1 : 0.5 }}>
          Save Workout
        </button>
      </div>
    </div>
  );
}

export function FoodDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const { dispatch } = useApp();
  const decoded = decodeURIComponent(name || '').toLowerCase().replace(/\s+/g, '-');
  const food = FOOD_DB[decoded] || { name: decoded.replace(/-/g, ' '), calories: 100, protein: 10, carbs: 15, fat: 5, fiber: 2, serving: '100g' };
  const [serving, setServing] = useState(100);
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [favorited, setFavorited] = useState(false);

  const multiplier = serving / 100;
  const scaledFood: FoodItem = {
    ...food,
    calories: Math.round(food.calories * multiplier),
    protein: Math.round(food.protein * multiplier * 10) / 10,
    carbs: Math.round(food.carbs * multiplier * 10) / 10,
    fat: Math.round(food.fat * multiplier * 10) / 10,
    fiber: Math.round(food.fiber * multiplier * 10) / 10,
  };

  const addFood = () => {
    dispatch({ type: 'ADD_FOOD', payload: { mealName: selectedMeal, food: scaledFood } });
    setToast({ visible: true, message: `${scaledFood.name} added to ${selectedMeal}` });
    setTimeout(() => navigate('/nutrition'), 800);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none truncate px-16">{food.name}</h1>
        <button onClick={() => setFavorited(!favorited)} className="p-1">
          <Star size={20} className={favorited ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-tertiary)]'} fill={favorited ? '#F59E0B' : 'none'} />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="px-4 space-y-4">
        {/* Nutrition */}
        <div className="card text-center py-6">
          <p className="text-display text-[var(--accent-primary)]">{scaledFood.calories}</p>
          <p className="text-caption text-[var(--text-secondary)]">calories per {serving}g</p>
        </div>

        {/* Serving selector */}
        <div className="card">
          <h3 className="text-body text-[var(--text-primary)] mb-3">{t('servingSize')}</h3>
          <div className="flex gap-2 mb-3">
            {[50, 100, 150, 200].map(s => (
              <button key={s} onClick={() => setServing(s)} className={`chip ${serving === s ? 'chip-active' : ''}`}>
                {s}g
              </button>
            ))}
          </div>
          <input type="range" min={10} max={500} step={5} value={serving}
            onChange={e => setServing(Number(e.target.value))}
            className="w-full accent-[var(--accent-primary)]" />
          <p className="text-body-sm text-[var(--text-primary)] mt-1">{serving}g</p>
        </div>

        {/* Macro breakdown */}
        <div className="card">
          <h3 className="text-body text-[var(--text-primary)] mb-3">{t('nutritionPerServing')}</h3>
          {[
            { label: t('protein'), value: scaledFood.protein, color: 'var(--accent-primary)', max: 40 },
            { label: t('carbs'), value: scaledFood.carbs, color: 'var(--accent-tertiary)', max: 50 },
            { label: t('fat'), value: scaledFood.fat, color: 'var(--accent-secondary)', max: 30 },
            { label: t('fiber'), value: scaledFood.fiber, color: '#38BDF8', max: 10 },
          ].map(macro => (
            <div key={macro.label} className="flex items-center gap-3 py-2">
              <span className="text-body-sm text-[var(--text-primary)] w-16">{macro.label}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((macro.value / macro.max) * 100, 100)}%`, background: macro.color }} />
              </div>
              <span className="text-body-sm text-[var(--text-secondary)] w-12 text-right">{macro.value}g</span>
            </div>
          ))}
        </div>

        {/* Meal selector */}
        <div className="card">
          <h3 className="text-body text-[var(--text-primary)] mb-3">{t('addTo')}</h3>
          <div className="flex gap-2">
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(m => (
              <button key={m} onClick={() => setSelectedMeal(m)} className={`chip ${selectedMeal === m ? 'chip-active' : ''}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <button onClick={addFood} className="btn-primary flex items-center justify-center gap-2">
          <Plus size={18} /> {t('addTo')} {selectedMeal}
        </button>
      </motion.div>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

// ==================== ExerciseDetail ====================
const ALL_EXERCISES = Object.values(WORKOUT_SCHEDULE).flatMap(w => w.exercises);

export function ExerciseDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const exercise = ALL_EXERCISES.find(e => e.name === decodeURIComponent(name || ''));

  if (!exercise) {
    return (
      <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-body text-[var(--text-secondary)]">{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none truncate px-16">{exercise.name}</h1>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 space-y-4">
        {/* Hero -- animated pictogram of how the exercise is performed */}
        <div className="w-full h-40 rounded-xl bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] flex items-center justify-center">
          <ExerciseAnimation name={exercise.name} muscle={exercise.muscle} className="h-32 w-32" />
        </div>

        {/* Muscle tags */}
        <div className="flex gap-2">
          <span className="chip chip-active">{exercise.muscle}</span>
          <span className="chip">{exercise.sets} sets × {exercise.reps}</span>
          <span className="chip">{t('intermediate')}</span>
        </div>

        {/* Instructions */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('howToPerform')}</h3>
          <p className="text-body text-[var(--text-primary)] leading-relaxed">{exercise.instructions}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-caption text-[var(--text-tertiary)]">{t('rest')}:</span>
            <span className="text-body-sm text-[var(--accent-primary)]">{exercise.restSeconds}s {t('rest')}</span>
          </div>
        </div>

        {/* Mistakes */}
        <div className="card" style={{ borderLeft: '2px solid var(--accent-danger)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-[var(--accent-danger)]" />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('commonMistakes')}</h3>
          </div>
          {exercise.mistakes.map((m, i) => (
            <p key={i} className="text-body-sm text-[var(--text-tertiary)] py-1">• {m}</p>
          ))}
        </div>

        {/* Target Muscles */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('targetMuscles')}</h3>
          <p className="text-body text-[var(--accent-primary)]">{exercise.muscle}</p>
          <p className="text-body-sm text-[var(--text-secondary)] mt-1">
            Primary muscles engaged during this exercise.
          </p>
        </div>

        <button onClick={() => navigate('/workout')} className="btn-primary flex items-center justify-center gap-2">
          <Play size={18} fill="white" /> {t('addToWorkout')}
        </button>
      </motion.div>
    </div>
  );
}
