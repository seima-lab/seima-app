import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

// Get device language, fallback to 'en' if not supported
const getDeviceLanguage = () => {
  const locale = Localization.locale;
  if (locale && typeof locale === 'string' && locale.startsWith('vi')) return 'vi';
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 