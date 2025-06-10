import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

interface SetBudgetLimitScreenProps {
  route?: {
    params?: {
      mode: 'add' | 'edit';
      category: {
        id: string;
        name: string;
        icon: string;
        color: string;
        backgroundColor: string;
      };
      currentBudget?: number;
    };
  };
}

const SetBudgetLimitScreen = ({ route }: SetBudgetLimitScreenProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const mode = route?.params?.mode || 'add';
  const category = route?.params?.category;
  const currentBudget = route?.params?.currentBudget;

  const [budgetLimit, setBudgetLimit] = useState(currentBudget?.toString() || '');

  const handleSave = () => {
    if (!budgetLimit.trim()) {
      Alert.alert(t('common.error'), t('budget.validation.limitRequired'));
      return;
    }

    const limit = parseInt(budgetLimit.replace(/[^0-9]/g, ''));
    if (limit <= 0) {
      Alert.alert(t('common.error'), t('budget.validation.limitInvalid'));
      return;
    }

    // Handle save logic here
    console.log('Save budget:', { limit, categoryId: category?.id, mode });
    Alert.alert(
      t('common.success'),
      mode === 'add' ? t('budget.addSuccess') : t('budget.updateSuccess'),
      [{ 
        text: 'OK', 
        onPress: () => {
          // Navigate back to BudgetScreen (pop 2 screens if coming from add flow)
          if (mode === 'add') {
            navigation.navigate('BudgetScreen');
          } else {
            navigation.goBack();
          }
        }
      }]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, '');
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Text>Error: No category selected</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {mode === 'add' ? '✨ ' + t('budget.setBudgetLimit') : '🎯 ' + t('budget.updateBudgetLimit')}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* Selected Category Display */}
          <View style={styles.selectedCategorySection}>
            <Text style={styles.sectionTitle}>{t('budget.selectedCategory')}</Text>
            <View style={styles.selectedCategoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.backgroundColor }]}>
                <Icon name={category.icon} size={28} color={category.color} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>
                  {mode === 'add' ? t('budget.newBudgetFor') : t('budget.updateBudgetFor')}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {mode === 'add' ? t('budget.new') : t('budget.edit')}
                </Text>
              </View>
            </View>
          </View>

          {/* Budget Limit Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              💰 {t('budget.monthlyBudgetLimit')}
            </Text>
            <Text style={styles.inputHint}>
              {t('budget.setBudgetHint')}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={budgetLimit}
                onChangeText={(text) => setBudgetLimit(formatCurrency(text))}
                placeholder={t('budget.enterLimit')}
                keyboardType="numeric"
                returnKeyType="done"
                autoFocus={true}
              />
              <Text style={styles.currencySymbol}>đ</Text>
            </View>
            {budgetLimit && (
              <Text style={styles.previewAmount}>
                ≈ {parseInt(budgetLimit.replace(/[^0-9]/g, '') || '0').toLocaleString()}đ / {t('budget.month')}
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Action Buttons */}
      <View style={[styles.actionButtonsContainer, { paddingBottom: insets.bottom + 20 }]}>
        {mode === 'add' ? (
          <TouchableOpacity 
            style={[
              styles.createButton,
              !budgetLimit.trim() && styles.createButtonDisabled
            ]}
            onPress={handleSave}
            disabled={!budgetLimit.trim()}
          >
            <Icon name="add-circle" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.createButtonText}>
              {t('budget.createBudget')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Icon name="close" size={18} color="#666" style={styles.buttonIcon} />
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.updateButton,
                !budgetLimit.trim() && styles.updateButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!budgetLimit.trim()}
            >
              <Icon name="check-circle" size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.updateButtonText}>{t('budget.updateBudget')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1e90ff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedCategorySection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  selectedCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  categoryBadge: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e90ff',
    marginLeft: 8,
  },
  previewAmount: {
    fontSize: 14,
    color: '#1e90ff',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  createButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#1e90ff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#CCC',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default SetBudgetLimitScreen; 