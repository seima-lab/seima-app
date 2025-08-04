import { typography } from '@/constants/typography';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';
import { GroupDetailResponse, groupService } from '../services/groupService';
import GroupOverviewScreen from './GroupOverviewScreen';

type GroupDetailRouteProp = RouteProp<RootStackParamList, 'GroupDetail'>;
interface Props {
  groupId: string;
  groupName: string;
}

const GroupDetailTabScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupDetailRouteProp>();
  const { t } = useTranslation();
  const [groupDetail, setGroupDetail] = useState<GroupDetailResponse | null>(null);

  // Add null checks for route.params
  const groupId = route.params?.groupId || '';
  const groupName = route.params?.groupName || '';

  // Early return if required params are missing
  if (!groupId || !groupName) {
    console.error('🔴 [GroupDetailTabScreen] Missing required params:', { groupId, groupName });
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('common.error')}</Text>
          <View style={styles.settingsButton} />
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>{t('group.errorLoadingGroups')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fetchGroupDetail = async () => {
    try {
      console.log('🟡 [GroupDetailTabScreen] Fetching group detail for groupId:', groupId);
      const response = await groupService.getGroupDetail(Number(groupId));
      console.log('🟢 [GroupDetailTabScreen] Group detail loaded:', response);
      console.log('📊 [GroupDetailTabScreen] Avatar URL:', response?.group_avatar_url);
      console.log('📊 [GroupDetailTabScreen] Created date:', response?.group_created_date);
      setGroupDetail(response);
      return response;
    } catch (e) {
      console.error('🔴 [GroupDetailTabScreen] Failed to load group detail:', e);
      return null;
    }
  };

  // Load group detail when component mounts
  useEffect(() => {
    fetchGroupDetail();
  }, [groupId]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const getHeaderTitle = () => {
    return t('group.tabs.overview');
  };

  const renderScreen = () => {
    return <GroupOverviewScreen groupId={groupId} groupName={groupName} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('GroupSettings', { 
          groupId, 
          groupName,
          group_avatar_url: groupDetail?.group_avatar_url,
          group_created_date: groupDetail?.group_created_date
        })}>
          <Icon name="settings" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.semibold,
    fontSize: 20,

    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#FF0000',
    fontSize: 16,
  },
});

export default GroupDetailTabScreen; 