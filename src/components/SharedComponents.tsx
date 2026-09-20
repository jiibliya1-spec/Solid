// Merged shared-component file — combines: BottomNav, BottomSheet, ConfettiCelebration, ProgressRing, QuickLogFAB, Toast
import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Apple, Check, Dumbbell, Info, LayoutDashboard, Moon, Plus, TrendingUp, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QUICK_LOG_ITEMS } from '@/types';

// ==================== BottomNav ====================
const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/nutrition', icon: Apple, label: 'Nutrition' },
  { to: '/recovery', icon: Moon, label: 'Recovery' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
];

export function BottomNav() {
  const location = useLocation();
  const mainPaths = ['/dashboard', '/workout', '/nutrition', '/recovery', '/progress'];
  const isMainScreen = mainPaths.some(p => location.pathname === p);
  
  if (!isMainScreen) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[430px] h-16 safe-bottom flex items-center justify-around px-2 backdrop-blur-xl bg-[#141419]/90 border-t border-white/5">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-14 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-1 h-1 rounded-full bg-[var(--accent-primary)]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ==================== BottomSheet ====================
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
}

export function BottomSheet({ isOpen, onClose, children, maxHeight = '90vh' }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 z-50"
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-elevated)] rounded-t-3xl overflow-hidden"
            style={{ maxHeight }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[var(--bg-tertiary)]" />
            </div>
            <div className="overflow-y-auto scrollbar-hide pb-8" style={{ maxHeight: `calc(${maxHeight} - 40px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== ConfettiCelebration ====================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS = ['#34D399', '#F59E0B', '#60A5FA', '#FFFFFF', '#6EE7B7', '#FBBF24'];

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const createParticles = useCallback((centerX: number, centerY: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      const angle = (Math.random() * Math.PI * 1.5) - Math.PI * 0.75 - Math.PI / 2;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 4 + Math.random() * 6,
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
    return particles;
  }, []);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    particlesRef.current = createParticles(rect.width / 2, rect.height / 2);
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2500) {
        cancelAnimationFrame(animFrameRef.current);
        ctx.clearRect(0, 0, rect.width, rect.height);
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / 2500);

        if (p.opacity <= 0) return;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [trigger, createParticles, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ==================== ProgressRing ====================
interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  color?: string;
  centerText?: string;
  subText?: string;
  animate?: boolean;
}

export function ProgressRing({
  size = 120,
  strokeWidth = 8,
  progress,
  color = 'var(--accent-primary)',
  centerText,
  subText,
  animate = true,
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedProgress(progress), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animate]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: [0.33, 1, 0.68, 1] }}
          style={{
            filter: animatedProgress >= 100 ? 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))' : 'none',
          }}
        />
      </svg>
      {(centerText || subText) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          {/* Font size scales with the ring's own size instead of a fixed 28px --
              on a small ring (e.g. the 56-70px ones used for macros) a fixed size
              made the numbers crowd into / spill over the ring's stroke. */}
          {centerText && (
            <span
              className="text-[var(--text-primary)] font-bold text-center leading-tight"
              style={{ fontSize: Math.max(11, Math.round(size * 0.22)), letterSpacing: '-0.02em' }}
            >
              {centerText}
            </span>
          )}
          {subText && (
            <span
              className="text-[var(--text-secondary)] font-medium text-center leading-tight"
              style={{ fontSize: Math.max(9, Math.round(size * 0.1)), letterSpacing: '0.02em' }}
            >
              {subText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== QuickLogFAB ====================
const iconMap: Record<string, string> = {
  scale: 'Scale',
  apple: 'Apple',
  droplets: 'Droplets',
  dumbbell: 'Dumbbell',
  ruler: 'Ruler',
  pill: 'Pill',
};

export function QuickLogFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useApp();

  const mainPaths = ['/dashboard', '/workout', '/nutrition', '/recovery', '/progress'];
  if (!mainPaths.some(p => location.pathname === p)) return null;

  const handleAction = (label: string) => {
    setIsOpen(false);
    switch (label) {
      case 'Log Weight':
        dispatch({ type: 'SET_SCREEN', payload: 'progress' });
        navigate('/progress');
        break;
      case 'Log Meal':
        navigate('/nutrition');
        break;
      case 'Log Water':
        navigate('/nutrition');
        break;
      case 'Log Workout':
        navigate('/workout');
        break;
      case 'Log Measurement':
        navigate('/progress');
        break;
      case 'Log Supplement':
        navigate('/supplements');
        break;
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center glow-green"
        style={{
          background: 'linear-gradient(135deg, #34D399, #10B981)',
          // Same fix as the workout control bar: BottomNav's real height on an
          // iPhone is 64px PLUS the home-indicator safe area, so a plain
          // "bottom-20" (fixed 80px) let the nav's safe-area padding creep up
          // into the bottom of this button.
          bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Plus size={24} strokeWidth={2.5} className="text-white" />
      </motion.button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} maxHeight="50vh">
        <div className="px-6 pt-2">
          <h2 className="text-h3 text-[var(--text-primary)] text-center mb-6">Quick Log</h2>
          <div className="grid grid-cols-3 gap-4">
            {QUICK_LOG_ITEMS.map((item, i) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(item.label)}
                className="flex flex-col items-center gap-2 py-4"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <DynamicIcon name={iconMap[item.icon] || item.icon} color={item.color} />
                </div>
                <span className="text-body-sm text-[var(--text-primary)]">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function DynamicIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'Scale': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>;
    case 'Apple': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>;
    case 'Droplets': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91-4.35"/></svg>;
    case 'Dumbbell': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>;
    case 'Ruler': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></svg>;
    case 'Pill': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>;
    default: return <Plus size={24} color={color} />;
  }
}

// ==================== Toast ====================
interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const icons = {
  success: Check,
  warning: AlertTriangle,
  error: X,
  info: Info,
};

const colors = {
  success: 'var(--accent-primary)',
  warning: 'var(--accent-secondary)',
  error: 'var(--accent-danger)',
  info: 'var(--accent-tertiary)',
};

export function Toast({ message, type = 'success', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const Icon = icons[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 left-4 right-4 z-[70] flex justify-center"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg max-w-sm w-full"
            style={{
              background: 'var(--bg-elevated)',
              borderLeft: `3px solid ${colors[type]}`,
            }}
          >
            <Icon size={18} style={{ color: colors[type] }} />
            <span className="text-body text-[var(--text-primary)] flex-1">{message}</span>
            <button onClick={onClose} className="text-[var(--text-tertiary)]">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==================== Avatar ====================
export const AVATAR_PRESETS: { id: string; emoji: string; gradient: string }[] = [
  { id: 'preset:1', emoji: '💪', gradient: 'linear-gradient(135deg, #34D399, #059669)' },
  { id: 'preset:2', emoji: '🔥', gradient: 'linear-gradient(135deg, #FB923C, #DC2626)' },
  { id: 'preset:3', emoji: '🐯', gradient: 'linear-gradient(135deg, #FBBF24, #D97706)' },
  { id: 'preset:4', emoji: '🦁', gradient: 'linear-gradient(135deg, #F59E0B, #B45309)' },
  { id: 'preset:5', emoji: '🐼', gradient: 'linear-gradient(135deg, #94A3B8, #334155)' },
  { id: 'preset:6', emoji: '🦊', gradient: 'linear-gradient(135deg, #FB7185, #E11D48)' },
  { id: 'preset:7', emoji: '🐻', gradient: 'linear-gradient(135deg, #A78BFA, #6D28D9)' },
  { id: 'preset:8', emoji: '🐨', gradient: 'linear-gradient(135deg, #60A5FA, #1D4ED8)' },
  { id: 'preset:9', emoji: '🦉', gradient: 'linear-gradient(135deg, #2DD4BF, #0F766E)' },
  { id: 'preset:10', emoji: '🐵', gradient: 'linear-gradient(135deg, #C084FC, #7C3AED)' },
];

interface AvatarProps {
  avatar?: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Renders the user's chosen profile picture: an uploaded photo (data: URL),
 * a picked preset character, or a fallback initial — instead of a single
 * hardcoded image file for everyone.
 */
export function Avatar({ avatar, name, size = 48, className = '' }: AvatarProps) {
  const style = { width: size, height: size };

  if (avatar && avatar.startsWith('data:')) {
    return (
      <img
        src={avatar}
        alt={name || 'Profile'}
        className={`rounded-full object-cover ${className}`}
        style={style}
      />
    );
  }

  const preset = AVATAR_PRESETS.find(p => p.id === avatar);
  if (preset) {
    return (
      <div
        className={`rounded-full flex items-center justify-center ${className}`}
        style={{ ...style, background: preset.gradient, fontSize: size * 0.5, lineHeight: 1 }}
      >
        {preset.emoji}
      </div>
    );
  }

  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold ${className}`}
      style={{ ...style, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff', fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

/** Small fixed mascot avatar for the AI coach — not user-editable. */
export function CoachAvatar({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #60A5FA, #1D4ED8)', fontSize: size * 0.55, lineHeight: 1 }}
    >
      🤖
    </div>
  );
}
