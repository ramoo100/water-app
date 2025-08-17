import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Use i18next-http-backend to load translations from a server
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Init i18next
  .init({
    // Languages we support
    supportedLngs: ['en', 'ar'],
    // Default language
    fallbackLng: 'en',
    // Namespace for translations
    ns: 'translation',
    defaultNS: 'translation',
    // Debugging
    debug: true,
    // Configuration for react-i18next
    react: {
      useSuspense: false, // Set to false to avoid Suspense issues
    },
    // Backend options for HttpApi
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
