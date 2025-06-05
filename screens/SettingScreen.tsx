import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Language, useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

const AVATAR_URL = '../assets/images/Unknown.png';

const SettingScreen = () => {
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  const [darkMode, setDarkMode] = useState(true);
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('Setting');
  const { t, i18n } = useTranslation();

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleLanguageChange = (lang: Language) => setLanguage(lang);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'FinanceScreen') navigation.replace('FinanceScreen');
    if (tab === 'Setting') return;
    // Thêm các tab khác nếu có
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/images/group.png')} style={styles.logo} />
        <Icon name="settings" size={36} color="#1e90ff" />
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image source={require('../assets/images/Unknown.jpg')} style={styles.avatar} />
        <Text style={styles.name}>Alexandra</Text>
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>{t('dateOfBirth')}: January 15,</Text>
          <Text style={styles.infoText}>
            {t('email')}: <Text style={styles.link} onPress={() => Linking.openURL('mailto:alexandra.johnson@example.com')}>alexandra.johnson@example.com</Text>
          </Text>
          <Text style={styles.infoText}>{t('phone')}: +1 (555) 123-4567</Text>
          <Text style={styles.infoText}>{t('gender')}: {t('female')}</Text>
        </View>
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile}>
          <Text style={styles.updateBtnText}>{t('updateProfile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
          <Text style={styles.changePasswordBtnText}>{t('changePasswordBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Language Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('languageSettings')}</Text>
        <Text style={styles.cardDesc}>{t('selectLanguage')}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <View style={[styles.radio, language === 'en' && styles.radioActive]}>
              {language === 'en' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'vi' && styles.langBtnActive]}
            onPress={() => setLanguage('vi')}
          >
            <View style={[styles.radio, language === 'vi' && styles.radioActive]}>
              {language === 'vi' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.flag}>🇻🇳</Text>
            <Text style={styles.langText}>Vietnam</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dark Mode */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('darkMode')}</Text>
        <Text style={styles.cardDesc}>{t('darkModeDesc')}</Text>
        <View style={styles.darkRow}>
          <Text style={styles.darkLabel}>{t('enableDarkMode')}</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: '#ccc', true: '#1e90ff' }}
            thumbColor="#fff"
          />
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  logo: { width: 100, height: 60, marginRight: 8, resizeMode: 'contain' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e90ff', flex: 1 },
  profileSection: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  name: { fontSize: 26, fontWeight: '600', color: '#333', marginBottom: 12 },
  infoBlock: { marginBottom: 12 },
  infoText: { fontSize: 15, color: '#444', marginBottom: 2 },
  link: { color: '#1e90ff', textDecorationLine: 'underline' },
  updateBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10 },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  changePasswordBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10 },
  changePasswordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  card: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, marginTop: 18, padding: 18, elevation: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  cardDesc: { color: '#888', marginBottom: 12 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between' },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, flex: 1, marginRight: 8 },
  langBtnActive: { backgroundColor: '#e6f0ff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#b0b0b0', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#1e90ff', backgroundColor: '#1e90ff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  flag: { fontSize: 20, marginRight: 4 },
  langText: { fontSize: 16, color: '#222' },
  darkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  darkLabel: { fontSize: 16, color: '#222' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 64, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', position: 'absolute', left: 0, right: 0, bottom: 0 },
  navItem: { alignItems: 'center', flex: 1 },
  navItemCenter: { alignItems: 'center', flex: 1 },
  plusBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#444', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navText: { fontSize: 12, color: '#b0b0b0', marginTop: 2 },
  navTextActive: { color: '#1e90ff', fontWeight: 'bold' },
});

export default SettingScreen; 