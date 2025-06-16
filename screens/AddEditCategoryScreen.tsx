import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import IconBack from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';

const AVAILABLE_ICONS = [
  'cart', 'car', 'airplane', 'hamburger',
  'cake', 'diamond', 'minus-circle', 'bread-slice',
  'purse', 'cog', 'video', 'coffee',
  'star', 'tshirt-crew', 'ruler', 'glass-wine',
  'heart', 'house', 'phone', 'baby-carriage',
  'bank', 'pills', 'food-apple', 'silverware-fork-knife',
  'gift', 'book', 'bus', 'gamepad-variant',
];

export default function AddEditCategoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditCategoryScreen'>>();
  const { mode, type, category } = route.params;
  
  const [categoryName, setCategoryName] = useState(category?.label || '');
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || AVAILABLE_ICONS[0]);
  
  const title = mode === 'add' ? t('createNew') : t('editCategory');
  
  const handleSave = () => {
    if (!categoryName.trim()) {
      alert(t('pleaseEnterCategoryName'));
      return;
    }
    
    // TODO: Implement save logic
    console.log('Save category:', {
      name: categoryName,
      icon: selectedIcon,
      type,
      mode
    });
    
    navigation.goBack();
  };

  const renderIconItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.iconItem,
        selectedIcon === item && styles.iconItemSelected
      ]}
      onPress={() => setSelectedIcon(item)}
    >
      <Icon name={item} size={28} color={selectedIcon === item ? '#1e90ff' : '#666'} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeAreaContent}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#fff" 
          translucent={false}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <IconBack name="arrow-back" size={24} color="#FF6900" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('categoryName')}</Text>
            <TextInput
              style={styles.nameInput}
              placeholder={t('categoryNamePlaceholder')}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholderTextColor="#C7C7CC"
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('icon')}</Text>
            <FlatList
              data={AVAILABLE_ICONS}
              renderItem={renderIconItem}
              keyExtractor={item => item}
              numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.iconGrid}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  safeAreaContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  iconGrid: {
    paddingTop: 8,
  },
  iconItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  iconItemSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },

  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 34,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
}); 