import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 