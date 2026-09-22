import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// New user-facing screen: this app previously had no accounts at all
// (everything lived only in this device's local storage). This is the
// entry gate that lets someone create an account (email + password,
// synced to the cloud so their data follows them across devices) or skip
// straight past it and keep using the app locally as a guest.
export function AuthScreen() {
  const { signUp, signIn, continueAsGuest, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmNotice, setConfirmNotice] = useState<string | null>(null);

  const canSubmit = email.trim().length > 3 && email.includes('@') && password.length >= 6 && !submitting;

  const switchMode = (next: 'signup' | 'login') => {
    setMode(next);
    clearError();
    setConfirmNotice(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setConfirmNotice(null);
    try {
      if (mode === 'signup') {
        const result = await signUp(email.trim(), password);
        if (result.ok && result.needsEmailConfirm) {
          setConfirmNotice('Account created. Check your email to confirm it, then log in below.');
          setMode('login');
        }
      } else {
        await signIn(email.trim(), password);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[var(--bg-primary)] relative overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(160deg, rgba(52,211,153,0.35) 0%, rgba(52,211,153,0.08) 100%)' }}
          >
            <ShieldCheck size={30} className="text-[var(--accent-primary)]" />
          </div>
          <h1 className="text-h2 text-[var(--text-primary)]">Solid</h1>
          <p className="text-body-sm text-[var(--text-tertiary)] mt-1 text-center">
            {mode === 'signup' ? 'Create an account to sync your progress to the cloud' : 'Log in to pick up where you left off'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1 mb-6">
          {(['signup', 'login'] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-body-sm font-medium transition-all ${
                mode === m ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-secondary)]'
              }`}
            >
              {m === 'signup' ? 'Sign Up' : 'Log In'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-caption text-[var(--text-secondary)] uppercase mb-2 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-body border border-transparent focus:border-[var(--accent-primary)] outline-none transition-colors"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-body-sm text-[var(--accent-danger)]"
              >
                {error}
              </motion.p>
            )}
            {confirmNotice && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-body-sm text-[var(--accent-primary)]"
              >
                {confirmNotice}
              </motion.p>
            )}
          </AnimatePresence>

          <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary flex items-center justify-center gap-2">
            {submitting ? <Loader2 size={18} className="animate-spin" /> : mode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </div>

        {/* Guest option */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
          <span className="text-caption text-[var(--text-tertiary)]">OR</span>
          <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
        </div>
        <button onClick={continueAsGuest} className="btn-secondary">
          Continue Without an Account
        </button>
        <p className="text-caption text-[var(--text-tertiary)] text-center mt-3">
          Guest progress stays on this device only and won't sync or back up to the cloud.
        </p>
      </div>
    </div>
  );
}
