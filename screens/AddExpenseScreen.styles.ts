import { typography } from '@/constants/typography';
import { StyleSheet } from 'react-native';

export const addExpenseStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    ...typography.regular,
    fontSize: 16,
  },
  subLoadingText: {
    marginTop: 5,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    ...typography.regular,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 80, // Thêm padding bottom để tránh bị che bởi nút Save
    width: '100%', // Đảm bảo width đúng
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#007aff',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  editHeaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  editHeaderTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16,
  },
  label: { 
    width: 80,
    fontSize: 16, 
    color: '#333', 
    ...typography.regular, 
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative', // Thêm position relative
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1, // Cho phép text chiếm hết không gian có sẵn
    marginRight: 24, // Để lại khoảng trống cho icon dropdown
  },
  dateText: {
    fontSize: 16,
    color: '#007aff',
    ...typography.regular,
  },
  amountContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    minHeight: 44, // Đảm bảo chiều cao tối thiểu
  },
  currency: {
    marginLeft: 8, 
    color: '#666',
    fontSize: 16,
  },
  noteContainer: {
    flex: 1,
  },
  noteInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    ...typography.regular,
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 8, // Thêm padding horizontal cân bằng với categories
    width: '100%', // Đảm bảo title chiếm toàn bộ chiều rộng
  },
  categoriesContainer: { 
    paddingBottom: 20,
    paddingHorizontal: 8, // Thêm padding horizontal cân bằng hai bên
    width: '100%', // Đảm bảo container chiếm toàn bộ chiều rộng
  },
  categoryItem: {
    width: '25%', // Đảm bảo mỗi item chiếm đúng 1/4 chiều rộng
    aspectRatio: 1, // Đảm bảo item có hình vuông
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4, // Giảm padding hơn nữa
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  categoryItemSelected: {
    borderColor: '#007aff',
    backgroundColor: '#e6f2ff',
  },
  categoryText: { 
    fontSize: 9, // Giảm font size hơn nữa
    color: '#333', 
    marginTop: 2, // Giảm margin top
    textAlign: 'center',
    lineHeight: 11, // Giảm line height
    flexWrap: 'wrap',
    paddingHorizontal: 2, // Thêm padding horizontal cho text
  },
  saveButton: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0, // Bỏ margin top vì đã có padding trong container
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff', 
    fontSize: 16,
    ...typography.semibold,
  },
  // Date Modal styles - matching SetBudgetLimitScreen.tsx
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  dateModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    overflow: 'hidden',
    elevation: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 1001,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateModalTitle: {
    fontSize: 18,
    color: '#333',
    ...typography.semibold,
  },
  dateModalConfirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateModalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    ...typography.semibold,
  },
  walletModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
    elevation: 999,
  },
  walletPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 1000,
    zIndex: 1000,
  },
  walletPickerTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  walletPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  walletPickerItemSelected: {
    backgroundColor: '#e6f2ff',
  },
  walletPickerItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  walletPickerItemTextSelected: {
    color: '#1e90ff',
    ...typography.semibold,
  },
  walletPickerDefault: {
    fontSize: 12,
    color: '#1e90ff',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    ...typography.regular,
  },
  // Camera button styles
  cameraButton: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  // Image styles
  imageContainer: {
    position: 'relative',
    flex: 1,
  },
  receiptImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Image options modal styles
  imageOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 998,
    elevation: 998,
  },
  imageOptionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 999,
    zIndex: 999,
  },
  imageOptionsTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageOptionCancel: {
    borderBottomWidth: 0,
  },
  imageOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  imageOptionCancelText: {
    color: '#666',
  },
  // Create Wallet Modal styles
  createWalletModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 997,
    elevation: 997,
  },
  createWalletContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 998,
    zIndex: 998,
    padding: 20,
  },
  createWalletTitle: {
    fontSize: 18,
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  createWalletMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  createWalletButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  createWalletButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createWalletButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  createWalletButtonConfirm: {
    backgroundColor: '#007aff',
  },
  createWalletButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    ...typography.regular,
  },
  createWalletButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    ...typography.regular,
  },
  // Group context styles
  groupContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  groupContextText: {
    fontSize: 14,
    color: '#4A90E2',
    ...typography.regular,
    marginLeft: 6,
  },
  // Thêm style mới cho container cố định nút Save
  fixedSaveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  
  // Skeleton Styles
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonBackButton: {
    width: 24,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  skeletonTabContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 16,
    height: 36,
  },
  skeletonTab: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    margin: 2,
  },
  skeletonCameraButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginLeft: 12,
  },
  skeletonFormContainer: {
    marginBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonLabel: {
    width: 80,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  skeletonInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonAmountInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonNoteInput: {
    flex: 1,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginLeft: 12,
  },
  skeletonCategoriesContainer: {
    marginTop: 20,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonCategoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
});
