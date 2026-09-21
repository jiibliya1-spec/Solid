import { motion } from 'framer-motion';

// A set of animated exercise pictograms that show the actual movement path
// of each exercise (arm swinging overhead, hip hinging, knee bending, etc).
// Not a licensed photo/video demo or a copy of any stock muscle-map
// illustration -- an original, flat, filled "muscular figure" drawn in the
// app's own dark/mint theme: a bulkier body than a plain stick figure, with
// the specific muscle group actually doing the work of each exercise
// picked out in the accent color and the rest of the body left neutral, so
// it reads at a glance like a highlighted muscle diagram. The same simple
// figure design is reused for every exercise so it always looks like the
// same "person" performing each move.

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

// The figure's two-tone palette: NEUTRAL is the resting body, HILITE marks
// whichever muscle/limb is actually doing the work for that exercise.
const NEUTRAL = 'var(--text-secondary)';
const HILITE = 'var(--accent-primary)';

const loop = { duration: 1.3, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const };
// Rotating an SVG child by CSS transform needs a pivot point that's stable
// across the viewBox-to-pixel scaling the browser applies -- percentages or
// raw viewBox coordinates in transformOrigin don't reliably land on the
// right spot. The fix: translate a *static* wrapper <g> to the pivot point,
// then rotate a nested motion.g whose own origin is pinned at local (0,0)
// (origin "0px 0px" is scale-invariant), with all its children drawn in
// coordinates relative to that pivot.
function Pivot({ x, y, from, to, children }: { x: number; y: number; from: number; to: number; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g style={{ originX: '0px', originY: '0px' } as React.CSSProperties} animate={{ rotate: [from, to] }} transition={loop}>
        {children}
      </motion.g>
    </g>
  );
}

// A tapered torso "bulk" shape (filled), from shoulder width down to waist
// width, centered on x. Gives the figure a filled body instead of a single
// spine line.
function Torso({ x = 50, topY, botY, topW = 15, botW = 10, highlighted = false }: {
  x?: number; topY: number; botY: number; topW?: number; botW?: number; highlighted?: boolean;
}) {
  const color = highlighted ? HILITE : NEUTRAL;
  const dir = botY > topY ? 1 : -1; // curve bulges outward regardless of orientation
  return (
    <path
      d={`M ${x - topW / 2},${topY} Q ${x},${topY + 1.5 * dir} ${x + topW / 2},${topY} L ${x + botW / 2},${botY} Q ${x},${botY - 1.5 * dir} ${x - botW / 2},${botY} Z`}
      fill={color}
    />
  );
}

// A two-segment limb (upper + lower), drawn relative to a Pivot's local
// origin at the joint. The upper segment is thicker with a small bulge
// (the "muscle" -- bicep, delt, quad...) and can be highlighted; the lower
// segment (forearm/calf/hand) stays neutral so the highlight reads clearly.
function Limb({ len = 24, bendAt = 0.55, thickness = 7, highlighted = false, capRadius = 3 }: {
  len?: number; bendAt?: number; thickness?: number; highlighted?: boolean; capRadius?: number;
}) {
  const bendY = len * bendAt;
  const color = highlighted ? HILITE : NEUTRAL;
  return (
    <>
      <line x1="0" y1="0" x2="0" y2={bendY} stroke={color} strokeWidth={thickness} strokeLinecap="round" />
      <line x1="0" y1={bendY} x2="0" y2={len} stroke={NEUTRAL} strokeWidth={thickness - 2} strokeLinecap="round" />
      {highlighted && <circle cx="0" cy={bendY * 0.5} r={thickness * 0.62} fill={HILITE} fillOpacity="0.9" />}
      <circle cx="0" cy={len} r={capRadius} fill={NEUTRAL} />
    </>
  );
}

// -- Standing figure, arm pivots around the shoulder. Reused for every
// upper-body isolation/compound move that's performed standing. --
function StandingArmSwing({ from, to }: { from: number; to: number }) {
  return (
    <>
      {/* legs */}
      <line x1="50" y1="60" x2="42" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      {/* torso */}
      <Torso topY={35} botY={60} />
      {/* head */}
      <circle cx="50" cy="28" r="8" fill={NEUTRAL} />
      {/* the working arm, pivoting at the shoulder (50,38) -- highlighted, it's the muscle doing the exercise */}
      <Pivot x={50} y={38} from={from} to={to}>
        <Limb len={23} highlighted />
      </Pivot>
    </>
  );
}

function StandingStatic({ shoulderBob = false, highlightShoulders = false }: { shoulderBob?: boolean; highlightShoulders?: boolean }) {
  const body = (
    <>
      <line x1="50" y1="60" x2="42" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <Torso topY={35} botY={60} />
      <circle cx="50" cy="28" r="8" fill={NEUTRAL} />
      <line x1="50" y1="38" x2="45" y2="58" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="38" x2="55" y2="58" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      {/* trap/shoulder caps -- what a shrug actually works */}
      <circle cx="42" cy="36" r={highlightShoulders ? 5 : 3.5} fill={highlightShoulders ? HILITE : NEUTRAL} />
      <circle cx="58" cy="36" r={highlightShoulders ? 5 : 3.5} fill={highlightShoulders ? HILITE : NEUTRAL} />
    </>
  );
  if (!shoulderBob) return body;
  return <motion.g animate={{ y: [0, -4] }} transition={loop}>{body}</motion.g>;
}

function SquatFigure() {
  return (
    <>
      <motion.g animate={{ y: [0, 10] }} transition={loop}>
        <circle cx="50" cy="28" r="8" fill={NEUTRAL} />
        <Torso topY={35} botY={60} />
      </motion.g>
      {/* thighs (highlighted -- quads/glutes are the working muscle) bend on the way down, calves stay put */}
      <motion.line x1="50" y1="60" x2="42" animate={{ y2: [88, 74] }} transition={loop} stroke={HILITE} strokeWidth="8" strokeLinecap="round" />
      <motion.line x1="50" y1="60" x2="58" animate={{ y2: [88, 74] }} transition={loop} stroke={HILITE} strokeWidth="8" strokeLinecap="round" />
      <line x1="42" y1="74" x2="40" y2="88" stroke={NEUTRAL} strokeWidth="5" strokeLinecap="round" />
      <line x1="58" y1="74" x2="60" y2="88" stroke={NEUTRAL} strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

function HingeFigure() {
  return (
    <>
      <line x1="50" y1="60" x2="42" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="60" x2="58" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      {/* the hinging back/hips -- highlighted, this is the hamstring/glute/lower-back move */}
      <Pivot x={50} y={60} from={0} to={48}>
        <Torso x={0} topY={-32} botY={0} topW={13} botW={10} highlighted />
        <circle cx="0" cy="-32" r="8" fill={NEUTRAL} />
        <line x1="0" y1="-18" x2="0" y2="-2" stroke={NEUTRAL} strokeWidth="5" strokeLinecap="round" />
      </Pivot>
    </>
  );
}

function CalfRaiseFigure() {
  return (
    <>
      <line x1="20" y1="90" x2="80" y2="90" stroke={NEUTRAL} strokeWidth="1.5" strokeOpacity="0.25" />
      <motion.g animate={{ y: [0, -5] }} transition={loop}>
        <circle cx="50" cy="28" r="8" fill={NEUTRAL} />
        <Torso topY={35} botY={60} />
        <line x1="50" y1="38" x2="45" y2="58" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="38" x2="55" y2="58" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
        {/* thighs neutral, calves highlighted -- that's the muscle a raise actually works */}
        <line x1="50" y1="60" x2="42" y2="76" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="60" x2="58" y2="76" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
        <line x1="42" y1="76" x2="42" y2="88" stroke={HILITE} strokeWidth="6" strokeLinecap="round" />
        <line x1="58" y1="76" x2="58" y2="88" stroke={HILITE} strokeWidth="6" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function PushUpFigure() {
  return (
    <>
      <line x1="15" y1="78" x2="85" y2="78" stroke={NEUTRAL} strokeWidth="1.5" strokeOpacity="0.25" />
      <motion.g animate={{ y: [0, 9] }} transition={loop}>
        <circle cx="22" cy="55" r="8" fill={NEUTRAL} />
        {/* the plank torso -- highlighted, chest/triceps carry the dip */}
        <line x1="29" y1="57" x2="78" y2="62" stroke={HILITE} strokeWidth="8" strokeLinecap="round" />
        <line x1="35" y1="58" x2="30" y2="75" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
        <line x1="72" y1="61" x2="78" y2="75" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      </motion.g>
    </>
  );
}

function LegCurlFigure() {
  return (
    <>
      <circle cx="14" cy="50" r="7" fill={NEUTRAL} />
      <line x1="20" y1="50" x2="58" y2="50" stroke={NEUTRAL} strokeWidth="7" strokeLinecap="round" />
      {/* the curling lower leg -- highlighted, this is the hamstring working */}
      <motion.line
        x1="58" y1="50"
        animate={{ x2: [86, 64], y2: [50, 28] }}
        transition={loop}
        stroke={HILITE} strokeWidth="6" strokeLinecap="round"
      />
    </>
  );
}

function LegExtensionFigure() {
  return (
    <>
      <line x1="30" y1="85" x2="60" y2="85" stroke={NEUTRAL} strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="45" cy="25" r="8" fill={NEUTRAL} />
      <line x1="45" y1="32" x2="50" y2="55" stroke={NEUTRAL} strokeWidth="7" strokeLinecap="round" />
      <line x1="50" y1="55" x2="72" y2="55" stroke={NEUTRAL} strokeWidth="7" strokeLinecap="round" />
      {/* the extending lower leg -- highlighted, this is the quad working */}
      <motion.line
        x1="72" y1="55"
        animate={{ x2: [72, 92], y2: [78, 55] }}
        transition={loop}
        stroke={HILITE} strokeWidth="6" strokeLinecap="round"
      />
    </>
  );
}

function BenchPressFigure() {
  return (
    <>
      <line x1="12" y1="70" x2="88" y2="70" stroke={NEUTRAL} strokeWidth="1.5" strokeOpacity="0.25" />
      <circle cx="18" cy="66" r="8" fill={NEUTRAL} />
      {/* chest -- highlighted, the horizontal press's primary muscle */}
      <line x1="25" y1="68" x2="60" y2="68" stroke={HILITE} strokeWidth="8" strokeLinecap="round" />
      <line x1="55" y1="68" x2="50" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <line x1="60" y1="68" x2="70" y2="88" stroke={NEUTRAL} strokeWidth="6" strokeLinecap="round" />
      <Pivot x={45} y={65} from={150} to={15}>
        <Limb len={22} highlighted />
      </Pivot>
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
      content = <StandingStatic shoulderBob highlightShoulders />;
      break;
    default: {
      const [from, to] = ANGLES[pattern] ?? ANGLES.generic!;
      content = <StandingArmSwing from={from} to={to} />;
    }
  }

  return (
    <svg viewBox="0 0 100 100" className={className}>
      {content}
    </svg>
  );
}
