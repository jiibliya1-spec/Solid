// Merged screen file — combines: SettingsScreen, RecoveryHub, SupplementTracker
import { type ChangeEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, BedDouble, Calendar, Camera, Check, ChevronLeft, ChevronRight, Globe, Info, Moon, Pill, Plus, Ruler, Scale, Share2, Star as StarIcon, Sun, Sunset, Target, Trash2, User, Zap } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Language } from '@/i18n/translations';
import type { RecoveryDay } from '@/types';
import { AVATAR_PRESETS, Avatar, BottomNav, BottomSheet, ProgressRing, QuickLogFAB, Toast } from '@/components/SharedComponents';
import { LANGUAGE_NAMES, useLanguage, useTranslation } from '@/i18n/i18nHooks';

// ==================== SettingsScreen ====================
export function SettingsScreen() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [showWorkDaysSheet, setShowWorkDaysSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chooseAvatar = (id: string) => {
    dispatch({ type: 'SET_AVATAR', payload: id });
    setShowAvatarSheet(false);
    setToast({ visible: true, message: 'Profile picture updated!' });
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Downscale to a small square so the photo fits comfortably in
        // localStorage instead of storing the original multi-MB photo.
        const size = 300;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        chooseAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleNotification = (key: keyof typeof state.settings.notifications) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        notifications: { ...state.settings.notifications, [key]: !state.settings.notifications[key] },
      },
    });
  };

  const resetProgress = () => {
    dispatch({ type: 'RESET' });
    navigate('/onboarding');
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('settings')}</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Profile Section */}
        <Section title={t('profile')}>
          <button onClick={() => setShowAvatarSheet(true)} className="w-full flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Avatar avatar={state.user?.avatar} name={state.user?.name} size={36} />
              <span className="text-body text-[var(--text-primary)]">Profile Picture</span>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
          <SettingRow icon={<User size={18} />} label={t('yourName')} value={state.user?.name || 'User'} />
          <SettingRow icon={<Scale size={18} />} label={t('currentWeight')} value={`${state.user?.currentWeight || 90} kg`} />
          <SettingRow icon={<Target size={18} />} label={t('goalWeight')} value={`${state.user?.goalWeight || 78} kg`} />
          <SettingRow icon={<Ruler size={18} />} label={t('height')} value={`${state.user?.height || 175} cm`} />
          <SettingRow icon={<Calendar size={18} />} label={t('age')} value={`${state.user?.age || 30}`} />
          <button onClick={() => setShowWorkDaysSheet(true)} className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-[var(--text-tertiary)]" />
              <span className="text-body text-[var(--text-primary)]">{t('workDaysPerWeek')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-body text-[var(--text-secondary)]">{state.user?.workDays || 4} Days</span>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </div>
          </button>
        </Section>

        {/* Preferences */}
        <Section title={t('settings')}>
          <button onClick={() => setShowThemeSheet(true)} className="w-full flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Moon size={18} className="text-[var(--text-secondary)]" />
              <span className="text-body text-[var(--text-primary)]">{t('theme')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-body-sm text-[var(--text-secondary)] capitalize">{state.settings.theme}</span>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </div>
          </button>
          <button onClick={() => setShowLangSheet(true)} className="w-full flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[var(--text-secondary)]" />
              <span className="text-body text-[var(--text-primary)]">{t('language')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-body-sm text-[var(--text-secondary)]">{LANGUAGE_NAMES[language]}</span>
              <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
            </div>
          </button>
          <SettingRow icon={<span className="text-body-sm text-[var(--text-secondary)]">kg/cm</span>} label={t('units')} value={t('metric')} />
        </Section>

        {/* Notifications */}
        <Section title={t('notifications')}>
          {([
            [t('workoutReminders'), 'workoutReminders'],
            [t('mealReminders'), 'nutritionReminders'],
            [t('waterReminders'), 'supplementReminders'],
            ['Weekly Report', 'weeklyReport'],
            [t('achievements'), 'achievements'],
          ] as [string, keyof typeof state.settings.notifications][]).map(([label, key]) => (
            <ToggleRow
              key={key}
              label={label}
              value={state.settings.notifications[key]}
              onToggle={() => toggleNotification(key)}
            />
          ))}
        </Section>

        {/* Data */}
        <Section title={t('data')}>
          <button onClick={() => setToast({ visible: true, message: t('exportData') + '!' })} className="w-full flex items-center justify-between py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Share2 size={18} className="text-[var(--accent-primary)]" />
              <span className="text-body text-[var(--text-primary)]">{t('exportData')}</span>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
          <button onClick={() => setShowResetConfirm(true)} className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Trash2 size={18} className="text-[var(--accent-danger)]" />
              <span className="text-body text-[var(--accent-danger)]">{t('resetData')}</span>
            </div>
            <ChevronRight size={16} className="text-[var(--accent-danger)]/50" />
          </button>
        </Section>

        {/* About */}
        <Section title={t('about')}>
          <SettingRow icon={<Info size={18} />} label={t('version')} value="1.0.0" />
          <button onClick={() => setToast({ visible: true, message: 'Thanks!' })} className="w-full flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <StarIcon size={18} className="text-[var(--accent-secondary)]" />
              <span className="text-body text-[var(--text-primary)]">{t('rateApp')}</span>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
        </Section>
      </div>

      {/* Theme Sheet */}
      <BottomSheet isOpen={showThemeSheet} onClose={() => setShowThemeSheet(false)}>
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-h3 text-[var(--text-primary)] text-center mb-4">{t('theme')}</h3>
          {(['dark', 'light', 'system'] as const).map(th => (
            <button
              key={th}
              onClick={() => { dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: th } }); setShowThemeSheet(false); }}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl mb-2 ${
                state.settings.theme === th ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-tertiary)]'
              }`}
            >
              <span className={`text-body capitalize ${state.settings.theme === th ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                {th === 'dark' ? t('darkMode') : th === 'light' ? t('lightMode') : t('auto')}
              </span>
              {state.settings.theme === th && <CheckIcon />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Language Sheet */}
      <BottomSheet isOpen={showLangSheet} onClose={() => setShowLangSheet(false)}>
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-h3 text-[var(--text-primary)] text-center mb-4">{t('language')}</h3>
          {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setShowLangSheet(false); setToast({ visible: true, message: t('save') + '!' }); }}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-xl mb-2 ${
                language === lang ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-tertiary)]'
              }`}
            >
              <span className={`text-body ${language === lang ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                {LANGUAGE_NAMES[lang]}
              </span>
              {language === lang && <CheckIcon />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Training Days Sheet */}
      <BottomSheet isOpen={showWorkDaysSheet} onClose={() => setShowWorkDaysSheet(false)}>
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-h3 text-[var(--text-primary)] text-center mb-1">{t('workDaysPerWeek')}</h3>
          <p className="text-body-sm text-[var(--text-secondary)] text-center mb-4">
            {t('workDaysHelpText')}
          </p>
          <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1">
            {([3, 4] as const).map(n => (
              <button
                key={n}
                onClick={() => {
                  dispatch({ type: 'UPDATE_USER', payload: { workDays: n } });
                  setShowWorkDaysSheet(false);
                  setToast({ visible: true, message: t('save') + '!' });
                }}
                className={`flex-1 py-2.5 rounded-lg text-body-sm font-medium transition-all ${
                  (state.user?.workDays || 4) === n ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)]'
                }`}
              >
                {n} Days
              </button>
            ))}
          </div>
          <button
            onClick={() => { setShowWorkDaysSheet(false); navigate('/workout/schedule'); }}
            className="w-full mt-3 py-2.5 rounded-xl text-body-sm font-medium text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 flex items-center justify-center gap-2"
          >
            <Calendar size={16} />
            {t('openWorkoutSchedule')}
          </button>
        </div>
      </BottomSheet>

      {/* Avatar Picker Sheet */}
      <BottomSheet isOpen={showAvatarSheet} onClose={() => setShowAvatarSheet(false)}>
        <div className="px-6 pt-2 pb-6">
          <h3 className="text-h3 text-[var(--text-primary)] text-center mb-1">Profile Picture</h3>
          <p className="text-body-sm text-[var(--text-secondary)] text-center mb-4">Pick a character or use your own photo</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl mb-4 bg-[var(--accent-primary)] text-white font-semibold"
          >
            <Camera size={18} />
            Take or Upload Photo
          </button>

          <div className="grid grid-cols-5 gap-3">
            {AVATAR_PRESETS.map(preset => {
              const isSelected = state.user?.avatar === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => chooseAvatar(preset.id)}
                  className="flex flex-col items-center gap-1"
                  aria-label={preset.emoji}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: preset.gradient,
                      boxShadow: isSelected ? '0 0 0 2px var(--bg-elevated), 0 0 0 4px var(--accent-primary)' : 'none',
                    }}
                  >
                    {preset.emoji}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Reset Confirm Sheet */}
      <BottomSheet isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} maxHeight="40vh">
        <div className="px-6 pt-2 pb-6 text-center">
          <Trash2 size={32} className="text-[var(--accent-danger)] mx-auto mb-3" />
          <h3 className="text-h3 text-[var(--text-primary)] mb-2">{t('resetData')}?</h3>
          <p className="text-body text-[var(--text-secondary)] mb-6">This will erase all your progress, logs, and settings. This action cannot be undone.</p>
          <button onClick={resetProgress} className="w-full h-12 rounded-xl bg-[var(--accent-danger)] text-white font-semibold mb-3">
            {t('reset')}
          </button>
          <button onClick={() => setShowResetConfirm(false)} className="btn-secondary">{t('cancel')}</button>
        </div>
      </BottomSheet>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-caption text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{title}</h3>
      <div className="card !py-2 !px-4">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-[var(--text-secondary)]">{icon}</span>
        <span className="text-body text-[var(--text-primary)]">{label}</span>
      </div>
      <span className="text-body-sm text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-body text-[var(--text-primary)]">{label}</span>
      <button onClick={onToggle} className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}>
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ==================== RecoveryHub ====================
const DEFAULT_RECOVERY_FORM = {
  sleepHours: 7.5,
  sleepQuality: 4,
  stressLevel: 3,
  soreness: { legs: 2, back: 1, chest: 0, shoulders: 3, arms: 0 },
};

export function RecoveryHub() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const todayKey = new Date().toISOString().split('T')[0];
  const loggedToday = state.recovery[todayKey];

  const formFromLog = (log?: RecoveryDay) => log ? {
    sleepHours: log.sleepHours,
    sleepQuality: log.sleepQuality,
    stressLevel: log.stressLevel,
    soreness: { legs: 0, back: 0, chest: 0, shoulders: 0, arms: 0, ...log.soreness },
  } : DEFAULT_RECOVERY_FORM;

  const [recoveryForm, setRecoveryForm] = useState(() => formFromLog(loggedToday));

  const openLogSheet = () => {
    setRecoveryForm(formFromLog(loggedToday));
    setShowLogSheet(true);
  };

  const avgSoreness =
    (recoveryForm.soreness.legs +
      recoveryForm.soreness.back +
      recoveryForm.soreness.chest +
      recoveryForm.soreness.shoulders +
      recoveryForm.soreness.arms) /
    5;
  const formRecoveryScore = Math.round(
    Math.min(recoveryForm.sleepHours / 8, 1) * 40 +
      (recoveryForm.sleepQuality / 5) * 20 +
      (1 - recoveryForm.stressLevel / 5) * 20 +
      (1 - avgSoreness / 4) * 20
  );

  // The hero/sleep/stress cards reflect what's actually been logged today,
  // not the in-progress edit-sheet draft.
  const hasLoggedToday = !!loggedToday;
  const recoveryScore = hasLoggedToday ? loggedToday.recoveryScore : 0;
  const scoreColor = !hasLoggedToday ? 'var(--text-tertiary)' : recoveryScore >= 80 ? 'var(--accent-primary)' : recoveryScore >= 50 ? 'var(--accent-secondary)' : 'var(--accent-danger)';
  const scoreLabel = !hasLoggedToday ? 'Not Logged Yet' : recoveryScore >= 80 ? 'Well Recovered' : recoveryScore >= 50 ? 'Moderate' : 'Needs Rest';
  const scoreSub = !hasLoggedToday ? 'Log today to see your score' : recoveryScore >= 80 ? 'Ready to train hard' : recoveryScore >= 50 ? 'Light training recommended' : 'Prioritize rest today';

  const sleepDiff = hasLoggedToday ? loggedToday.sleepHours - 8 : 0;
  const stressPct = hasLoggedToday ? Math.min(100, Math.max(0, (loggedToday.stressLevel / 10) * 100)) : 0;
  const stressTier = !hasLoggedToday ? '' : loggedToday.stressLevel <= 3 ? 'Low Stress' : loggedToday.stressLevel <= 6 ? 'Moderate Stress' : 'High Stress';

  const saveRecovery = () => {
    const recovery: RecoveryDay = {
      date: todayKey,
      sleepHours: recoveryForm.sleepHours,
      sleepQuality: recoveryForm.sleepQuality,
      stressLevel: recoveryForm.stressLevel,
      soreness: recoveryForm.soreness,
      recoveryScore: formRecoveryScore,
    };
    dispatch({ type: 'LOG_RECOVERY', payload: recovery });
    setShowLogSheet(false);
    setToast({ visible: true, message: 'Recovery logged successfully!' });
  };

  const muscleGroups = hasLoggedToday
    ? [
        { name: 'Legs', value: loggedToday.soreness.legs ?? 0 },
        { name: 'Back', value: loggedToday.soreness.back ?? 0 },
        { name: 'Chest', value: loggedToday.soreness.chest ?? 0 },
        { name: 'Shoulders', value: loggedToday.soreness.shoulders ?? 0 },
        { name: 'Arms', value: loggedToday.soreness.arms ?? 0 },
      ]
    : [
        { name: 'Legs', value: 0 },
        { name: 'Back', value: 0 },
        { name: 'Chest', value: 0 },
        { name: 'Shoulders', value: 0 },
        { name: 'Arms', value: 0 },
      ];

  const formMuscleGroups = [
    { name: 'Legs', value: recoveryForm.soreness.legs },
    { name: 'Back', value: recoveryForm.soreness.back },
    { name: 'Chest', value: recoveryForm.soreness.chest },
    { name: 'Shoulders', value: recoveryForm.soreness.shoulders },
    { name: 'Arms', value: recoveryForm.soreness.arms },
  ];

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('recoveryHub')}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Recovery Score Hero */}
        <div className="card py-8 text-center" style={{ background: 'linear-gradient(180deg, var(--bg-secondary) 0%, rgba(96,165,250,0.08) 100%)' }}>
          <ProgressRing
            size={160}
            strokeWidth={12}
            progress={recoveryScore}
            color={scoreColor}
            centerText={`${recoveryScore}`}
            subText="Recovery Score"
          />
          <h3 className="text-h3 mt-4" style={{ color: scoreColor }}>{scoreLabel}</h3>
          <p className="text-body-sm text-[var(--text-secondary)] mt-1">{scoreSub}</p>
        </div>

        {/* Sleep */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={18} className="text-[var(--accent-tertiary)]" />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('sleep')}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-metric text-[var(--text-primary)]">{hasLoggedToday ? `${loggedToday.sleepHours}h` : '--'}</p>
              <div className="flex gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} filled={hasLoggedToday && s <= loggedToday.sleepQuality} />
                ))}
              </div>
              <p className="text-caption text-[var(--text-secondary)] mt-1">{t('lastNight')}</p>
            </div>
            <div className="flex-1">
              <MiniLineChart color="#60A5FA" />
              <p className="text-body-sm text-[var(--accent-primary)] mt-1">
                {hasLoggedToday
                  ? (sleepDiff >= 0 ? `+${sleepDiff.toFixed(1)}h surplus` : `${sleepDiff.toFixed(1)}h deficit`)
                  : 'Not logged yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Stress */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-[var(--accent-tertiary)]" />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('stressLevel')}</h3>
          </div>
          <div className="relative h-3 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
            <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #34D399, #F59E0B, #EF4444)' }} />
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${stressPct}%` }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 w-0.5 h-full bg-white shadow-lg"
            />
          </div>
          <p className="text-body-sm text-[var(--accent-primary)] mt-2">
            {hasLoggedToday ? `${loggedToday.stressLevel}/10 — ${stressTier}` : 'Not logged yet'}
          </p>
        </div>

        {/* Soreness */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={18} className="text-[var(--accent-tertiary)]" />
            <h3 className="text-h3 text-[var(--text-primary)]">{t('muscleSoreness')}</h3>
          </div>
          <div className="space-y-2">
            {muscleGroups.map(m => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-body-sm text-[var(--text-primary)] w-20">{m.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${m.value * 10}%`,
                    background: m.value < 3 ? 'var(--accent-primary)' : m.value < 6 ? 'var(--accent-secondary)' : 'var(--accent-danger)',
                  }} />
                </div>
                <span className="text-caption text-[var(--text-secondary)] w-8 text-right">{m.value}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card" style={{ borderLeft: '2px solid var(--accent-primary)' }}>
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('todaysRecommendations')}</h3>
          <div className="space-y-2">
            {[
              'Sleep target: 8 hours tonight',
              'Hydration: prioritize 3.5L water',
              'Consider foam rolling before workout',
              'Your recovery trend is positive',
            ].map((r, i) => (
              <p key={i} className="text-body-sm text-[var(--text-primary)]">✓ {r}</p>
            ))}
          </div>
        </div>

        {/* Log Button */}
        <button onClick={openLogSheet} className="btn-primary">
          {hasLoggedToday ? "Update Today's Recovery" : "Log Today's Recovery"}
        </button>
      </div>

      {/* Recovery Log Bottom Sheet */}
      <BottomSheet isOpen={showLogSheet} onClose={() => setShowLogSheet(false)}>
        <div className="px-6 pt-2 pb-6 space-y-5">
          <h3 className="text-h3 text-[var(--text-primary)] text-center">{t('logRecovery')}</h3>
          
          <div>
            <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Sleep Hours: {recoveryForm.sleepHours}h</label>
            <input type="range" min={0} max={12} step={0.5} value={recoveryForm.sleepHours}
              onChange={e => setRecoveryForm(f => ({ ...f, sleepHours: Number(e.target.value) }))}
              className="w-full accent-[var(--accent-primary)]" />
          </div>

          <div>
            <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Sleep Quality (1-5)</label>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRecoveryForm(f => ({ ...f, sleepQuality: s }))} className="text-2xl">
                  <Star filled={s <= recoveryForm.sleepQuality} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Stress Level: {recoveryForm.stressLevel}/10</label>
            <input type="range" min={0} max={10} step={1} value={recoveryForm.stressLevel}
              onChange={e => setRecoveryForm(f => ({ ...f, stressLevel: Number(e.target.value) }))}
              className="w-full accent-[var(--accent-primary)]" />
          </div>

          {formMuscleGroups.map(m => (
            <div key={m.name}>
              <label className="text-caption text-[var(--text-secondary)] uppercase mb-1 block">{m.name} Soreness</label>
              <input type="range" min={0} max={10} step={1} value={recoveryForm.soreness[m.name.toLowerCase() as keyof typeof recoveryForm.soreness]}
                onChange={e => setRecoveryForm(f => ({ ...f, soreness: { ...f.soreness, [m.name.toLowerCase()]: Number(e.target.value) } }))}
                className="w-full accent-[var(--accent-primary)]" />
            </div>
          ))}

          <button onClick={saveRecovery} className="btn-primary">{t('save')}</button>
        </div>
      </BottomSheet>

      {/* /recovery is one of the 5 primary tabs (see BottomNav's own tabs
          list), but this screen never actually rendered the tab bar --
          landing here left no way to switch tabs except the back button. */}
      <BottomNav />
      <QuickLogFAB />
      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MiniLineChart({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 40" className="w-full h-10">
      <polyline points="0,30 15,25 30,28 45,20 60,22 75,15 90,18 100,10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==================== SupplementTracker ====================
const TIMING_ICONS: Record<string, React.ReactNode> = {
  'Morning': <Sun size={16} className="text-[var(--accent-secondary)]" />,
  'Pre-Workout': <Zap size={16} className="text-[var(--accent-primary)]" />,
  'Evening': <Sunset size={16} className="text-[var(--accent-tertiary)]" />,
  'Bedtime': <Moon size={16} className="text-[var(--accent-tertiary)]" />,
};

export function SupplementTracker() {
  const { t } = useTranslation();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [newSupp, setNewSupp] = useState({ name: '', dose: '', timing: 'Morning', notes: '' });

  const toggleSupplement = (id: string) => {
    dispatch({ type: 'TOGGLE_SUPPLEMENT', payload: id });
  };

  const addSupplement = () => {
    if (!newSupp.name) return;
    dispatch({
      type: 'ADD_SUPPLEMENT',
      payload: { id: Date.now().toString(), ...newSupp, taken: false },
    });
    setShowAddSheet(false);
    setNewSupp({ name: '', dose: '', timing: 'Morning', notes: '' });
    setToast({ visible: true, message: `${newSupp.name} added!` });
  };

  const adherence = Math.round((state.supplements.filter(s => s.taken).length / state.supplements.length) * 100) || 0;

  const groupByTiming = () => {
    const groups: Record<string, typeof state.supplements> = {};
    state.supplements.forEach(s => {
      if (!groups[s.timing]) groups[s.timing] = [];
      groups[s.timing].push(s);
    });
    return groups;
  };

  const groups = groupByTiming();

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-primary)] pb-8">
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center backdrop-blur-xl bg-[var(--bg-primary)]/80">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} className="text-[var(--text-primary)]" />
        </button>
        <h1 className="text-h3 text-[var(--text-primary)] absolute left-0 right-0 text-center pointer-events-none">{t('supplementTracker')}</h1>
      </div>

      <div className="px-4 space-y-3">
        {/* Adherence */}
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-body text-[var(--text-primary)]">{t('todaysAdherence')}</p>
            <p className="text-caption text-[var(--text-secondary)]">
              {state.supplements.filter(s => s.taken).length}/{state.supplements.length} taken
            </p>
          </div>
          <ProgressRing size={56} strokeWidth={5} progress={adherence} color="var(--accent-primary)" centerText={`${adherence}%`} />
        </div>

        {/* Grouped supplements */}
        {Object.entries(groups).map(([timing, supps]) => (
          <div key={timing}>
            <div className="flex items-center gap-2 mb-2 mt-4">
              {TIMING_ICONS[timing] || <Pill size={16} />}
              <span className="text-caption text-[var(--text-secondary)] uppercase">{timing}</span>
            </div>
            <div className="space-y-2">
              {supps.map(supp => (
                <motion.div
                  key={supp.id}
                  layout
                  className="card flex items-center gap-3"
                >
                  <Pill size={18} className="text-[var(--accent-tertiary)] shrink-0" />
                  <div className="flex-1">
                    <p className="text-body text-[var(--text-primary)]">{supp.name}</p>
                    <p className="text-caption text-[var(--text-secondary)]">{supp.dose} · {supp.notes}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleSupplement(supp.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      supp.taken
                        ? 'bg-[var(--accent-primary)]'
                        : 'border-2 border-[var(--text-tertiary)]'
                    }`}
                  >
                    {supp.taken && <Check size={16} className="text-white" />}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Add button */}
        <button onClick={() => setShowAddSheet(true)} className="flex items-center gap-2 text-body text-[var(--accent-primary)] mt-4">
          <Plus size={18} /> Add Supplement
        </button>

        {/* Weekly Adherence Chart */}
        <div className="card mt-4">
          <h3 className="text-h3 text-[var(--text-primary)] mb-3">{t('thisWeeksAdherence')}</h3>
          <div className="flex items-end justify-between gap-2 h-20">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const pct = [100, 75, 100, 50, 100, 75, 100][i];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-[var(--bg-tertiary)] rounded-t-md relative overflow-hidden" style={{ height: 50 }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="absolute bottom-0 w-full rounded-t-md"
                      style={{ background: pct >= 80 ? 'var(--accent-primary)' : pct >= 50 ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)]">{day}</span>
                </div>
              );
            })}
          </div>
          <p className="text-metric-sm text-[var(--accent-primary)] mt-2 text-center">86% average</p>
        </div>
      </div>

      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)}>
        <div className="px-6 pt-2 pb-6 space-y-4">
          <h3 className="text-h3 text-[var(--text-primary)] text-center">{t('addSupplement')}</h3>
          <input
            type="text"
            value={newSupp.name}
            onChange={e => setNewSupp(s => ({ ...s, name: e.target.value }))}
            placeholder={t('supplementNamePlaceholder')}
            className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
          />
          <input
            type="text"
            value={newSupp.dose}
            onChange={e => setNewSupp(s => ({ ...s, dose: e.target.value }))}
            placeholder={t('dosePlaceholder')}
            className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
          />
          <select
            value={newSupp.timing}
            onChange={e => setNewSupp(s => ({ ...s, timing: e.target.value }))}
            className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
          >
            {['Morning', 'Pre-Workout', 'Evening', 'Bedtime'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={newSupp.notes}
            onChange={e => setNewSupp(s => ({ ...s, notes: e.target.value }))}
            placeholder={t('notesPlaceholderSupp')}
            className="w-full h-12 px-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none"
          />
          <button onClick={addSupplement} className="btn-primary">{t('addSupplement')}</button>
        </div>
      </BottomSheet>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
