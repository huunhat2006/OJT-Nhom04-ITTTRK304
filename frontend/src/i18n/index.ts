import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi';
import en from './locales/en';

const STORAGE_KEY = 'bton.lang';

const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) {
      return saved;
    }
  } catch {
    // localStorage may be unavailable — fall back to default
  }
  return 'vi';
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export const setLanguage = async (language: Language): Promise<void> => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // ignore storage errors — language still applies for this session
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
  await i18n.changeLanguage(language);
};

export default i18n;
