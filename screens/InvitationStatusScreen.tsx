// import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
// import { useCallback, useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';
// import {
//   ActivityIndicator,
//   Alert,

//   FlatList,
//   Image,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { useAuth } from '../contexts/AuthContext';
// import { RootStackParamList } from '../navigation/types';
// import BranchService, { BranchInvitationPayload } from '../services/branchService';
// import { ApiConfig } from '../services/config';

// interface InvitationStatus {
//   id: string;
//   groupId: number;
//   groupName: string;
//   groupAvatar?: string;
//   inviterName: string;
//   inviterAvatar?: string;
//   invitationDate: string;
//   status: 'pending' | 'accepted' | 'rejected' | 'expired';
//   inviteCode: string;
// }

// const InvitationStatusScreen = () => {
//   const navigation = useNavigation<NavigationProp<RootStackParamList>>();
//   const { t } = useTranslation();
//   const { isAuthenticated } = useAuth();
//   const [invitations, setInvitations] = useState<InvitationStatus[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Initial component logging
//   console.log('📱 [InvitationStatusScreen] Component initialized');
//   console.log('🔐 [InvitationStatusScreen] Auth status:', isAuthenticated);

//   // Load invitations when screen comes into focus
//   useFocusEffect(
//     useCallback(() => {
//       console.log('🎯 [InvitationStatusScreen] Screen focused, auth status:', isAuthenticated);
//       if (isAuthenticated) {
//         loadInvitations();
//       } else {
//         console.log('⚠️ [InvitationStatusScreen] User not authenticated, skipping invitation load');
//       }
//     }, [isAuthenticated])
//   );

//   useEffect(() => {
//     // Hàm gọi API backend
//     const fetchStatus = async (inviteToken: string) => {
//       try {
//         const res = await fetch(`${ApiConfig.BASE_URL}/invite/${inviteToken}`);
//         const text = await res.text();
//         if (text.includes('error_invalid_invitation') || text.includes('error_group_inactive')) {
//           Alert.alert('Thông báo', 'Lời mời không còn hiệu lực hoặc nhóm đã bị xóa.');
//         } else {
//           Alert.alert('Thông báo', 'Bạn đã nhận lời mời vào group, vui lòng đợi admin hoặc owner xét duyệt.');
//         }
//       } catch (e) {
//         Alert.alert('Lỗi', 'Không thể kiểm tra trạng thái lời mời.');
//       }
//     };
  
//     // ✅ Handle Branch deep link
//     BranchService.getInstance().handleDeepLink((payload: BranchInvitationPayload) => {
//       console.log('📥 [InvitationStatusScreen] Received Branch payload:', payload);
  
//       if (payload.action === 'RECHECK_PENDING_STATUS' && payload.inviteToken) {
//         console.log('🔁 [InvitationStatusScreen] Calling backend to check inviteToken status...');
//         fetchStatus(payload.inviteToken);
//       } else {
//         console.warn('⚠️ [InvitationStatusScreen] Unsupported action or missing inviteToken:', payload);
//       }
//     });
  
//     return () => {
//       // cleanup nếu cần
//     };
//   }, []);
 

//   const loadInvitations = async () => {
//     console.log('🔄 [InvitationStatusScreen] loadInvitations called, auth status:', isAuthenticated);
    
//     if (!isAuthenticated) {
//       console.log('❌ [InvitationStatusScreen] Cannot load invitations: user not authenticated');
//       setLoading(false);
//       return;
//     }

//     console.log('⏳ [InvitationStatusScreen] Starting to load invitations...');
//     setLoading(true);
//     try {
//       // TODO: Replace with actual API call
//       console.log('🟡 Loading user invitations...');
      
//       // Mock data for demonstration
//       const mockInvitations: InvitationStatus[] = [
//         {
//           id: '1',
//           groupId: 1,
//           groupName: 'Nhóm Chi tiêu Gia đình',
//           groupAvatar: undefined,
//           inviterName: 'Nguyễn Văn A',
//           inviterAvatar: undefined,
//           invitationDate: '2024-01-15T10:30:00',
//           status: 'pending',
//           inviteCode: 'abc123def456'
//         },
//         {
//           id: '2',
//           groupId: 2,
//           groupName: 'Nhóm Du lịch 2024',
//           groupAvatar: undefined,
//           inviterName: 'Trần Thị B',
//           inviterAvatar: undefined,
//           invitationDate: '2024-01-14T15:45:00',
//           status: 'accepted',
//           inviteCode: 'xyz789ghi012'
//         },
//         {
//           id: '3',
//           groupId: 3,
//           groupName: 'Nhóm Công ty',
//           groupAvatar: undefined,
//           inviterName: 'Lê Văn C',
//           inviterAvatar: undefined,
//           invitationDate: '2024-01-13T09:20:00',
//           status: 'rejected',
//           inviteCode: 'mno345pqr678'
//         }
//       ];
      
//       console.log('🟢 User invitations loaded:', mockInvitations);
//       setInvitations(mockInvitations);
//       console.log('✅ [InvitationStatusScreen] Invitations state updated successfully');
//     } catch (error: any) {
//       console.error('🔴 Error loading invitations:', error);
//       console.error('💥 [InvitationStatusScreen] Error details:', {
//         message: error.message,
//         stack: error.stack,
//         name: error.name
//       });
      
//       Alert.alert(
//         t('common.error'),
//         error.message || 'Không thể tải danh sách lời mời',
//         [{ text: t('common.ok') }]
//       );
//       setInvitations([]);
//       console.log('🗑️ [InvitationStatusScreen] Invitations state cleared due to error');
//     } finally {
//       setLoading(false);
//       console.log('🏁 [InvitationStatusScreen] Load invitations completed, loading state reset');
//     }
//   };

//   const formatDate = useCallback((dateString: string) => {
//     console.log('📅 [InvitationStatusScreen] Formatting date:', dateString);
//     try {
//       const date = new Date(dateString);
//       const formatted = date.toLocaleDateString('vi-VN', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//       console.log('📆 [InvitationStatusScreen] Date formatted:', formatted);
//       return formatted;
//     } catch (error) {
//       console.warn('⚠️ [InvitationStatusScreen] Invalid date format:', dateString);
//       return dateString;
//     }
//   }, []);

//   const getStatusColor = useCallback((status: string) => {
//     console.log('🎨 [InvitationStatusScreen] Getting status color for:', status);
    
//     const colors = (() => {
//       switch (status) {
//         case 'pending':
//           return {
//             backgroundColor: '#FFF3E0', // Light orange background
//             textColor: '#F57C00',       // Dark orange text
//             borderColor: '#FFB74D'      // Medium orange border
//           };
//         case 'accepted':
//           return {
//             backgroundColor: '#E8F5E8', // Light green background
//             textColor: '#2E7D32',       // Dark green text
//             borderColor: '#66BB6A'      // Medium green border
//           };
//         case 'rejected':
//           return {
//             backgroundColor: '#FFEBEE', // Light red background
//             textColor: '#C62828',       // Dark red text
//             borderColor: '#EF5350'      // Medium red border
//           };
//         case 'expired':
//           return {
//             backgroundColor: '#F5F5F5', // Light gray background
//             textColor: '#757575',       // Dark gray text
//             borderColor: '#BDBDBD'      // Medium gray border
//           };
//         default:
//           return {
//             backgroundColor: '#F0F0F0',
//             textColor: '#666666',
//             borderColor: '#CCCCCC'
//           };
//       }
//     })();
    
//     console.log('🌈 [InvitationStatusScreen] Status colors resolved:', colors);
//     return colors;
//   }, []);

//   const getStatusText = useCallback((status: string) => {
//     console.log('👤 [InvitationStatusScreen] Getting status text for:', status);
    
//     const statusText = (() => {
//       switch (status) {
//         case 'pending':
//           return 'Chờ phản hồi';
//         case 'accepted':
//           return 'Đã chấp nhận';
//         case 'rejected':
//           return 'Đã từ chối';
//         case 'expired':
//           return 'Hết hạn';
//         default:
//           return status;
//       }
//     })();
    
//     console.log('🏷️ [InvitationStatusScreen] Status text resolved:', statusText);
//     return statusText;
//   }, []);

//   const handleBackPress = useCallback(() => {
//     console.log('⬅️ [InvitationStatusScreen] Back button pressed');
//     navigation.goBack();
//   }, [navigation]);

//   const handleAcceptInvitation = useCallback((invitation: InvitationStatus) => {
//     console.log('✅ [InvitationStatusScreen] Accept invitation pressed:', invitation.id);
//     Alert.alert(
//       'Chấp nhận lời mời',
//       `Bạn có chắc chắn muốn tham gia nhóm "${invitation.groupName}"?`,
//       [
//         {
//           text: 'Hủy',
//           style: 'cancel'
//         },
//         {
//           text: 'Chấp nhận',
//           onPress: () => {
//             console.log('🎉 [InvitationStatusScreen] Accepting invitation:', invitation.id);
//             // TODO: Call API to accept invitation
//             Alert.alert('Thành công', 'Bạn đã tham gia nhóm thành công!');
//             loadInvitations(); // Reload to update status
//           }
//         }
//       ]
//     );
//   }, [loadInvitations]);

//   const handleRejectInvitation = useCallback((invitation: InvitationStatus) => {
//     console.log('❌ [InvitationStatusScreen] Reject invitation pressed:', invitation.id);
//     Alert.alert(
//       'Từ chối lời mời',
//       `Bạn có chắc chắn muốn từ chối lời mời tham gia nhóm "${invitation.groupName}"?`,
//       [
//         {
//           text: 'Hủy',
//           style: 'cancel'
//         },
//         {
//           text: 'Từ chối',
//           style: 'destructive',
//           onPress: () => {
//             console.log('🚫 [InvitationStatusScreen] Rejecting invitation:', invitation.id);
//             // TODO: Call API to reject invitation
//             Alert.alert('Đã từ chối', 'Bạn đã từ chối lời mời tham gia nhóm.');
//             loadInvitations(); // Reload to update status
//           }
//         }
//       ]
//     );
//   }, [loadInvitations]);

//   const handleInvitationPress = useCallback((invitation: InvitationStatus) => {
//     console.log('🎯 [InvitationStatusScreen] Invitation pressed:', invitation.id);
    
//     if (invitation.status === 'pending') {
//       Alert.alert(
//         'Lời mời tham gia nhóm',
//         `Nhóm: ${invitation.groupName}\nNgười mời: ${invitation.inviterName}\nNgày mời: ${formatDate(invitation.invitationDate)}`,
//         [
//           {
//             text: 'Từ chối',
//             style: 'destructive',
//             onPress: () => handleRejectInvitation(invitation)
//           },
//           {
//             text: 'Chấp nhận',
//             onPress: () => handleAcceptInvitation(invitation)
//           }
//         ]
//       );
//     } else {
//       Alert.alert(
//         'Chi tiết lời mời',
//         `Nhóm: ${invitation.groupName}\nNgười mời: ${invitation.inviterName}\nNgày mời: ${formatDate(invitation.invitationDate)}\nTrạng thái: ${getStatusText(invitation.status)}`
//       );
//     }
//   }, [formatDate, getStatusText, handleAcceptInvitation, handleRejectInvitation]);

//   const renderInvitationItem = useCallback(({ item }: { item: InvitationStatus }) => {
//     console.log('📋 [InvitationStatusScreen] Rendering invitation item:', {
//       invitationId: item.id,
//       groupName: item.groupName,
//       status: item.status
//     });
    
//     const statusColor = getStatusColor(item.status);
    
//     return (
//       <TouchableOpacity style={styles.invitationItem} onPress={() => handleInvitationPress(item)}>
//         <View style={styles.invitationItemLeft}>
//           <View style={styles.groupIcon}>
//             {item.groupAvatar ? (
//               <Image 
//                 source={{ uri: item.groupAvatar }}
//                 style={styles.groupAvatarImage}
//               />
//             ) : (
//               <Icon name="group" size={24} color="#4A90E2" />
//             )}
//           </View>
//           <View style={styles.invitationInfo}>
//             <Text style={styles.groupName}>{item.groupName}</Text>
//             <Text style={styles.inviterText}>Mời bởi: {item.inviterName}</Text>
//             <Text style={styles.invitationDate}>{formatDate(item.invitationDate)}</Text>
//           </View>
//         </View>
//         <View style={styles.invitationItemRight}>
//           <Text style={[
//             styles.statusBadge, 
//             { 
//               backgroundColor: statusColor.backgroundColor, 
//               borderColor: statusColor.borderColor, 
//               color: statusColor.textColor 
//             }
//           ]}>
//             {getStatusText(item.status)}
//           </Text>
//           {item.status === 'pending' && (
//             <View style={styles.actionButtons}>
//               <TouchableOpacity 
//                 style={[styles.actionButton, styles.rejectButton]} 
//                 onPress={() => handleRejectInvitation(item)}
//               >
//                 <Icon name="close" size={16} color="#C62828" />
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={[styles.actionButton, styles.acceptButton]} 
//                 onPress={() => handleAcceptInvitation(item)}
//               >
//                 <Icon name="check" size={16} color="#2E7D32" />
//               </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       </TouchableOpacity>
//     );
//   }, [formatDate, getStatusColor, getStatusText, handleAcceptInvitation, handleRejectInvitation, handleInvitationPress]);

//   // Log render state
//   console.log('🎨 [InvitationStatusScreen] Rendering with state:', {
//     invitationsCount: invitations.length,
//     loading,
//     isAuthenticated,
//   });

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
//           <Icon name="arrow-back" size={24} color="#333333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Trạng thái lời mời</Text>
//         <View style={styles.headerRightButtons}>
//           <TouchableOpacity style={styles.headerButton} onPress={loadInvitations}>
//             <Icon name="refresh" size={24} color="#4A90E2" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.content}>
//         {/* Invitations List */}
//         {loading ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#4A90E2" />
//             <Text style={styles.loadingText}>Đang tải...</Text>
//           </View>
//         ) : invitations.length === 0 ? (
//           <View style={styles.emptyContainer}>
//             <View style={styles.emptyIcon}>
//               <Icon name="person-add" size={64} color="#CCCCCC" />
//             </View>
//             <Text style={styles.emptyTitle}>Không có lời mời nào</Text>
//             <Text style={styles.emptyDescription}>
//               Bạn chưa có lời mời tham gia nhóm nào hoặc tất cả lời mời đã được xử lý.
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={invitations}
//             renderItem={renderInvitationItem}
//             keyExtractor={(item) => item.id}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.invitationsList}
//             ListHeaderComponent={() => (
//               <View style={styles.headerSection}>
//                 <Text style={styles.welcomeText}>Lời mời tham gia nhóm</Text>
//                 <Text style={styles.subtitleText}>
//                   Quản lý các lời mời tham gia nhóm của bạn
//                 </Text>
//               </View>
//             )}
//           />
//         )}
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#FFFFFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333333',
//     flex: 1,
//     textAlign: 'center',
//     marginHorizontal: 16,
//   },
//   headerRightButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerButton: {
//     padding: 8,
//     marginLeft: 4,
//   },
//   content: {
//     flex: 1,
//     paddingTop: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#666666',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//     paddingVertical: 60,
//   },
//   emptyIcon: {
//     marginBottom: 24,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptyDescription: {
//     fontSize: 14,
//     color: '#666666',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   invitationsList: {
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   headerSection: {
//     padding: 16,
//   },
//   welcomeText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   subtitleText: {
//     fontSize: 14,
//     color: '#666666',
//   },
//   invitationItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     backgroundColor: '#FFFFFF',
//     padding: 16,
//     marginBottom: 12,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 3.84,
//     elevation: 5,
//     justifyContent: 'space-between',
//   },
//   invitationItemLeft: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     flex: 1,
//   },
//   groupIcon: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#E3F2FD',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     overflow: 'hidden',
//   },
//   groupAvatarImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//   },
//   invitationInfo: {
//     flex: 1,
//     marginRight: 8,
//   },
//   groupName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333333',
//     marginBottom: 4,
//   },
//   inviterText: {
//     fontSize: 14,
//     color: '#666666',
//     marginBottom: 2,
//   },
//   invitationDate: {
//     fontSize: 12,
//     color: '#999999',
//   },
//   invitationItemRight: {
//     alignItems: 'flex-end',
//     minWidth: 100,
//   },
//   statusBadge: {
//     fontSize: 12,
//     fontWeight: '500',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 10,
//     borderWidth: 1,
//     alignSelf: 'flex-start',
//     marginBottom: 8,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   actionButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 4,
//   },
//   rejectButton: {
//     backgroundColor: '#FFEBEE',
//     borderWidth: 1,
//     borderColor: '#EF5350',
//   },
//   acceptButton: {
//     backgroundColor: '#E8F5E8',
//     borderWidth: 1,
//     borderColor: '#66BB6A',
//   },
// });

// export default InvitationStatusScreen;

// InvitationStatusScreen.displayName = 'InvitationStatusScreen';  