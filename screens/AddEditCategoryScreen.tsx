import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { ApiService } from '../services/apiService';
import { categoryService, CategoryType } from '../services/categoryService';
import { secureApiService } from '../services/secureApiService';
import { getIconColor, getIconsForCategoryType } from '../utils/iconUtils';

export default function AddEditCategoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditCategoryScreen'>>();
  const { mode, type, category } = route.params;
  const { user } = useAuth();
  
  // Add ref for FlatList
  const iconFlatListRef = useRef<FlatList>(null);
  
  // Get available icons from centralized utility
  const getAvailableIcons = () => {
    return getIconsForCategoryType(type);
  };
  
  // Safe icon selection with fallback
  const getInitialIcon = () => {
    console.log('🔍 GetInitialIcon debug:', {
      categoryIcon: category?.icon,
      mode: mode,
      type: type
    });
    
    if (category?.icon) {
      const availableIcons = getIconsForCategoryType(type);
      console.log('📊 Available icons count:', availableIcons.length);
      console.log('📊 Looking for icon:', category.icon);
      console.log('📊 First 10 available icons:', availableIcons.slice(0, 10).map(i => i.name));
      
      const foundIcon = availableIcons.find((icon: { name: string; color: string }) => icon.name === category.icon);
      if (foundIcon) {
        console.log('✅ Found matching icon:', category.icon);
        return category.icon;
      } else {
        console.log('❌ Icon not found in available icons:', category.icon);
        console.log('🔍 All available icon names:', availableIcons.map(i => i.name));
        // Instead of using first icon, try to find a similar one
        const fallbackIcon = availableIcons[0]?.name || 'help-circle';
        console.log('⚠️ Using fallback icon:', fallbackIcon);
        return fallbackIcon;
      }
    }
    const availableIcons = getIconsForCategoryType(type);
    const defaultIcon = availableIcons[0]?.name || 'help-circle';
    console.log('ℹ️ No category icon, using default:', defaultIcon);
    return defaultIcon;
  };
  
  const [categoryName, setCategoryName] = useState(category?.label || '');
  const [selectedIcon, setSelectedIcon] = useState(getInitialIcon());
  const [selectedColor, setSelectedColor] = useState(
    category?.color || 
    getIconColor(
      getInitialIcon(), 
      type
    )
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isFlatListReady, setIsFlatListReady] = useState(false);
  
  const title = mode === 'add' ? t('createNew') : t('editCategory');
  
  // Auto-scroll to selected icon when in edit mode and FlatList is ready
  useEffect(() => {
    let timerId: number | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    console.log('🔍 [Auto-scroll Debug]', {
      mode,
      categoryIcon: category?.icon,
      isFlatListReady,
      hasRef: !!iconFlatListRef.current
    });

    const attemptScroll = () => {
      if (mode === 'edit' && category?.icon && iconFlatListRef.current && isFlatListReady) {
        const availableIcons = getIconsForCategoryType(type);
        const selectedIndex = availableIcons.findIndex(icon => icon.name === category.icon);
        
        console.log('📍 [Auto-scroll] Found icon:', {
          searchingFor: category.icon,
          foundAtIndex: selectedIndex,
          totalIcons: availableIcons.length,
          retryCount
        });
        
        if (selectedIndex !== -1) {
          const rowHeight = 90; // Icon height + margins
          const totalRows = Math.ceil(availableIcons.length / 4);
          const targetRow = Math.floor(selectedIndex / 4);
          
          console.log(`🎯 [Auto-scroll] Target: row ${targetRow + 1}/${totalRows}, index ${selectedIndex}`);
          
          // For icons in the last 6 rows, use different approach
          if (targetRow >= totalRows - 6) {
            console.log(`📍 Handling bottom section (row ${targetRow + 1}/${totalRows})`);
            
            try {
              // For bottom section, try to scroll to a visible item near the end first
              const safeScrollIndex = Math.max(0, selectedIndex - 8); // Scroll to 8 items before target
              
              console.log(`🎯 Step 1: Scrolling to safe index ${safeScrollIndex} first`);
              iconFlatListRef.current.scrollToIndex({
                index: safeScrollIndex,
                animated: false, // Non-animated first step
                viewPosition: 0,
              });
              
              // Then scroll to actual target with delay
              setTimeout(() => {
                if (iconFlatListRef.current) {
                  console.log(`🎯 Step 2: Scrolling to target index ${selectedIndex}`);
                  iconFlatListRef.current.scrollToIndex({
                    index: selectedIndex,
                    animated: true,
                    viewPosition: 0.7, // Show item near bottom of view
                    viewOffset: -50, // Add some offset
                  });
                }
              }, 100);
              
              // Final backup: scrollToEnd
              setTimeout(() => {
                if (iconFlatListRef.current) {
                  console.log(`🔄 Final backup: scrollToEnd`);
                  iconFlatListRef.current.scrollToEnd({ animated: true });
                }
              }, 500);
              
            } catch (error) {
              console.log('❌ Bottom section scroll failed:', error);
              // Last resort: manual offset calculation
              const containerHeight = 500;
              const totalContentHeight = totalRows * rowHeight;
              const maxScrollOffset = Math.max(0, totalContentHeight - containerHeight + 100);
              
              iconFlatListRef.current.scrollToOffset({
                offset: maxScrollOffset,
                animated: true,
              });
            }
            return;
          }
          
          // Calculate precise offset
          const offset = targetRow * rowHeight - 100; // Show some context above
          
          console.log(`✅ [Safe Scroll] Attempting scroll to offset: ${offset} for index: ${selectedIndex}`);
          
          // Multiple fallback approaches for normal sections
          try {
            // First attempt: scrollToIndex with better positioning
            console.log(`🎯 Normal section: scrollToIndex ${selectedIndex} with viewPosition 0.3`);
            iconFlatListRef.current.scrollToIndex({
              index: selectedIndex,
              animated: true,
              viewPosition: 0.3, // Show item closer to top
              viewOffset: 0,
            });
            console.log('✅ scrollToIndex succeeded');
          } catch (error) {
            console.log('❌ scrollToIndex failed, trying scrollToOffset');
            
            // Fallback 1: scrollToOffset
            try {
              iconFlatListRef.current.scrollToOffset({
                offset: Math.max(0, offset),
                animated: true,
              });
              console.log('✅ scrollToOffset succeeded');
            } catch (error2) {
              console.log('❌ scrollToOffset failed, trying scrollToItem');
              
              // Fallback 2: scrollToItem
              try {
                const item = availableIcons[selectedIndex];
                if (item) {
                  iconFlatListRef.current.scrollToItem({
                    item: item,
                    animated: true,
                    viewPosition: 0.3,
                  });
                  console.log('✅ scrollToItem succeeded');
                }
              } catch (error3) {
                console.log('❌ All scroll methods failed');
                
                // Final fallback: retry with delay
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`🔄 Retrying scroll (attempt ${retryCount}/${maxRetries})`);
                  timerId = setTimeout(attemptScroll, 1000);
                }
              }
            }
          }
        } else {
          console.log('❌ [Auto-scroll] Icon not found in available icons');
        }
      }
    };

    // Initial delay to ensure FlatList is ready
    timerId = setTimeout(attemptScroll, 500); // Increased delay for better reliability

    // Cleanup function
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [mode, category?.icon, type, isFlatListReady]);
  
  const handleSave = async () => {
    console.log('💾 === SAVE CATEGORY START ===');
    console.log('📊 Current Form State:');
    console.log('  - categoryName:', `"${categoryName}"`, '(trimmed:', `"${categoryName.trim()}"`, ')');
    console.log('  - selectedIcon:', selectedIcon);
    console.log('  - selectedColor:', selectedColor);
    console.log('  - type (tab):', type);
    console.log('  - mode:', mode);
    
    if (!categoryName.trim()) {
      console.log('❌ Validation failed: Category name is empty');
      Alert.alert(t('common.error'), t('pleaseEnterCategoryName'));
      return;
    }

    if (!user) {
      console.log('❌ Validation failed: User not authenticated');
      Alert.alert(t('common.error'), 'User not authenticated');
      return;
    }

    console.log('👤 User Info:');
    console.log('  - user.id:', user.id, '(type:', typeof user.id, ')');
    console.log('  - parsed user_id:', parseInt(user.id), '(type:', typeof parseInt(user.id), ')');

    setIsSaving(true);
    
    try {
      // Get user profile to get real userId
      const userProfile = await secureApiService.getCurrentUserProfile();
      const userId = userProfile.user_id;
      
      if (mode === 'add') {
        // Create new category using API - Format exactly as shown by user
        const createRequest = {
          category_name: categoryName.trim(),
          category_type: type === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME,
          category_icon_url: selectedIcon || "",
          is_system_defined: 0,
          user_id: userId
        };

        console.log('🔄 Creating category with ApiService');
        
        const apiService = ApiService.getInstance();
        const result = await apiService.post('/api/v1/categories', createRequest);
        
        console.log('✅ Category created successfully:');
        console.log('📥 API Response:', JSON.stringify(result, null, 2));
        
        Alert.alert(
          t('common.success'), 
          'Category created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
        
      } else {
        // Edit existing category using API PUT
        if (!category?.key) {
          throw new Error('Category ID not found for editing');
        }
        
        const categoryId = parseInt(category.key);
        console.log('🔧 === UPDATE CATEGORY DEBUG ===');
        console.log('📊 Original category data:', {
          key: category.key,
          label: category.label,
          icon: category.icon,
          color: category.color,
          category_id: (category as any).category_id,
          is_system_defined: (category as any).is_system_defined
        });
        console.log('🔧 Category ID to update:', categoryId);
        console.log('👤 User ID:', userId);
        console.log('📝 Form data:', {
          categoryName: categoryName.trim(),
          selectedIcon,
          selectedColor,
          type
        });
        
        // Use CreateCategoryRequest format as per backend API specification
        const updateRequest = {
          category_name: categoryName.trim(),
          category_type: type === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME,
          category_icon_url: selectedIcon || "",
          is_system_defined: false,
          user_id: userId,
          group_id: 0 // Same as create - groupId = 0 for user-specific categories
        };
        
        console.log('🔄 === SENDING UPDATE REQUEST ===');
        console.log('📤 Request payload:', JSON.stringify(updateRequest, null, 2));
        console.log('🌐 API endpoint will be: /api/v1/categories/' + categoryId);
        console.log('🔧 Request method: PUT');
        
        const updateResult = await categoryService.updateCategory(categoryId, updateRequest);
        
        console.log('✅ === UPDATE RESPONSE ===');
        console.log('📥 Update result:', JSON.stringify(updateResult, null, 2));
        
        Alert.alert(
          t('common.success'),
          'Category updated successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('❌ === SAVE CATEGORY ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      
      let errorMessage = 'Failed to save category';
      if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Final error message to user:', errorMessage);
      
      Alert.alert(
        t('common.error'),
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      console.log('🏁 === SAVE CATEGORY END ===');
      console.log('Setting isSaving to false');
      setIsSaving(false);
    }
  };

  const renderIconItem = ({ item }: { item: { name: string; color: string } }) => {
    const isSelected = selectedIcon === item.name;
    // Always use the original icon color, never change it when selected
    const iconColor = getIconColor(item.name, type);
    
    return (
      <TouchableOpacity
        style={[
          styles.iconItem,
          isSelected && styles.iconItemSelected
        ]}
        onPress={() => {
          setSelectedIcon(item.name);
          // Chỉ cập nhật màu khi ở mode 'add', không đổi màu khi edit
          if (mode === 'add') {
            setSelectedColor(getIconColor(item.name, type));
          }
        }}
      >
        <Icon 
          name={item.name} 
          size={28} 
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

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
            <Icon name="arrow-left" size={24} color="#007aff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View 
          style={styles.content} 
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
            <View style={styles.iconContainer}>
              <FlatList
                data={getIconsForCategoryType(type)}
                renderItem={renderIconItem}
                keyExtractor={item => item.name}
                numColumns={4}
                scrollEnabled={true}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={[
                  styles.iconGrid,
                  { minHeight: '100%' } // Ensure content can fill container
                ]}
                removeClippedSubviews={false} // Important for scrollToIndex to work
                initialNumToRender={20} // Render more items initially
                maxToRenderPerBatch={20}
                windowSize={10}
                ref={iconFlatListRef}
                getItemLayout={(data, index) => {
                  // More precise calculation based on actual styles
                  const itemSize = 80; // aspectRatio: 1, with flex: 1
                  const itemMargin = 4; // margin: 4 around each item  
                  const itemTotalSize = itemSize + (itemMargin * 2); // Total space per item including margins
                  const row = Math.floor(index / 4);
                  const col = index % 4;
                  
                  // For FlatList with numColumns, we need to calculate based on rows
                  const rowHeight = itemTotalSize;
                  
                  return {
                    length: rowHeight,
                    offset: rowHeight * row,
                    index,
                  };
                }}
                onLayout={(event) => {
                  const { height, width } = event.nativeEvent.layout;
                  console.log('📐 FlatList onLayout:', { height, width });
                  console.log('📐 Setting FlatList ready to true');
                  
                  // Debug: Check if FlatList can actually scroll
                  setTimeout(() => {
                    if (iconFlatListRef.current) {
                      const availableIcons = getIconsForCategoryType(type);
                      const totalRows = Math.ceil(availableIcons.length / 4);
                      const totalContentHeight = totalRows * 88; // Approximate row height
                      console.log(`📊 FlatList scroll capability:`, {
                        containerHeight: height,
                        totalContentHeight,
                        canScroll: totalContentHeight > height,
                        totalIcons: availableIcons.length,
                        totalRows
                      });
                    }
                  }, 100);
                  
                  setIsFlatListReady(true);
                }}
                onScrollToIndexFailed={(info) => {
                  console.log('❌ ScrollToIndex failed in FlatList callback:', info);
                  
                  // Enhanced fallback logic
                  setTimeout(() => {
                    if (!iconFlatListRef.current) {
                      console.log('❌ FlatList ref not available for fallback');
                      return;
                    }
                    
                    const availableIcons = getIconsForCategoryType(type);
                    const rowHeight = 90;
                    const totalRows = Math.ceil(availableIcons.length / 4);
                    const targetRow = Math.floor(info.index / 4);
                    
                    console.log(`🔄 Fallback for index ${info.index}: row ${targetRow + 1}/${totalRows}`);
                    
                    // For bottom rows, use enhanced bottom logic
                    if (targetRow >= totalRows - 6) {
                      console.log('📍 Fallback: handling bottom section');
                      
                      const containerHeight = 500;
                      const totalContentHeight = totalRows * rowHeight;
                      const maxScrollOffset = Math.max(0, totalContentHeight - containerHeight + 50);
                      const targetOffset = Math.min(maxScrollOffset, targetRow * rowHeight - 100);
                      
                      console.log(`📍 Fallback: scrollToOffset ${targetOffset}`);
                      iconFlatListRef.current.scrollToOffset({
                        offset: targetOffset,
                        animated: true,
                      });
                      
                      // Backup scrollToEnd
                      setTimeout(() => {
                        if (iconFlatListRef.current) {
                          iconFlatListRef.current.scrollToEnd({ animated: true });
                        }
                      }, 200);
                    } else {
                      // Calculate offset with some padding
                      const offset = Math.max(0, targetRow * rowHeight - 50);
                      console.log(`📍 Fallback: scrollToOffset ${offset}`);
                      iconFlatListRef.current.scrollToOffset({
                        offset: offset,
                        animated: true,
                      });
                    }
                  }, 50);
                }}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
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
    padding: 4,
    paddingBottom: 50,
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
    backgroundColor: '#007aff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  iconContainer: {
    height: 500, // Much larger height to accommodate 27 rows of icons
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden', // Ensure proper clipping
  },
}); 