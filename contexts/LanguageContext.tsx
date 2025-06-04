import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import i18n from '../i18n';

export type Language = 'en' | 'vi';

const LANGUAGE_STORAGE_KEY = 'selected_language';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  isLoading: boolean;
}>({
  language: 'en',
  setLanguage: () => {},
  isLoading: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved language on app start
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
          setLanguage(savedLanguage as Language);
          await i18n.changeLanguage(savedLanguage);
        } else {
          // If no saved language, use device language or fallback to 'en'
          const deviceLang = i18n.language as Language;
          setLanguage(deviceLang);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
        // Fallback to device language
        const deviceLang = i18n.language as Language;
        setLanguage(deviceLang);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedLanguage();
  }, []);
  
  useEffect(() => {
    // Listen for i18n language changes
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng as Language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  const changeLanguage = async (lang: Language) => {
    try {
      setLanguage(lang);
      await i18n.changeLanguage(lang);
      // Save language preference to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      console.log('Language saved to storage:', lang);
    } catch (error) {
      console.error('Error saving language to storage:', error);
    }
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 