import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LogoutModal from '../components/LogoutModal';
import { useAuth } from '../contexts/AuthContext';
import { Language, useLanguage } from '../contexts/LanguageContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { UserProfile, userService } from '../services/userService';

const SettingScreen = () => {
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  const { user: authUser, logout, isAuthenticated } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('Setting');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  
  // Prevent multiple concurrent API calls
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Load user profile from API
  useEffect(() => {
    loadUserProfile();
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated]);

  // Auto reload data when screen comes into focus (after returning from UpdateProfile)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        console.log('🔄 SettingScreen focused, force reloading profile...');
        loadUserProfile(true); // Force refresh
      }
    }, [isAuthenticated])
  );

  const loadUserProfile = async (forceRefresh: boolean = false) => {
    if (!isAuthenticated || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    // Prevent multiple concurrent calls
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Skipping profile load - already loading');
      return;
    }

    try {
      isLoadingRef.current = true;
      setLoading(true);
      console.log('🟡 Loading user profile...', forceRefresh ? '(Force Refresh)' : '');
      
      const profile = await userService.getCurrentUserProfile(forceRefresh);
      console.log('🟢 User profile loaded:', profile);
      
      if (isMountedRef.current) {
        setUserProfile(profile);
      }
    } catch (error: any) {
      console.error('🔴 Failed to load user profile:', error);
      
      if (isMountedRef.current) {
        // Only show alert if error is not AbortError (timeout/cancelled)
        if (error.name !== 'AbortError') {
          Alert.alert(
            t('common.error'),
            error.message || 'Failed to load profile',
            [
              {
                text: t('common.retry'),
                onPress: () => loadUserProfile(true),
              },
              {
                text: t('common.cancel'),
                style: 'cancel',
              },
            ]
          );
        } else {
          console.log('🟡 Request was aborted (timeout or cancelled)');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  };

  // Helper function to get avatar source based on gender
  const getAvatarSource = () => {
    if (userProfile?.user_avatar_url) {
      return { uri: userProfile.user_avatar_url };
    }
    
    // Use gender-based default avatar
    if (userProfile?.user_gender === true) {
      return require('../assets/images/maleavatar.png');
    } else if (userProfile?.user_gender === false) {
      return require('../assets/images/femaleavatar.png');
    }
    
    // Fallback to unknown avatar
    return require('../assets/images/Unknown.jpg');
  };

  const handleUpdateProfile = () => {
    navigation.navigate('UpdateProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleLanguageChange = (lang: Language) => setLanguage(lang);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'FinanceScreen') navigation.replace('FinanceScreen');
    if (tab === 'Setting') return;
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Please login to view settings</Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => loadUserProfile(true)} style={styles.refreshBtn}>
            <Icon name="refresh" size={24} color="#1e90ff" />
          </TouchableOpacity>
          <Icon name="settings" size={36} color="#1e90ff" />
        </View>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Image 
          source={getAvatarSource()}
          style={styles.avatar} 
        />
        <Text style={styles.name}>
          {userProfile?.user_full_name || 'Unknown User'}
        </Text>
        <View style={styles.infoBlock}>
          {userProfile?.user_dob && (
            <Text style={styles.infoText}>
              {t('dateOfBirth')}: {new Date(userProfile.user_dob).toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.infoText}>
            {t('email')}: {userProfile?.user_email || 'No email'}
          </Text>
          {userProfile?.user_phone_number && (
            <Text style={styles.infoText}>
              {t('phone')}: {userProfile.user_phone_number}
            </Text>
          )}
          {userProfile?.user_gender !== null && userProfile?.user_gender !== undefined && (
            <Text style={styles.infoText}>
              {t('gender')}: {userProfile.user_gender ? t('male') : t('female')}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile}>
          <Text style={styles.updateBtnText}>{t('updateProfile')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePasswordBtn} onPress={handleChangePassword}>
          <Text style={styles.changePasswordBtnText}>{t('changePasswordBtn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('Logout')}</Text>
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


      </ScrollView>
             <LogoutModal
         visible={logoutModalVisible}
         userName={userProfile?.user_full_name?.split(' ')[0] || t('you')}
         onConfirm={async () => {
           setLogoutModalVisible(false);
           try {
             await logout();
           } catch (error) {
             console.error('Logout error:', error);
           }
         }}
         onCancel={() => setLogoutModalVisible(false)}
       />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  logo: { width: 100, height: 60, marginRight: 8, resizeMode: 'contain' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1e90ff', flex: 1, fontFamily: 'Roboto' },
  profileSection: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  name: { fontSize: 26, fontWeight: '600', color: '#333', marginBottom: 12, fontFamily: 'Roboto' },
  infoBlock: { marginBottom: 12 },
  infoText: { fontSize: 15, color: '#444', marginBottom: 2, fontFamily: 'Roboto' },
  updateBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10, minWidth: 200, alignItems: 'center' },
  updateBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'Roboto' },
  changePasswordBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10, minWidth: 200, alignItems: 'center' },
  changePasswordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'Roboto' },
  card: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, marginTop: 18, padding: 18, elevation: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 6, fontFamily: 'Roboto' },
  cardDesc: { color: '#888', marginBottom: 12, fontFamily: 'Roboto' },
  langRow: { flexDirection: 'row', justifyContent: 'space-between' },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, flex: 1, marginRight: 8 },
  langBtnActive: { backgroundColor: '#e6f0ff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#b0b0b0', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#1e90ff', backgroundColor: '#1e90ff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  flag: { fontSize: 20, marginRight: 4 },
  langText: { fontSize: 16, color: '#222', fontFamily: 'Roboto' },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 64, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', position: 'absolute', left: 0, right: 0, bottom: 0 },
  navItem: { alignItems: 'center', flex: 1 },
  navItemCenter: { alignItems: 'center', flex: 1 },
  plusBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#444', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navText: { fontSize: 12, color: '#b0b0b0', marginTop: 2, fontFamily: 'Roboto' },
  navTextActive: { color: '#1e90ff', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, fontWeight: 'bold', color: '#1e90ff', marginTop: 20, fontFamily: 'Roboto' },
  errorText: { fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 20, fontFamily: 'Roboto' },
  loginBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, fontFamily: 'Roboto' },
  logoutBtn: { backgroundColor: '#f44336', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 10, minWidth: 200, alignItems: 'center' },
  logoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'Roboto' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { padding: 8 },
});

export default SettingScreen; 