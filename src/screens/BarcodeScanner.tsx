import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { useApp } from '@/context/AppContext';
import { Toast } from '@/components/SharedComponents';
import { useTranslation } from '@/i18n/i18nHooks';
import { lookupBarcode, BarcodeLookupError, type BarcodeProduct } from '@/lib/barcodeLookup';

// ==================== BarcodeScanner ====================
type ScanPhase = 'starting' | 'live' | 'looking-up' | 'result' | 'not-found' | 'lookup-error' | 'permission-denied';

export function BarcodeScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dispatch } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const handledCodeRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<ScanPhase>('starting');
  const [product, setProduct] = useState<BarcodeProduct | null>(null);
  const [selectedMeal, setSelectedMeal] = useState('Snack');
  const [toast, setToast] = useState({ visible: false, message: '' });

  const stopScanning = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const startScanning = useCallback(async () => {
    setPhase('starting');
    handledCodeRef.current = null;
    if (!readerRef.current) readerRef.current = new BrowserMultiFormatReader();
    try {
      const controls = await readerRef.current.decodeFromConstraints(
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false },
        videoRef.current ?? undefined,
        (result, err) => {
          setPhase(p => (p === 'starting' ? 'live' : p));
          if (result && handledCodeRef.current === null) {
            const code = result.getText();
            handledCodeRef.current = code;
            stopScanning();
            void handleScanned(code);
          } else if (err && !(err instanceof NotFoundException)) {
            // real decode/stream error mid-scan (not just "no barcode this frame")
          }
        }
      );
      controlsRef.current = controls;
      setPhase('live');
    } catch {
      setPhase('permission-denied');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopScanning]);

  const handleScanned = async (code: string) => {
    setPhase('looking-up');
    try {
      const found = await lookupBarcode(code);
      if (found) {
        setProduct(found);
        setPhase('result');
      } else {
        setPhase('not-found');
      }
    } catch (err) {
      console.error('Barcode lookup failed:', err instanceof BarcodeLookupError ? err.message : err);
      setPhase('lookup-error');
    }
  };

  useEffect(() => {
    startScanning();
    return () => stopScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scanAgain = () => {
    setProduct(null);
    startScanning();
  };

  const addFood = () => {
    if (!product) return;
    dispatch({
      type: 'ADD_FOOD',
      payload: {
        mealName: selectedMeal,
        food: {
          name: product.name,
          calories: product.calories,
          protein: product.protein,
          carbs: product.carbs,
          fat: product.fat,
          fiber: product.fiber,
          serving: product.serving,
        },
      },
    });
    setToast({ visible: true, message: `${t('addFood')} - ${t(selectedMeal.toLowerCase() as 'breakfast' | 'lunch' | 'snack' | 'dinner')}` });
    setTimeout(() => navigate('/nutrition'), 1000);
  };

  const close = () => {
    stopScanning();
    navigate(-1);
  };

  return (
    <div className="h-[100dvh] bg-black relative flex flex-col items-center justify-center overflow-hidden">
      <button onClick={close} className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
        <X size={20} className="text-white" />
      </button>

      {/* Live camera view */}
      {(phase === 'starting' || phase === 'live' || phase === 'looking-up') && (
        <>
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />

          <p className="text-body-lg text-white/70 mb-8 absolute top-20 z-10 px-8 text-center">{t('positionBarcode')}</p>

          {/* Scanner frame */}
          <div className="relative w-64 h-64 z-10">
            <div className="absolute inset-0 border-2 border-[var(--accent-primary)] rounded-lg" />
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-[var(--accent-primary)] rounded-tl-lg" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-[var(--accent-primary)] rounded-tr-lg" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-[var(--accent-primary)] rounded-bl-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-[var(--accent-primary)] rounded-br-lg" />
            {phase === 'live' && (
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-0.5 bg-[var(--accent-primary)] shadow-lg"
                style={{ boxShadow: '0 0 8px rgba(52,211,153,0.6)' }}
              />
            )}
          </div>

          {phase === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
          )}

          {phase === 'looking-up' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 gap-3">
              <Loader2 size={32} className="text-white animate-spin" />
              <p className="text-body text-white">{t('lookingUpProduct')}</p>
            </div>
          )}
        </>
      )}

      {/* Permission denied */}
      {phase === 'permission-denied' && (
        <div className="px-8 text-center z-10">
          <AlertTriangle size={40} className="text-[var(--accent-danger)] mx-auto mb-4" />
          <p className="text-body text-white/80 mb-6">{t('barcodeCameraPermissionDenied')}</p>
          <button onClick={startScanning} className="btn-primary">{t('retry')}</button>
        </div>
      )}

      {/* Not found / lookup error */}
      {(phase === 'not-found' || phase === 'lookup-error') && (
        <div className="px-8 text-center z-10">
          <AlertTriangle size={40} className="text-[var(--accent-danger)] mx-auto mb-4" />
          <p className="text-body text-white/80 mb-6">{phase === 'not-found' ? t('productNotFound') : t('barcodeLookupError')}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={scanAgain} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} /> {t('scanAgain')}
            </button>
            <button onClick={() => navigate('/nutrition/food/manual')} className="btn-primary">{t('enterManually')}</button>
          </div>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {phase === 'result' && product && (
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
            <h3 className="text-h3 text-[var(--text-primary)] text-center mb-1">{product.name}</h3>
            <p className="text-caption text-[var(--text-tertiary)] text-center mb-4">
              {[product.brand, product.serving].filter(Boolean).join(' · ')}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-body"><span className="text-[var(--text-secondary)]">{t('calories')}</span><span className="text-[var(--text-primary)]">{product.calories} kcal</span></div>
              <div className="flex justify-between text-body"><span className="text-[var(--text-secondary)]">{t('protein')}</span><span className="text-[var(--accent-primary)]">{product.protein}g</span></div>
              <div className="flex justify-between text-body"><span className="text-[var(--text-secondary)]">{t('carbs')}</span><span className="text-[var(--text-tertiary)]">{product.carbs}g</span></div>
              <div className="flex justify-between text-body"><span className="text-[var(--text-secondary)]">{t('fat')}</span><span className="text-[var(--text-tertiary)]">{product.fat}g</span></div>
            </div>

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
              <button onClick={scanAgain} className="btn-secondary flex items-center justify-center gap-2" style={{ flex: 1 }}>
                <RefreshCw size={16} /> {t('scanAgain')}
              </button>
              <button onClick={addFood} className="btn-primary" style={{ flex: 2 }}>{t('addFood')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
