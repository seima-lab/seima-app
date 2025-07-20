import { typography } from '@/constants/typography';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
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

  const { groupId, groupName } = route.params;

  const fetchGroupDetail = async () => {
    try {
      const response = await groupService.getGroupDetail(Number(groupId));
      setGroupDetail(response);
      return response;
    } catch (e) {
      return null;
    }
  };

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
        <TouchableOpacity style={styles.settingsButton} onPress={() => navigation.navigate('GroupSettings', { groupId, groupName })}>
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
});

export default GroupDetailTabScreen; 