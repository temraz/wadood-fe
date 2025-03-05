import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getHeaders } from './constants/api';
import { useLanguage } from './context/LanguageContext';

export default function StaffScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Reset and fetch staff when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setPage(1);
      setStaff([]);
      setHasMore(true);
      fetchStaff();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const fetchStaff = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please login again',
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/users/staff?page=${page}&limit=10`,
        {
          headers: {
            ...getHeaders(language),
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON Parse error:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        const staffData = data.data.staff || [];
        setStaff(prev => page === 1 ? staffData : [...prev, ...staffData]);
        setHasMore(page < (data.data.total_pages || 1));
      } else {
        throw new Error(data.message || 'Failed to fetch staff list');
      }
    } catch (error) {
      console.error('Fetch staff error:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch staff list',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
      fetchStaff();
    }
  };

  const handleDeleteStaff = (id) => {
    setSelectedStaffId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Please login again',
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/users/staff/${selectedStaffId}`, {
        method: 'DELETE',
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('JSON Parse error:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        setStaff(prev => prev.filter(member => member.id !== selectedStaffId));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: data.message || 'Staff member deleted successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to delete staff member',
      });
    } finally {
      setShowDeleteConfirm(false);
      setSelectedStaffId(null);
    }
  };

  const renderStaffList = () => {
    if (isLoading && page === 1) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#86A8E7" />
        </View>
      );
    }

    if (!staff || staff.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No staff members found</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.content}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          if (isEndReached && hasMore) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {staff.map(member => (
          <View key={member.id} style={styles.staffCard}>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{member.name}</Text>
              <Text style={styles.staffPhone}>{member.phone}</Text>
              <Text style={styles.staffEmail}>{member.email}</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: member.is_active ? '#4CAF50' : '#FF6B6B' }]} />
                <Text style={styles.statusText}>{member.is_active ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleDeleteStaff(member.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}
        {isLoading && page > 1 && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#86A8E7" />
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2A363B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Management</Text>
          <View style={styles.placeholder} />
        </View>

        {renderStaffList()}

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/addStaff')}
        >
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModalContent}>
              <Ionicons name="warning-outline" size={32} color="#FF6B6B" style={styles.warningIcon} />
              <Text style={styles.confirmTitle}>Delete Staff Member</Text>
              <Text style={styles.confirmMessage}>Are you sure you want to delete this staff member?</Text>
              
              <View style={styles.confirmButtons}>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.cancelButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.confirmButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.deleteConfirmButton]}
                  onPress={confirmDelete}
                >
                  <Text style={[styles.confirmButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  staffPhone: {
    fontSize: 14,
    color: '#666',
  },
  staffEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    zIndex: 1000,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#2A363B',
  },
  addStaffButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStaffButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#2A363B',
  },
  deleteButtonText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
}); 