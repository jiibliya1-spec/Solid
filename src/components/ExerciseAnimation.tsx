import { motion } from 'framer-motion';

// A small set of animated stick-figure pictograms that show the actual
// movement path of an exercise (arm swinging overhead, hip hinging, knee
// bending, etc.) instead of a static placeholder. Not a real photo/video
// demo (that would need licensed footage), but a real, exercise-specific
// animation -- matched from the exercise's name/muscle, with a sensible
// generic fallback for anything unmatched (including user-created custom
// exercises).

type Pattern =
  | 'press-overhead' | 'press-horizontal' | 'curl' | 'triceps-extension'
  | 'lateral-raise' | 'row' | 'pulldown' | 'upright-row' | 'face-pull'
  | 'flye' | 'shrug' | 'squat' | 'hinge' | 'leg-curl' | 'leg-extension'
  | 'calf-raise' | 'push-up' | 'generic';

function matchPattern(name: string, muscle: string): Pattern {
  const n = name.toLowerCase();
  const m = muscle.toLowerCase();
  if (n.includes('leg curl')) return 'leg-curl';
  if (n.includes('leg extension')) return 'leg-extension';
  if (n.includes('calf')) return 'calf-raise';
  if (n.includes('squat') || n.includes('leg press') || n.includes('lunge')) return 'squat';
  if (n.includes('deadlift') || n.includes('hinge') || n.includes('good morning')) return 'hinge';
  if (n.includes('push up') || n.includes('push-up') || n.includes('pushup') || n.includes('dip')) return 'push-up';
  if (n.includes('bench') || n.includes('incline') || n.includes('chest press')) return 'press-horizontal';
  if (n.includes('shrug')) return 'shrug';
  if (n.includes('pulldown')) return 'pulldown';
  if (n.includes('upright row')) return 'upright-row';
  if (n.includes('face pull')) return 'face-pull';
  if (n.includes('row')) return 'row';
  if (n.includes('fly') || n.includes('flye')) return 'flye';
  if (n.includes('lateral raise') || n.includes('side raise')) return 'lateral-raise';
  if (n.includes('overhead press') || n.includes('shoulder press') || (n.includes('press') && m.includes('shoulder'))) return 'press-overhead';
  if (n.includes('curl')) return 'curl';
  if (n.includes('extension') || n.includes('pushdown') || n.includes('push down')) return 'triceps-extension';
  if (n.includes('press')) return 'press-horizontal';
  return 'generic';
}

const loop = { duration: 1.3, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const };

// -- Standing figure, arm pivots around the shoulder. Reused for every
// upper-body isolation/compound move that's performed standing. --
function StandingArmSwing({ from, to }: { from: number; to: number }) {
  return (
    <>
      {/* legs */}
      <line x1="50" y1="60" x2="42" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* torso */}
      <line x1="50" y1="60" x2="50" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* head */}
      <circle cx="50" cy="28" r="7" fill="currentColor" />
      {/* animated arm, pivoting at the shoulder (50,38) */}
      <motion.g style={{ originX: '50px', originY: '38px' } as React.CSSProperties} animate={{ rotate: [from, to] }} transition={loop}>
        <line x1="50" y1="38" x2="50" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="60" r="3.5" fill="currentColor" />
      </motion.g>
    </>
  );
}

function StandingStatic({ shoulderBob = false }: { shoulderBob?: boolean }) {
  const body = (
    <>
      <line x1="50" y1="60" x2="42" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="60" x2="50" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="28" r="7" fill="currentColor" />
      <line x1="50" y1="38" x2="45" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="38" x2="55" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </>
  );
  if (!shoulderBob) return body;
  return <motion.g animate={{ y: [0, -4] }} transition={loop}>{body}</motion.g>;
}

function SquatFigure() {
  return (
    <>
      <motion.g animate={{ y: [0, 10] }} transition={loop}>
        <circle cx="50" cy="28" r="7" fill="currentColor" />
        <line x1="50" y1="35" x2="50" y2="60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
      <motion.line x1="42" x2="42" y2="88" animate={{ y1: [60, 70] }} transition={loop} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.line x1="58" x2="58" y2="88" animate={{ y1: [60, 70] }} transition={loop} stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

function HingeFigure() {
  return (
    <>
      <line x1="50" y1="60" x2="42" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.g style={{ originX: '50px', originY: '60px' } as React.CSSProperties} animate={{ rotate: [0, 48] }} transition={loop}>
        <line x1="50" y1="60" x2="50" y2="35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="28" r="7" fill="currentColor" />
        <line x1="50" y1="42" x2="50" y2="58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function CalfRaiseFigure() {
  return (
    <>
      <line x1="20" y1="90" x2="80" y2="90" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <motion.g animate={{ y: [0, -5] }} transition={loop}>
        <StandingStatic />
      </motion.g>
    </>
  );
}

function PushUpFigure() {
  return (
    <>
      <line x1="15" y1="78" x2="85" y2="78" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <motion.g animate={{ y: [0, 9] }} transition={loop}>
        <circle cx="22" cy="55" r="7" fill="currentColor" />
        <line x1="29" y1="57" x2="78" y2="62" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="35" y1="58" x2="30" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <line x1="72" y1="61" x2="78" y2="75" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function LegCurlFigure() {
  return (
    <>
      <circle cx="14" cy="50" r="6" fill="currentColor" />
      <line x1="20" y1="50" x2="58" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.line
        x1="58" y1="50"
        animate={{ x2: [86, 64], y2: [50, 28] }}
        transition={loop}
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
    </>
  );
}

function LegExtensionFigure() {
  return (
    <>
      <line x1="30" y1="85" x2="60" y2="85" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="45" cy="25" r="7" fill="currentColor" />
      <line x1="45" y1="32" x2="50" y2="55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="55" x2="72" y2="55" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.line
        x1="72" y1="55"
        animate={{ x2: [72, 92], y2: [78, 55] }}
        transition={loop}
        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      />
    </>
  );
}

function BenchPressFigure() {
  return (
    <>
      <line x1="12" y1="70" x2="88" y2="70" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="18" cy="66" r="7" fill="currentColor" />
      <line x1="25" y1="68" x2="60" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="55" y1="68" x2="50" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="68" x2="70" y2="88" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.g style={{ originX: '45px', originY: '65px' } as React.CSSProperties} animate={{ rotate: [150, 15] }} transition={loop}>
        <line x1="45" y1="65" x2="45" y2="87" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="45" cy="87" r="4" fill="currentColor" />
      </motion.g>
    </>
  );
}

const ANGLES: Partial<Record<Pattern, [number, number]>> = {
  'press-overhead': [90, 178],
  'lateral-raise': [0, 92],
  'curl': [0, 130],
  'flye': [15, 100],
  'row': [110, -10],
  'pulldown': [176, 78],
  'upright-row': [0, 148],
  'face-pull': [95, 8],
  'triceps-extension': [122, 18],
  'generic': [20, 100],
};

export function ExerciseAnimation({ name, muscle, className = '' }: { name: string; muscle: string; className?: string }) {
  const pattern = matchPattern(name, muscle);

  let content: React.ReactNode;
  switch (pattern) {
    case 'squat':
      content = <SquatFigure />;
      break;
    case 'hinge':
      content = <HingeFigure />;
      break;
    case 'calf-raise':
      content = <CalfRaiseFigure />;
      break;
    case 'push-up':
      content = <PushUpFigure />;
      break;
    case 'leg-curl':
      content = <LegCurlFigure />;
      break;
    case 'leg-extension':
      content = <LegExtensionFigure />;
      break;
    case 'press-horizontal':
      content = <BenchPressFigure />;
      break;
    case 'shrug':
      content = <StandingStatic shoulderBob />;
      break;
    default: {
      const [from, to] = ANGLES[pattern] ?? ANGLES.generic!;
      content = <StandingArmSwing from={from} to={to} />;
    }
  }

  return (
    <svg viewBox="0 0 100 100" className={className} style={{ color: 'var(--accent-primary)' }}>
      {content}
    </svg>
  );
}
