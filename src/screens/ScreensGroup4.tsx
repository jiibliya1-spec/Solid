// Merged screen file — combines: Setup, AIFoodScanner, NotificationsScreen, ProfileScreen
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Apple, BarChart3, Camera, ChevronLeft, Dumbbell, Flame, Loader2, LogOut, Moon, Pill, RefreshCw, Settings, Sparkles, Sun, Trophy, X } from 'lucide-react';
import { addWeeks, format } from 'date-fns';
import { useApp } from '@/context/AppContext';
import { FoodAIError, analyzeFoodImage, type FoodAnalysis } from '@/lib/foodAI';
import type { User } from '@/types';
import { Avatar, Toast } from '@/components/SharedComponents';
import { useTranslation } from '@/i18n/i18nHooks';

// ==================== Setup ====================
const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 200 : -200, opacity: 0 }),
};

export function Setup() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<User>>({
    name: '',
    age: 30,
    height: 175,
    currentWeight: 90,
    goalWeight: 78,
    experience: 'intermediate',
    workDays: 4,
    shiftSleep: 6.5,
    offSleep: 8.5,
    workoutTime: 'evening',
  });

  const [timeline, setTimeline] = useState<8 | 10 | 12>(12);

  const steps = ['Profile', 'Goals', 'Schedule', 'Review'];

  const isStepValid = () => {
    switch (step) {
      case 0: return form.name && form.age && form.height && form.currentWeight;
      case 1: return form.goalWeight && timeline;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setDir(1);
      setStep(step + 1);
    } else {
      const startDate = format(new Date(), 'yyyy-MM-dd');
      const targetDate = format(addWeeks(new Date(), timeline), 'yyyy-MM-dd');
      dispatch({
        type: 'SET_USER',
        payload: {
          name: form.name || 'User',
          age: form.age || 30,
          height: form.height || 175,
          currentWeight: form.currentWeight || 90,
          goalWeight: form.goalWeight || 78,
          startDate,
          targetDate,
          experience: form.experience || 'intermediate',
          workDays: form.workDays || 4,
          shiftSleep: form.shiftSleep || 6.5,
          offSleep: form.offSleep || 8.5,
          workoutTime: form.workoutTime || 'evening',
        },
      });
      navigate('/dashboard');
    }
  };

  const update = (field: keyof User, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  // Review-step preview, mirroring useDailyTargets' formula (that hook reads
  // state.user, which isn't set until this wizard finishes, so the numbers
  // shown here are computed directly from the in-progress form instead of
  // being hardcoded placeholders that never matched what the person entered).
  const previewWeight = form.currentWeight || 90;
  const previewBmr = 10 * previewWeight + 6.25 * (form.height || 175) - 5 * (form.age || 30) - 78;
  const previewTrainingActivity =
    (form.workDays === 4 ? 1.55 : 1.45) +
    (form.experience === 'advanced' ? 0.1 : form.experience === 'beginner' ? -0.05 : 0);
  const previewRestActivity = 1.2;
  const previewWeightDelta = (form.goalWeight || 78) - previewWeight;
  const previewCalorieAdjustment = previewWeightDelta < -0.5 ? -500 : previewWeightDelta > 0.5 ? 300 : 0;
  const trainingDayCalories = Math.round(previewBmr * previewTrainingActivity + previewCalorieAdjustment);
  const restDayCalories = Math.round(previewBmr * previewRestActivity + previewCalorieAdjustment);
  const proteinTarget = Math.round(previewWeight * 2);

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] flex flex-col">
      {/* Stepper */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    backgroundColor: i <= step ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    borderColor: i === step ? 'var(--accent-primary)' : 'transparent',
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                    i < step ? 'text-white' : i === step ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                  }`}
                  style={{ borderColor: i === step ? 'var(--accent-primary)' : 'transparent' }}
                >
                  {i < step ? '✓' : i + 1}
                </motion.div>
                <span className={`text-[10px] mt-1 ${i <= step ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: i < step ? 'var(--accent-primary)' : 'var(--bg-tertiary)' }}
                  className="flex-1 h-0.5 mx-2 mb-5"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-hidden relative">
        <AnimatePresence initial={false} custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <div>
                  <h2 className="text-h2 text-[var(--text-primary)] mb-1">{t('getToKnowYou')}</h2>
                  <p className="text-body text-[var(--text-secondary)]">{t('personalizeIntro')}</p>
                </div>
                <div className="space-y-4">
                  <InputField label={t('yourName')} value={form.name || ''} onChange={v => update('name', v)} placeholder="Enter your name" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label={t('currentWeight')} type="number" value={form.currentWeight || ''} onChange={v => update('currentWeight', Number(v))} />
                    <InputField label={t('height')} type="number" value={form.height || ''} onChange={v => update('height', Number(v))} />
                  </div>
                  <InputField label={t('age')} type="number" value={form.age || ''} onChange={v => update('age', Number(v))} />
                  <div>
                    <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">{t('trainingExperience')}</label>
                    <SegmentedControl
                      options={['Beginner', 'Intermediate', 'Advanced']}
                      value={(form.experience || 'intermediate').charAt(0).toUpperCase() + (form.experience || 'intermediate').slice(1)}
                      onChange={v => update('experience', v.toLowerCase())}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-h2 text-[var(--text-primary)] mb-1">{t('setYourTarget')}</h2>
                  <p className="text-body text-[var(--text-secondary)]">{t('defineGoalTimeline')}</p>
                </div>
                <div className="space-y-6">
                  <InputField label={t('goalWeight')} type="number" value={form.goalWeight || ''} onChange={v => update('goalWeight', Number(v))} />
                  <div>
                    <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">{t('timeline')}</label>
                    <SegmentedControl
                      options={['8 Weeks', '10 Weeks', '12 Weeks']}
                      value={`${timeline} Weeks`}
                      onChange={v => setTimeline(Number(v.split(' ')[0]) as 8 | 10 | 12)}
                    />
                  </div>
                  <div className="card">
                    <div className="text-caption text-[var(--text-tertiary)] mb-2">{t('projectedWeightLoss').toUpperCase()}</div>
                    <div className="flex items-end gap-2">
                      <span className="text-metric text-[var(--accent-primary)]">{form.currentWeight}</span>
                      <span className="text-body-lg text-[var(--text-secondary)] mb-1">→</span>
                      <span className="text-metric text-[var(--accent-secondary)]">{form.goalWeight}</span>
                      <span className="text-body-sm text-[var(--text-tertiary)] mb-2 ml-2">kg</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '30%' }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h2 className="text-h2 text-[var(--text-primary)] mb-1">{t('weeklySchedule')}</h2>
                  <p className="text-body text-[var(--text-secondary)]">{t('optimizePlanHelp')}</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">{t('workDaysPerWeek')}</label>
                    <SegmentedControl options={['3 Days', '4 Days']} value={`${form.workDays} Days`} onChange={v => update('workDays', Number(v.split(' ')[0]) as 3 | 4)} />
                  </div>
                  <div className="card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body text-[var(--text-primary)]">{t('workDaySleep')}</span>
                      <span className="text-metric-sm text-[var(--accent-primary)]">{form.shiftSleep}h</span>
                    </div>
                    <input type="range" min={5} max={8} step={0.5} value={form.shiftSleep} onChange={e => update('shiftSleep', Number(e.target.value))} className="w-full accent-[var(--accent-primary)]" />
                  </div>
                  <div className="card">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-body text-[var(--text-primary)]">{t('offDaySleep')}</span>
                      <span className="text-metric-sm text-[var(--accent-primary)]">{form.offSleep}h</span>
                    </div>
                    <input type="range" min={6} max={10} step={0.5} value={form.offSleep} onChange={e => update('offSleep', Number(e.target.value))} className="w-full accent-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">{t('preferredWorkoutTime')}</label>
                    <SegmentedControl options={['Morning', 'Evening']} value={(form.workoutTime || 'evening').charAt(0).toUpperCase() + (form.workoutTime || 'evening').slice(1)} onChange={v => update('workoutTime', v.toLowerCase())} />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="space-y-4">
                <div>
                  <h2 className="text-h2 text-[var(--text-primary)] mb-1">{t('personalizedPlan')}</h2>
                  <p className="text-body text-[var(--text-secondary)]">{t('calculatedPlanIntro')}</p>
                </div>
                {[
                  { label: t('trainingDayCaloriesLabel'), value: `${trainingDayCalories.toLocaleString()} kcal`, color: 'var(--accent-secondary)' },
                  { label: t('restDayCaloriesLabel'), value: `${restDayCalories.toLocaleString()} kcal`, color: 'var(--accent-tertiary)' },
                  { label: t('proteinTargetLabel'), value: `${proteinTarget}g`, color: 'var(--accent-primary)' },
                  { label: t('workoutScheduleLabel'), value: `${form.workDays || 4} days / week`, color: 'var(--accent-primary)' },
                  { label: t('cardioStartLabel'), value: '15 min', color: 'var(--accent-tertiary)' },
                  { label: t('goalDateLabel'), value: format(addWeeks(new Date(), timeline), 'MMM d, yyyy'), color: 'var(--accent-secondary)' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card flex justify-between items-center"
                  >
                    <span className="text-body text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-metric-sm" style={{ color: item.color }}>{item.value}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleNext}
          disabled={!isStepValid()}
          className="btn-primary"
        >
          {step < 3 ? 'Continue' : 'Start My Journey'}
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none transition-colors"
      />
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 py-2.5 rounded-lg text-body-sm font-medium transition-all ${
            value === opt ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ==================== AIFoodScanner ====================
type Phase = 'starting' | 'live' | 'permission-denied' | 'captured' | 'analyzing' | 'result' | 'error';

export function AIFoodScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('starting');
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [selectedMeal, setSelectedMeal] = useState('Snack');
  const [toast, setToast] = useState({ visible: false, message: '' });

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(tr => tr.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setPhase('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase('live');
    } catch {
      setPhase('permission-denied');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
    setPhase('captured');
  };

  const retake = () => {
    setPhoto(null);
    setResult(null);
    startCamera();
  };

  const analyze = async () => {
    if (!photo) return;
    setPhase('analyzing');
    try {
      const analysis = await analyzeFoodImage(photo);
      setResult(analysis);
      setPhase('result');
    } catch (err) {
      console.error('Food analysis failed:', err instanceof FoodAIError ? err.message : err);
      setPhase('error');
    }
  };

  const addToMeal = () => {
    if (!result) return;
    dispatch({
      type: 'ADD_FOOD',
      payload: {
        mealName: selectedMeal,
        food: {
          name: result.name,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber,
          serving: result.serving,
        },
      },
    });
    setToast({ visible: true, message: `${t('addFood')} - ${selectedMeal}` });
    setTimeout(() => navigate('/nutrition'), 800);
  };

  const close = () => {
    stopCamera();
    navigate(-1);
  };

  return (
    <div className="h-[100dvh] bg-black relative flex flex-col items-center justify-center overflow-hidden">
      <button onClick={close} className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
        <X size={20} className="text-white" />
      </button>

      <canvas ref={canvasRef} className="hidden" />

      {/* Live camera view */}
      {(phase === 'starting' || phase === 'live') && (
        <>
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <p className="text-body-lg text-white/80 mb-8 absolute top-20 z-10 px-8 text-center">{t('aiScanIntro')}</p>
          {phase === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
          )}
          {phase === 'live' && (
            <button
              onClick={capture}
              className="absolute bottom-10 z-10 w-18 h-18 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 72, height: 72 }}
            >
              <div className="w-14 h-14 rounded-full bg-white" />
            </button>
          )}
        </>
      )}

      {/* Permission denied */}
      {phase === 'permission-denied' && (
        <div className="px-8 text-center z-10">
          <AlertTriangle size={40} className="text-[var(--accent-danger)] mx-auto mb-4" />
          <p className="text-body text-white/80 mb-6">{t('cameraPermissionDenied')}</p>
          <button onClick={startCamera} className="btn-primary">{t('retry')}</button>
        </div>
      )}

      {/* Captured photo preview */}
      {(phase === 'captured' || phase === 'analyzing') && photo && (
        <>
          <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {phase === 'analyzing' && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 gap-3">
              <Loader2 size={32} className="text-white animate-spin" />
              <p className="text-body text-white">{t('analyzingMeal')}</p>
            </div>
          )}
          {phase === 'captured' && (
            <div className="absolute bottom-10 z-10 flex items-center gap-4">
              <button onClick={retake} className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
                <RefreshCw size={22} className="text-white" />
              </button>
              <button onClick={analyze} className="btn-primary flex items-center gap-2" style={{ width: 'auto', padding: '0 28px' }}>
                <Sparkles size={18} /> {t('analyzeMeal')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="px-8 text-center z-10">
          <AlertTriangle size={40} className="text-[var(--accent-danger)] mx-auto mb-4" />
          <p className="text-body text-white/80 mb-6">{t('analysisError')}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={retake} className="btn-secondary">{t('retake')}</button>
            <button onClick={() => navigate('/nutrition/food/manual')} className="btn-primary">{t('enterManually')}</button>
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-elevated)] rounded-t-3xl px-6 pt-4 pb-8"
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-[var(--bg-tertiary)]" />
            </div>
            <h3 className="text-h3 text-[var(--text-primary)] text-center mb-1">{result.name}</h3>
            <p className="text-caption text-[var(--text-tertiary)] text-center mb-1">{result.serving}</p>
            <div className="flex items-center justify-center gap-1 mb-4">
              <span className="text-caption text-[var(--text-tertiary)]">{t('confidence')}: {result.confidence}</span>
            </div>

            <p className="text-metric text-[var(--accent-primary)] text-center">{result.calories}</p>
            <p className="text-caption text-[var(--text-secondary)] text-center mb-3">{t('calories').toLowerCase()}</p>

            <div className="flex justify-around mb-4">
              <div className="text-center">
                <p className="text-body-sm text-[var(--accent-primary)]">{result.protein}g</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{t('protein')}</p>
              </div>
              <div className="text-center">
                <p className="text-body-sm text-[var(--accent-tertiary)]">{result.carbs}g</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{t('carbs')}</p>
              </div>
              <div className="text-center">
                <p className="text-body-sm text-[var(--accent-secondary)]">{result.fat}g</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{t('fat')}</p>
              </div>
              <div className="text-center">
                <p className="text-body-sm text-[var(--text-primary)]">{result.fiber}g</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{t('fiber')}</p>
              </div>
            </div>

            <p className="text-caption text-[var(--text-tertiary)] text-center mb-4">{t('aiEstimateDisclaimer')}</p>

            <div className="flex gap-2 mb-4">
              {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMeal(m)}
                  className={`chip flex-1 ${selectedMeal === m ? 'chip-active' : ''}`}
                >
                  {t(m.toLowerCase() as 'breakfast' | 'lunch' | 'snack' | 'dinner')}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={retake} className="btn-secondary flex items-center justify-center gap-2" style={{ flex: 1 }}>
                <RefreshCw size={16} /> {t('retake')}
              </button>
              <button onClick={addToMeal} className="btn-primary" style={{ flex: 2 }}>{t('addToMeal')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

// ==================== NotificationsScreen ====================
const TYPE_ICONS: Record<string, React.ReactNode> = {
  morning: <Sun size={18} className="text-[var(--accent-secondary)]" />,
  workout: <Dumbbell size={18} className="text-[var(--accent-primary)]" />,
  nutrition: <Apple size={18} className="text-[var(--accent-tertiary)]" />,
  supplement: <Pill size={18} className="text-[var(--accent-tertiary)]" />,
  recovery: <Moon size={18} className="text-[var(--accent-tertiary)]" />,
  weekly: <BarChart3 size={18} className="text-[var(--accent-primary)]" />,
  achievement: <Trophy size={18} className="text-[var(--accent-secondary)]" />,
};

export function NotificationsScreen() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Notifications only carry a time-of-day string, not an actual date, so
  // there's no real "today" vs "yesterday" to bucket by -- split by read
  // status instead, which is the distinction the data can actually support.
  const unread = state.notifications.filter(n => !n.read);
  const read = state.notifications.filter(n => n.read);

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('notificationCenter')}</h1>
        <button onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })} className="text-body-sm text-[var(--accent-primary)]">
          {t('markAllRead')}
        </button>
      </div>

      <div className="px-4 space-y-2 mt-2">
        {unread.length === 0 && read.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <Sun size={28} className="text-[var(--text-tertiary)]" />
            </div>
            <h2 className="text-h2 text-[var(--text-primary)] mb-2">{t('noNotifications')}</h2>
            <p className="text-body text-[var(--text-secondary)] text-center">{t('noNotifications')}</p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <p className="text-caption text-[var(--text-tertiary)] uppercase mb-2">New</p>
                {unread.map(n => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })}
                    className={`card flex items-start gap-3 cursor-pointer ${n.read ? 'opacity-60' : ''}`}
                  >
                    <div className="mt-0.5">{TYPE_ICONS[n.type]}</div>
                    <div className="flex-1">
                      <p className="text-body text-[var(--text-primary)]">{n.message}</p>
                      <p className="text-caption text-[var(--text-tertiary)] mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />}
                  </motion.div>
                ))}
              </>
            )}

            {read.length > 0 && (
              <>
                <p className="text-caption text-[var(--text-tertiary)] uppercase mb-2 mt-4">Earlier</p>
                {read.map(n => (
                  <motion.div key={n.id} className="card flex items-start gap-3 opacity-60">
                    <div className="mt-0.5">{TYPE_ICONS[n.type]}</div>
                    <div className="flex-1">
                      <p className="text-body text-[var(--text-primary)]">{n.message}</p>
                      <p className="text-caption text-[var(--text-tertiary)] mt-1">{n.time}</p>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================== ProfileScreen ====================
export function ProfileScreen() {
  const { t } = useTranslation();
  const { state } = useApp();
  const navigate = useNavigate();
  const user = state.user;

  const links = [
    { icon: <Settings size={18} />, labelKey: 'settings', screen: '/settings' },
    { icon: <Trophy size={18} />, labelKey: 'achievements', screen: '/achievements' },
    { icon: <Camera size={18} />, labelKey: 'progressPhotos', screen: '/progress' },
    { icon: <Pill size={18} />, labelKey: 'supplementTracker', screen: '/supplements' },
    { icon: <Flame size={18} />, labelKey: 'weeklyReport', screen: '/weekly-report' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('profile')}</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card flex flex-col items-center py-6"
          style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(52,211,153,0.05) 100%)' }}
        >
          <button
            onClick={() => navigate('/settings')}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--accent-primary)] mb-3 relative"
            aria-label={t('profile')}
          >
            <Avatar avatar={user?.avatar} name={user?.name} size={80} className="w-full h-full" />
          </button>
          <h2 className="text-h2 text-[var(--text-primary)]">{user?.name || t('yourName')}</h2>
          <p className="text-caption text-[var(--text-secondary)]">{t('memberSince')} May 2025</p>
          <div className="flex items-center gap-1 mt-2">
            <Flame size={14} className="text-[var(--accent-secondary)]" />
            <span className="text-body-sm text-[var(--accent-secondary)]">{state.streaks.current} {t('dayStreak')}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('started'), value: `${user?.currentWeight || 90} kg` },
            { label: t('currentWeight'), value: `${state.measurements[state.measurements.length - 1]?.weight ?? state.user?.currentWeight ?? 0} kg`, color: 'var(--accent-primary)' },
            { label: t('goal'), value: `${user?.goalWeight || 78} kg`, color: 'var(--accent-secondary)' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card text-center !py-3">
              <p className="text-metric-sm" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-caption text-[var(--text-tertiary)] mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="card !py-2 !px-0">
          {links.map((link, i) => (
            <button
              key={i}
              onClick={() => navigate(link.screen)}
              className="w-full flex items-center justify-between py-3 px-4 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-[var(--text-secondary)]">{link.icon}</span>
                <span className="text-body text-[var(--text-primary)]">{t(link.labelKey as any)}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={() => navigate('/onboarding')}
          className="w-full flex items-center justify-center gap-2 py-3 text-body text-[var(--accent-danger)]"
        >
          <LogOut size={18} /> {t('signOut')}
        </button>
      </div>
    </div>
  );
}
