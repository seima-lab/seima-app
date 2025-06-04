import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';

export type Language = 'en' | 'vi';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'en',
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(i18n.language as Language);
  
  useEffect(() => {
    // Sync initial language from i18n
    const currentLang = i18n.language as Language;
    setLanguage(currentLang);
    
    // Listen for i18n language changes
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng as Language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 