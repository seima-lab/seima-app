import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../constants/typography';
import CustomConfirmModal from './CustomConfirmModal';

interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  icon: string;
  iconColor: string;
  description?: string;
}

interface SwipeableTransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

// Format money helper function
const formatMoney = (amount: number | undefined | null, maxLength?: number): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0đ';
  }
  const formatted = amount.toLocaleString('vi-VN');
  if (maxLength && formatted.replace(/\D/g, '').length > maxLength) {
    let count = 0;
    let result = '';
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      result += formatted[i];
      if (count === maxLength) break;
    }
    return result + '...' + 'đ';
  }
  return formatted + 'đ';
};

const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = React.memo(({ 
  transaction, 
  onDelete,
  onEdit
}) => {
  const { t } = useTranslation();
  const translateX = new Animated.Value(0);
  const rightActionOpacity = new Animated.Value(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dx < 0) { // Only allow left swipe
        const newTranslateX = Math.max(gestureState.dx, -100);
        translateX.setValue(newTranslateX);
        rightActionOpacity.setValue(Math.abs(newTranslateX) / 100);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx < -50) {
        // Show delete button
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rightActionOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]).start();
      } else {
        // Reset position
        resetPosition();
      }
    },
  });

  const resetPosition = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rightActionOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleDelete = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmModal(false);
    resetPosition();
    onDelete(transaction.id);
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    resetPosition();
  };

  return (
    <>
      <View style={styles.swipeableContainer}>
        {/* Transaction Item */}
        <Animated.View
          style={[
            styles.transactionItemSwipeable,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity 
            style={styles.transactionItem}
            onPress={() => onEdit(transaction)}
          >
            <View style={styles.transactionLeft}>
              <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + '20' }]}>
                <Icon name={transaction.icon} size={20} color={transaction.iconColor} />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
                {transaction.description && (
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                )}
              </View>
            </View>
            <Text style={[
              styles.transactionAmount,
              transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
            ]}>
              {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
            </Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Delete Action - appears behind when swiped */}
        <Animated.View 
          style={[
            styles.deleteAction,
            { opacity: rightActionOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color="#FFFFFF" />
            <Text style={styles.deleteText}>{t('delete')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Custom Confirm Modal */}
      <CustomConfirmModal
        visible={showConfirmModal}
        title={t('common.confirm')}
        message={t('calendar.confirmDeleteTransaction')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="danger"
        iconName="delete"
      />
    </>
  );
});

SwipeableTransactionItem.displayName = 'SwipeableTransactionItem';

const styles = StyleSheet.create({
  swipeableContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    width: '100%',
    height: '100%',
  },
  deleteText: {
    fontSize: 12,
    ...typography.semibold,
    color: '#FFFFFF',
    marginTop: 4,
  },
  transactionItemSwipeable: {
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    width: '100%',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    ...typography.medium,
    color: '#333',
  },
  transactionDescription: {
    fontSize: 12,
    ...typography.regular,
    color: '#666',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    ...typography.semibold,
    marginRight: 8,
  },
  incomeAmount: {
    color: '#34C759',
  },
  expenseAmount: {
    color: 'red',
  },
});

export default SwipeableTransactionItem;
