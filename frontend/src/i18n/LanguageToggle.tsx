import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { setLanguage, type Language } from './index';

export default function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const current: Language = i18n.language === 'en' ? 'en' : 'vi';
  const next: Language = current === 'vi' ? 'en' : 'vi';

  return (
    <button
      type="button"
      onClick={() => void setLanguage(next)}
      title={`${t('common.language')}: ${next === 'vi' ? 'Tiếng Việt' : 'English'}`}
      aria-label={`${t('common.language')}: ${next === 'vi' ? 'Tiếng Việt' : 'English'}`}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
    >
      <Languages className="w-5 h-5" />
      <span className="text-xs font-semibold uppercase">{current}</span>
    </button>
  );
}
