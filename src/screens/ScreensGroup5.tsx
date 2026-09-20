// Merged screen file — combines: ProgressTracker, AICoach, WeeklyReport
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Apple, ArrowDown, Camera, Check, ChevronLeft, Flame, Heart, Info, Send, Share2, Target, TrendingDown, TrendingUp, X } from 'lucide-react';
import { format } from 'date-fns';
import { getCurrentWeek, useApp, useDailyTargets } from '@/context/AppContext';
import { BottomNav, BottomSheet, CoachAvatar, Toast } from '@/components/SharedComponents';
import { useTranslation } from '@/i18n/i18nHooks';

// ==================== ProgressTracker ====================
export function ProgressTracker() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [timeRange, setTimeRange] = useState('1M');
  const [logForm, setLogForm] = useState({ weight: '', waist: '', chest: '', arms: '', legs: '', bodyFat: '' });

  const currentWeight = state.measurements[state.measurements.length - 1]?.weight ?? state.user?.currentWeight ?? 0;
  const startWeight = state.user?.currentWeight || 90;
  const goalWeight = state.user?.goalWeight || 78;
  const weightLost = (startWeight - currentWeight).toFixed(1);
  const remaining = (currentWeight - goalWeight).toFixed(1);
  const progress = Math.min(((startWeight - currentWeight) / (startWeight - goalWeight)) * 100, 100);

  const bmi = currentWeight / Math.pow((state.user?.height || 175) / 100, 2);
  const latest = state.measurements[state.measurements.length - 1];
  const prev = state.measurements[state.measurements.length - 2];

  const saveMeasurement = () => {
    if (!logForm.weight) return;
    dispatch({
      type: 'ADD_MEASUREMENT',
      payload: {
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: Number(logForm.weight),
        bmi: Number(logForm.weight) / Math.pow((state.user?.height || 175) / 100, 2),
        waist: Number(logForm.waist) || latest?.waist || 0,
        chest: Number(logForm.chest) || latest?.chest || 0,
        arms: Number(logForm.arms) || latest?.arms || 0,
        legs: Number(logForm.legs) || latest?.legs || 0,
        bodyFat: Number(logForm.bodyFat) || latest?.bodyFat || 0,
      },
    });
    setShowLogSheet(false);
    setToast({ visible: true, message: 'Measurement logged!' });
    setLogForm({ weight: '', waist: '', chest: '', arms: '', legs: '', bodyFat: '' });
  };

  const measurements = state.measurements;
  const minW = Math.min(...measurements.map(m => m.weight)) - 1;
  const maxW = Math.max(...measurements.map(m => m.weight)) + 1;
  const range = maxW - minW;
  const chartPoints = measurements.map((m, i) => {
    const x = (i / (measurements.length - 1)) * 100;
    const y = 100 - ((m.weight - minW) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const milestones = [
    { label: `${t('started')}: ${startWeight} kg`, done: true },
    { label: `${(startWeight - 2).toFixed(1)} kg (-2 kg)`, done: currentWeight <= startWeight - 2 },
    { label: `${(startWeight - 4).toFixed(1)} kg (-4 kg)`, done: currentWeight <= startWeight - 4 },
    { label: `84.0 kg (${t('halfwayLabel')})`, done: currentWeight <= 84, highlight: true },
    { label: '80.0 kg (-10 kg)', done: currentWeight <= 80 },
    { label: `78.0 kg (${t('goal').toUpperCase()}!)`, done: currentWeight <= 78, goal: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('progressTracker')}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Weight Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card py-6 text-center"
          style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(52,211,153,0.05) 100%)' }}
        >
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="text-display text-[var(--text-primary)]"
          >
            {currentWeight}
          </motion.p>
          <p className="text-h3 text-[var(--text-secondary)]">kg</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ArrowDown size={16} className="text-[var(--accent-primary)]" />
            <span className="text-body text-[var(--accent-primary)]">{weightLost} kg since start</span>
          </div>
          <p className="text-caption text-[var(--text-tertiary)] mt-1">
            Goal: {goalWeight} kg · {remaining} kg remaining
          </p>
          <div className="h-2 rounded-full bg-[var(--bg-tertiary)] mt-3 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
          </div>
        </motion.div>

        {/* Weight Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-h3 text-[var(--text-primary)]">{t('weightTrend')}</h3>
            </div>
            <div className="flex gap-1">
              {['1W', '1M', '3M', 'All'].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} className={`px-2 py-1 rounded-md text-[10px] font-medium ${timeRange === r ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-40">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1={100 - ((goalWeight - minW) / range) * 100} x2="100" y2={100 - ((goalWeight - minW) / range) * 100} stroke="#F59E0B" strokeWidth="0.5" strokeDasharray="2,2" />
            <polygon points={`0,100 ${chartPoints} 100,100`} fill="url(#chartGrad)" />
            <polyline points={chartPoints} fill="none" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {measurements.map((m, i) => {
              const x = (i / (measurements.length - 1)) * 100;
              const y = 100 - ((m.weight - minW) / range) * 100;
              return <circle key={i} cx={x} cy={y} r={i === measurements.length - 1 ? 2 : 1} fill={i === measurements.length - 1 ? '#34D399' : 'transparent'} stroke="#34D399" strokeWidth="0.3" />;
            })}
          </svg>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t('bmi'), value: bmi.toFixed(1), sub: bmi > 25 ? t('overweightToNormal') : t('normalLabel'), color: 'var(--accent-primary)' },
            { label: t('bodyFat'), value: `${latest?.bodyFat || 22}%`, sub: t('estimatedLabel'), color: 'var(--text-tertiary)' },
            { label: t('weightLost'), value: `${weightLost} kg`, sub: t('totalLabel'), color: 'var(--accent-primary)' },
            { label: t('daysActive'), value: state.streaks.current.toString(), sub: t('currentStreak'), color: 'var(--accent-primary)' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card text-center">
              <p className="text-metric-sm" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-caption text-[var(--text-tertiary)] mt-1">{stat.label}</p>
              <p className="text-caption mt-0.5" style={{ color: stat.color }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Measurements */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-h3 text-[var(--text-primary)]">{t('bodyMeasurements')}</h3>
            <button onClick={() => setShowLogSheet(true)} className="text-body-sm text-[var(--accent-primary)]">{t('logNew')}</button>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Waist', current: latest?.waist || 92, change: prev ? (latest.waist - prev.waist).toFixed(1) : '0' },
              { name: 'Chest', current: latest?.chest || 102, change: prev ? (latest.chest - prev.chest).toFixed(1) : '0' },
              { name: 'Arms', current: latest?.arms || 35, change: prev ? (latest.arms - prev.arms).toFixed(1) : '0' },
              { name: 'Legs', current: latest?.legs || 58, change: prev ? (latest.legs - prev.legs).toFixed(1) : '0' },
            ].map(m => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="text-body text-[var(--text-primary)]">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-body text-[var(--text-primary)]">{m.current} cm</span>
                  <span className={`text-body-sm ${Number(m.change) < 0 ? 'text-[var(--accent-primary)]' : Number(m.change) > 0 ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-tertiary)]'}`}>
                    {Number(m.change) < 0 ? '↓' : Number(m.change) > 0 ? '↑' : '→'} {Math.abs(Number(m.change))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Photos placeholder */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-h3 text-[var(--text-primary)]">{t('progressPhotos')}</h3>
            <Camera size={18} className="text-[var(--accent-primary)]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Camera size={20} className="text-[var(--text-tertiary)]" />
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-4">{t('milestones')}</h3>
          <div className="relative pl-6">
            {milestones.map((m, i) => (
              <div key={i} className="relative pb-5">
                {i < milestones.length - 1 && (
                  <div className={`absolute left-[5px] top-3 w-0.5 h-full ${m.done ? 'bg-[var(--accent-primary)]' : 'border-l border-dashed border-[var(--bg-tertiary)]'}`} />
                )}
                <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 ${
                  m.done ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] border-[var(--bg-tertiary)]'
                }`} />
                <p className={`text-body-sm ${m.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'} ${m.goal ? 'font-semibold text-[var(--accent-secondary)]' : ''} ${m.highlight ? 'text-[var(--accent-secondary)]' : ''}`}>
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Projection Link */}
        <button onClick={() => navigate('/progress/projection')} className="btn-secondary flex items-center justify-center gap-2">
          <Target size={18} />
          View Goal Projection
        </button>
      </div>

      <BottomNav />

      {/* Log Measurement Sheet */}
      <BottomSheet isOpen={showLogSheet} onClose={() => setShowLogSheet(false)}>
        <div className="px-6 pt-2 pb-6 space-y-4">
          <h3 className="text-h3 text-[var(--text-primary)] text-center">{t('logMeasurement')}</h3>
          {[
            { label: `${t('weight')} (kg)`, key: 'weight', type: 'number' },
            { label: `${t('waist')} (cm)`, key: 'waist', type: 'number' },
            { label: `${t('chest')} (cm)`, key: 'chest', type: 'number' },
            { label: `${t('arms')} (cm)`, key: 'arms', type: 'number' },
            { label: `${t('legs')} (cm)`, key: 'legs', type: 'number' },
            { label: `${t('bodyFat')} (%)`, key: 'bodyFat', type: 'number' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-caption text-[var(--text-secondary)] uppercase mb-1 block">{field.label}</label>
              <input
                type={field.type}
                value={logForm[field.key as keyof typeof logForm]}
                onChange={e => setLogForm(f => ({ ...f, [field.key]: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
              />
            </div>
          ))}
          <button onClick={saveMeasurement} className="btn-primary">{t('saveMeasurement')}</button>
        </div>
      </BottomSheet>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

// ==================== AICoach ====================
interface ChatMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: string;
  type?: 'normal' | 'weight' | 'adjustment' | 'warning';
}

const SUGGESTION_KEYS = [
  'howAmIDoing',
  'adjustMyPlan',
  'mealIdeas',
  'workoutTips',
  'whyNoProgress',
] as const;

export function AICoach() {
  const { t } = useTranslation();
  const { state } = useApp();
  const navigate = useNavigate();
  const targets = useDailyTargets();
  const week = state.user ? getCurrentWeek(state.user.startDate) : 1;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const weightLost = state.measurements.length > 1
    ? (state.measurements[0].weight - state.measurements[state.measurements.length - 1].weight).toFixed(1)
    : '0';

  useEffect(() => {
    const greeting: ChatMessage = {
      id: '1',
      sender: 'coach',
      text: `Good morning! Week ${week}, Day ${Math.min(week * 7, 84)}. You're down ${weightLost} kg from last week — excellent progress. Your calories today remain at ${targets.calories.toLocaleString()}. Today's workout is ${state.workoutLog[Object.keys(state.workoutLog)[0]]?.title || 'scheduled'}. Your recovery score looks good, so you're ready to push hard. Ready to crush it?`,
      timestamp: '7:00 AM',
      type: 'normal',
    };
    setMessages([greeting]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const coachResponse = generateCoachResponse(text, state, targets, week);
      setMessages(prev => [...prev, coachResponse]);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
  };

  return (
    <div className="h-[100dvh] bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3 backdrop-blur-xl bg-[var(--bg-secondary)]">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <CoachAvatar size={40} />
        </div>
        <div className="flex-1">
          <h3 className="text-h3 text-[var(--text-primary)]">{t('aiCoach')}</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-caption text-[var(--accent-primary)]">{t('onlineStatus')}</span>
          </div>
        </div>
        <button className="p-2">
          <Info size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
              {msg.type === 'weight' ? (
                <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={16} className="text-[var(--accent-primary)]" />
                    <span className="text-caption text-[var(--accent-primary)]">{t('weightUpdateLabel')}</span>
                  </div>
                  <p className="text-body-sm text-[var(--text-primary)]">{msg.text}</p>
                </div>
              ) : msg.type === 'adjustment' ? (
                <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3 border-l-2 border-[var(--accent-secondary)]">
                  <p className="text-caption text-[var(--accent-secondary)] mb-1">{t('planAdjustmentLabel')}</p>
                  <p className="text-body-sm text-[var(--text-primary)]">{msg.text}</p>
                </div>
              ) : msg.type === 'warning' ? (
                <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3 border-l-2 border-[var(--accent-secondary)]">
                  <p className="text-caption text-[var(--accent-secondary)] mb-1">{t('headsUpLabel')}</p>
                  <p className="text-body-sm text-[var(--text-primary)]">{msg.text}</p>
                </div>
              ) : (
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[#10B981] rounded-br-sm'
                    : 'bg-[var(--bg-tertiary)] rounded-bl-sm'
                }`}>
                  <p className={`text-body ${msg.sender === 'user' ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                    {msg.text}
                  </p>
                </div>
              )}
              <p className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-right text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-tertiary)] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {SUGGESTION_KEYS.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(t(s))}
              className="chip whitespace-nowrap"
            >
              {t(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 bg-[var(--bg-secondary)] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('askYourCoach')}
          className="flex-1 h-11 px-4 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full bg-[var(--accent-primary)] flex items-center justify-center disabled:opacity-40"
        >
          <Send size={18} className="text-white" />
        </motion.button>
      </form>
    </div>
  );
}

function generateCoachResponse(userMsg: string, state: ReturnType<typeof useApp>['state'], targets: ReturnType<typeof useDailyTargets>, week: number): ChatMessage {
  const msg = userMsg.toLowerCase();
  let text = '';
  let type: ChatMessage['type'] = 'normal';

  if (msg.includes('doing') || msg.includes('progress')) {
    const weightLost = state.measurements.length > 1
      ? (state.measurements[0].weight - state.measurements[state.measurements.length - 1].weight).toFixed(1)
      : '0';
    text = `You're doing great! You've lost ${weightLost} kg so far and you're in Week ${week}. Your workout adherence is solid at 5/5 this week, and your nutrition tracking is consistent. Keep up the momentum!`;
    type = 'weight';
  } else if (msg.includes('adjust') || msg.includes('plan')) {
    text = `Based on your progress, I recommend keeping calories at ${targets.calories} for now. Your weight loss rate is optimal at ~0.8 kg/week. In Week ${Math.min(week + 1, 12)}, we'll increase cardio by 5 minutes to keep progress steady.`;
    type = 'adjustment';
  } else if (msg.includes('meal') || msg.includes('food') || msg.includes('eat')) {
    text = `Here are some meal ideas from your preferred foods:\n\nBreakfast: Scrambled eggs (3) + whole wheat toast + banana\nLunch: Grilled chicken (200g) + rice (150g) + vegetables\nDinner: Salmon (150g) + air fryer potatoes + broccoli\n\nThis hits ~${targets.calories} calories with ${targets.protein}g protein.`;
  } else if (msg.includes('workout') || msg.includes('exercise')) {
    text = `Focus on progressive overload this week. Try adding 2.5 kg to your compound lifts (squats, bench, rows). For isolation work, aim for an extra rep per set. Your form has been consistent — now it's time to push intensity.`;
  } else if (msg.includes('progress') || msg.includes('stuck') || msg.includes('plateau')) {
    text = `Weight loss plateaus are normal. If your weight hasn't changed in 5+ days, consider: 1) Adding 5 min cardio, 2) Reducing calories by 50-100, or 3) Increasing NEAT (steps). Your body may be recomping — check measurements, not just the scale.`;
    type = 'warning';
  } else {
    text = `Great question! Remember, consistency beats perfection. Your current trajectory puts you at your goal weight right on schedule. Focus on hitting your protein target (${targets.protein}g), getting 7-8 hours of sleep, and trusting the process. You've got this!`;
  }

  return {
    id: Date.now().toString(),
    sender: 'coach',
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type,
  };
}

// ==================== WeeklyReport ====================
export function WeeklyReport() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const summaryCards = [
    { icon: <TrendingDown size={18} />, value: '-0.8 kg', label: t('thisWeek'), color: 'var(--accent-primary)' },
    { icon: <Flame size={18} />, value: '5/5', label: t('workouts'), color: 'var(--accent-primary)' },
    { icon: <Apple size={18} />, value: '96%', label: t('nutritionStreakLabel'), color: 'var(--accent-primary)' },
    { icon: <Heart size={18} />, value: 'Avg 78', label: t('recovery'), color: 'var(--accent-tertiary)' },
  ];

  const workoutDays = [
    { day: 'Monday', workout: 'Shoulders', duration: 48, completed: true },
    { day: 'Tuesday', workout: 'Back', duration: 50, completed: true },
    { day: 'Wednesday', workout: 'Rest Day', duration: 0, completed: true },
    { day: 'Thursday', workout: 'Chest', duration: 45, completed: true },
    { day: 'Friday', workout: 'Legs', duration: 55, completed: true },
    { day: 'Saturday', workout: 'Arms', duration: 40, completed: true },
    { day: 'Sunday', workout: 'Rest Day', duration: 0, completed: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('weeklyReport')}</h1>
        <button onClick={() => {}} className="p-1">
          <Share2 size={20} className="text-[var(--accent-primary)]" />
        </button>
      </div>

      <div className="px-4 space-y-3">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card py-5"
          style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(52,211,153,0.08) 100%)' }}
        >
          <h2 className="text-h2 text-[var(--accent-primary)]">{t('greatWeek')}</h2>
          <p className="text-body text-[var(--text-secondary)]">May 26 — June 1</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-[10px] bg-[var(--accent-tertiary)]/20 text-[var(--accent-tertiary)]">{t('generatedReport', { day: t('sunday') })}</span>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-2">
          {summaryCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card !p-3 text-center"
            >
              <div style={{ color: card.color }} className="flex justify-center mb-1">{card.icon}</div>
              <p className="text-metric-sm" style={{ color: card.color }}>{card.value}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weight */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('weightThisWeek')}</h3>
          <div className="flex items-end justify-between gap-1 h-24">
            {[89.6, 89.4, 89.2, 89.1, 88.9, 88.8, 88.8].map((w, i) => {
              const pct = ((w - 88) / (90 - 88)) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[var(--text-tertiary)]">{w}</span>
                  <div className="w-full bg-[var(--bg-tertiary)] rounded-t-md relative overflow-hidden" style={{ height: 60 }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ delay: i * 0.05 }} className="absolute bottom-0 w-full rounded-t-md bg-[var(--accent-primary)]" />
                  </div>
                  <span className="text-[9px] text-[var(--text-tertiary)]">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              );
            })}
          </div>
          <p className="text-body text-[var(--text-primary)] mt-2">Started: 89.6 kg → Ended: 88.8 kg</p>
        </motion.div>

        {/* Workouts */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('workoutsThisWeek')}</h3>
          <div className="space-y-2">
            {workoutDays.map((w, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-body text-[var(--text-primary)]">{w.day}: {w.workout}</span>
                <div className="flex items-center gap-2">
                  {w.duration > 0 && <span className="text-caption text-[var(--text-tertiary)]">{w.duration} min</span>}
                  {w.completed ? <Check size={16} className="text-[var(--accent-primary)]" /> : <X size={16} className="text-[var(--accent-danger)]" />}
                </div>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-[var(--accent-secondary)] mt-3 flex items-center gap-1">
            <Flame size={14} /> 5-day workout streak
          </p>
        </motion.div>

        {/* Coach Recommendations */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card" style={{ borderLeft: '2px solid var(--accent-primary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CoachAvatar size={24} />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('coachNotes')}</h3>
          </div>
          <p className="text-body text-[var(--text-primary)]">
            Great week! Your weight loss is on track at 0.8 kg. For Week 3, I'm increasing cardio to 25 minutes and keeping calories at 2,350. Your back strength is improving — try adding 2.5 kg to your lat pulldown.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="chip chip-active text-[10px]">Increase Lat Pulldown: +2.5 kg</span>
            <span className="chip text-[10px]" style={{ background: 'rgba(96,165,250,0.15)', color: 'var(--accent-tertiary)', border: '1px solid rgba(96,165,250,0.3)' }}>Cardio: 20 → 25 min</span>
          </div>
        </motion.div>

        <button className="btn-primary flex items-center justify-center gap-2">
          <Share2 size={18} /> Share Weekly Report
        </button>
      </div>
    </div>
  );
}
