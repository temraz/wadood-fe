import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_BASE_URL, getHeaders } from './constants/api';
import OrderProgressBar from './components/OrderProgressBar';
import * as Location from 'expo-location';
import ProfileMenu from './components/ProfileMenu';

export default function DriverHomeScreen() {
  const router = useRouter();
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchDeliveryRequests();
    startLocationTracking();
    loadUserData();
    // Refresh requests every 30 seconds
    const interval = setInterval(fetchDeliveryRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for delivery services.');
        return;
      }

      // Start watching position
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setCurrentLocation(location.coords);
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); // Return distance with 1 decimal place
  };

  const fetchDeliveryRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      console.log(token);
      const response = await fetch(`${API_BASE_URL}/api/orders/delivery-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...getHeaders('en')
        }
      });

      const data = await response.json();
      if (data.success && data.data.requests) {
        setDeliveryRequests(data.data.requests);
      }
    } catch (error) {
      console.error('Error fetching delivery requests:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch delivery requests'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setIsUpdating(true);
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      const user = JSON.parse(userData);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/delivery-requests/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...getHeaders('en')
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'ACCEPT',
          staff_id: user.id
        })
      });

      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Delivery request accepted'
        });
        fetchDeliveryRequests();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to accept request'
        });
      }
    } catch (error) {
      console.error('Accept request error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to accept request'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setIsUpdating(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/orders/delivery-requests/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...getHeaders('en')
        },
        body: JSON.stringify({
          request_id: requestId,
          action: 'REJECT'
        })
      });

      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Delivery request rejected'
        });
        fetchDeliveryRequests();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to reject request'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      setIsUpdating(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/orders/provider/${orderId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...getHeaders('en')
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        })
      });

      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Delivery started'
        });
        fetchDeliveryRequests();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start delivery'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    Alert.alert(
      'Confirm Delivery',
      'Are you sure you want to mark this order as delivered?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsUpdating(true);
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`${API_BASE_URL}/api/orders/provider/${orderId}/progress`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                  ...getHeaders('en')
                },
                body: JSON.stringify({
                  status: 'COMPLETED'
                })
              });

              const data = await response.json();
              if (data.success) {
                Toast.show({
                  type: 'success',
                  text1: 'Success',
                  text2: 'Order marked as delivered'
                });
                fetchDeliveryRequests();
              }
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to mark as delivered'
              });
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const openMaps = (latitude, longitude, address) => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const latLng = `${latitude},${longitude}`;
    const label = address;
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}`,
      android: `${scheme}${latLng}?q=${label}`
    });

    Linking.openURL(url);
  };

  const renderDeliveryRequest = (request) => {
    const isPending = request.status === 'PENDING';
    const isAccepted = request.order?.status === 'ACCEPTED';
    const isInProgress = request.order?.status === 'IN_PROGRESS';
    
    const getStatusColor = (status) => {
      switch (status) {
        case 'PENDING':
          return { bg: '#FFF3E0', text: '#FF9800' };
        case 'ACCEPTED':
          return { bg: '#E3F2FD', text: '#2196F3' };
        case 'IN_PROGRESS':
          return { bg: '#E8F5E9', text: '#4CAF50' };
        case 'COMPLETED':
          return { bg: '#E8F5E9', text: '#4CAF50' };
        default:
          return { bg: '#FFEBEE', text: '#F44336' };
      }
    };

    const statusColors = getStatusColor(request.order?.status || request.status);
    
    const distance = currentLocation && request.order?.address ? 
      calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        request.order.address.latitude,
        request.order.address.longitude
      ) : null;

    return (
      <BlurView intensity={60} tint="light" style={styles.requestCard} key={request.id}>
        <LinearGradient
          colors={['#7F7FD5', '#86A8E7']}
          style={styles.cardHeader}
        >
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.requestIdWhite}>#{request.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColors.text }]} />
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {request.order?.status || request.status}
                </Text>
              </View>
            </View>
            {distance && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={14} color="#fff" />
                <Text style={styles.distanceText}>{distance} km</Text>
              </View>
            )}
          </View>
          <View style={styles.headerBottomRow}>
            <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
            <Text style={styles.expiryText}>
              Expires at {new Date(request.expires_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </Text>
          </View>
        </LinearGradient>

        {request.order && (
          <View style={styles.cardContent}>
            <View style={styles.storeSection}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="storefront-outline" size={20} color="#86A8E7" />
              </View>
              <Text style={styles.storeName}>{request.order.provider_name}</Text>
            </View>

            <View style={styles.paymentSection}>
              <View style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Ionicons name="card-outline" size={20} color="#86A8E7" />
                  <Text style={styles.paymentLabel}>Payment Method</Text>
                  <View style={[styles.paymentBadge, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.paymentBadgeText, { color: '#2196F3' }]}>
                      {request.order.payment_method}
                    </Text>
                  </View>
                </View>
                <View style={styles.paymentInfo}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#86A8E7" />
                  <Text style={styles.paymentLabel}>Payment Status</Text>
                  <View style={[styles.paymentBadge, { backgroundColor: request.order.payment_status === 'PAID' ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.paymentBadgeText, { color: request.order.payment_status === 'PAID' ? '#4CAF50' : '#F44336' }]}>
                      {request.order.payment_status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.itemsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="list" size={20} color="#86A8E7" />
                </View>
                <Text style={styles.sectionTitle}>Order Items</Text>
              </View>
              {request.order.items?.map((item, index) => (
                <View key={index} style={[styles.serviceItem]}>
                  <Text style={[styles.serviceName]}>
                    {item.name}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={[styles.servicePrice]}>
                    {item.price} SAR
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>SAR {request.order.total_amount}</Text>
              </View>
            </View>

            <View style={styles.addressSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="location" size={20} color="#86A8E7" />
                </View>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>
              <View style={styles.addressContent}>
                <View style={styles.addressInfo}>
                  <Text style={styles.customerName}>{request.order.user.name}</Text>
                  <Text style={styles.orderAddress}>{request.order.address.address}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => openMaps(
                    request.order.address.latitude,
                    request.order.address.longitude,
                    request.order.address.address
                  )}
                >
                  <LinearGradient
                    colors={['#86A8E7', '#7F7FD5']}
                    style={styles.mapButtonGradient}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {isPending && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectRequest(request.id)}
                  disabled={isUpdating}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={() => handleAcceptRequest(request.id)}
                  disabled={isUpdating}
                >
                  <LinearGradient
                    colors={['#86A8E7', '#7F7FD5']}
                    style={styles.actionGradient}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {request.status === 'ACCEPTED' && request.order?.status === 'ACCEPTED' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => handleStartDelivery(request.order.id)}
                  disabled={isUpdating}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    style={styles.actionGradient}
                  >
                    <Ionicons name="bicycle" size={20} color="#fff" />
                    <Text style={styles.startButtonText}>Start Delivery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {request.status === 'ACCEPTED' && request.order?.status === 'IN_PROGRESS' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() => handleMarkDelivered(request.order.id)}
                  disabled={isUpdating}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    style={styles.actionGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.completeButtonText}>Mark as Delivered</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </BlurView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#86A8E7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeAreaTop} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowProfileMenu(true)}
          >
            <Ionicons name="menu-outline" size={24} color="#86A8E7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delivery Requests</Text>
          <View style={styles.menuButton} /> {/* Empty view for flex spacing */}
        </View>

        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                fetchDeliveryRequests();
              }}
            />
          }
        >
          {deliveryRequests.length > 0 ? (
            deliveryRequests.map(request => renderDeliveryRequest(request))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="bicycle" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Delivery Requests</Text>
              <Text style={styles.emptyStateText}>
                Pull down to refresh and check for new requests
              </Text>
            </View>
          )}
        </ScrollView>

        <ProfileMenu
          visible={showProfileMenu}
          onClose={() => setShowProfileMenu(false)}
          onLanguageChange={() => {}}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeAreaTop: {
    flex: 0,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(134,168,231,0.12)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestCard: {
    margin: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.12)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderRadius: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestIdWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  paymentSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.08)',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    // backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  itemsSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.08)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  serviceName: {
    fontSize: 14,
    color: '#2A363B',
    fontWeight: '500',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A363B',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#86A8E7',
  },
  addressSection: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.08)',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 14,
    color: '#2A363B',
    lineHeight: 20,
    marginBottom: 12,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  mapButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  acceptButton: {
    backgroundColor: '#86A8E7',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#86A8E7',
    fontWeight: '500',
  },
}); 