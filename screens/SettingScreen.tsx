import { typography } from '@/constants/typography';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react'; // Added missing import for React
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  
  // Cache state để tránh gọi API không cần thiết
  const [profileCache, setProfileCache] = useState<UserProfile | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 giây
  
  // Prevent multiple concurrent API calls
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Load user profile với cache
  const loadUserProfile = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    // Prevent multiple concurrent calls
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Skipping profile load - already loading');
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && profileCache) {
      console.log('📦 Using cached profile data, last fetch:', new Date(lastFetchTime));
      setUserProfile(profileCache);
      setLoading(false);
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
        setProfileCache(profile);
        setLastFetchTime(now);
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
  }, [isAuthenticated, lastFetchTime, profileCache, t]);

  // Load user profile from API khi mount
  useEffect(() => {
    loadUserProfile();
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated]);

  // Auto reload data when screen comes into focus với debounce
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        const now = Date.now();
        if (now - lastFetchTime > CACHE_DURATION) {
          console.log('🔄 SettingScreen focused, refreshing profile...');
          loadUserProfile();
        } else {
          console.log('🔄 SettingScreen focused, using cached data');
        }
      }
    }, [isAuthenticated, lastFetchTime, loadUserProfile])
  );

  // Helper function to get avatar source based on gender
  const getAvatarSource = useCallback(() => {
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
  }, [userProfile]);

  // Memoized callback functions for better performance
  const handleUpdateProfile = useCallback(() => {
    navigation.navigate('UpdateProfile');
  }, [navigation]);

  const handleChangePassword = useCallback(() => {
    navigation.navigate('ChangePassword');
  }, [navigation]);

  const handleLogout = useCallback(() => {
    setLogoutModalVisible(true);
  }, []);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
  }, [setLanguage]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab === 'FinanceScreen') navigation.replace('FinanceScreen');
    if (tab === 'Setting') return;
  }, [navigation]);

  // Progressive loading - không block UI hoàn toàn
  const showFullLoading = loading && !userProfile;

  // Skeleton Loading Component
  const SkeletonLoader = React.memo(() => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonLogo} />
        <View style={styles.skeletonIcon} />
      </View>
      <View style={styles.skeletonProfileSection}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonName} />
        <View style={styles.skeletonInfoBlock}>
          <View style={styles.skeletonInfoText} />
          <View style={styles.skeletonInfoText} />
          <View style={styles.skeletonInfoText} />
        </View>
        <View style={styles.skeletonButton} />
        <View style={styles.skeletonButton} />
        <View style={styles.skeletonLogoutButton} />
      </View>
      <View style={styles.skeletonCard}>
        <View style={styles.skeletonCardTitle} />
        <View style={styles.skeletonCardDesc} />
        <View style={styles.skeletonLangRow}>
          <View style={styles.skeletonLangBtn} />
          <View style={styles.skeletonLangBtn} />
        </View>
      </View>
    </View>
  ));

  SkeletonLoader.displayName = 'SkeletonLoader';

  // Show full loading only when no user profile
  if (showFullLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <SkeletonLoader />
      </View>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Please login to view settings</Text>
          <TouchableOpacity 
            style={styles.loginBtn}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        removeClippedSubviews={true}
      >
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../assets/images/group.png')} style={styles.logo} />
        <View style={styles.headerRight}>
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
            onPress={() => handleLanguageChange('en')}
          >
            <View style={[styles.radio, language === 'en' && styles.radioActive]}>
              {language === 'en' && <View style={styles.radioDot} />}
            </View>
            <Text style={styles.flag}>🇺🇸</Text>
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'vi' && styles.langBtnActive]}
            onPress={() => handleLanguageChange('vi')}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  logo: { width: 100, height: 60, marginRight: 8, resizeMode: 'contain' },
  headerTitle: { fontSize: 28, ...typography.semibold, color: '#1e90ff', flex: 1 },
  profileSection: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70, marginBottom: 16 },
    name: { fontSize: 30, ...typography.semibold, color: '#333', marginBottom: 16, ...typography.regular },
  infoBlock: { marginBottom: 16, alignItems: 'center' },
  infoText: { fontSize: 18, color: '#444', marginBottom: 4, ...typography.regular },
  updateBtn: { backgroundColor: '#1e90ff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 12, minWidth: 180, alignItems: 'center' },
  updateBtnText: { color: '#fff', ...typography.semibold, fontSize: 15},
  changePasswordBtn: { backgroundColor: '#1e90ff', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 12, minWidth: 180, alignItems: 'center' },
  changePasswordBtnText: { color: '#fff', ...typography.semibold, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 18, marginHorizontal: 16, marginTop: 18, padding: 18, elevation: 1 },
  cardTitle: { fontSize: 20, ...typography.semibold, color: '#222', marginBottom: 6},
  cardDesc: { color: '#888', marginBottom: 12, ...typography.regular },
  langRow: { flexDirection: 'row', justifyContent: 'space-between' },
  langBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, flex: 1, marginRight: 8 },
  langBtnActive: { backgroundColor: '#e6f0ff' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#b0b0b0', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#1e90ff', backgroundColor: '#1e90ff' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  flag: { fontSize: 20, marginRight: 4 },
  langText: { fontSize: 16, color: '#222', ...typography.regular },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 64, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', position: 'absolute', left: 0, right: 0, bottom: 0 },
  navItem: { alignItems: 'center', flex: 1 },
  navItemCenter: { alignItems: 'center', flex: 1 },
  plusBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#444', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navText: { fontSize: 12, color: '#b0b0b0', marginTop: 2, ...typography.regular },
  navTextActive: { color: '#1e90ff', ...typography.semibold },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, ...typography.semibold, color: '#1e90ff', marginTop: 20 },
  errorText: { fontSize: 18, ...typography.semibold, color: 'red', marginBottom: 20 },
  loginBtn: { backgroundColor: '#1e90ff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  loginBtnText: { color: '#fff', ...typography.semibold, fontSize: 18 },
  logoutBtn: { backgroundColor: '#f44336', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28, marginTop: 12, minWidth: 180, alignItems: 'center' },
  logoutBtnText: { color: '#fff', ...typography.semibold, fontSize: 15 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { padding: 8 },
  
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  skeletonLogo: {
    width: 100,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
  },
  skeletonProfileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  skeletonAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  skeletonName: {
    width: 200,
    height: 30,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonInfoBlock: {
    marginBottom: 16,
    alignItems: 'center',
  },
  skeletonInfoText: {
    width: 250,
    height: 18,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonButton: {
    width: 180,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginTop: 12,
  },
  skeletonLogoutButton: {
    width: 180,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginTop: 12,
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 18,
    padding: 18,
  },
  skeletonCardTitle: {
    width: 150,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonCardDesc: {
    width: 200,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonLangRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonLangBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
  },
});

export default SettingScreen; 