// Merged i18n helper file — combines: LanguageContext, useTranslation
import type { Language, TranslationKey } from './translations';
import { LANGUAGE_NAMES, RTL_LANGUAGES, translations } from './translations';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ==================== LanguageContext ====================
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'transform_language';

function getSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'ar', 'de', 'fr', 'es'].includes(saved)) {
      return saved as Language;
    }
  } catch { /* ignore */ }
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>(getSavedLanguage);

  const isRTL = RTL_LANGUAGES.includes(language);

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRTL, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export { LANGUAGE_NAMES };

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}

// ==================== useTranslation ====================
export function useTranslation() {
  const { language, isRTL } = useLanguage();
  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    const dict = translations[language] as Record<string, string>;
    let text = dict?.[key] ?? translations.en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  };
  return { t, language, isRTL };
}
