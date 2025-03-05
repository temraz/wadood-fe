import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from '../constants/api';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import OrderProgressBar from '../components/OrderProgressBar';
import ReceiptModal from '../components/ReceiptModal';

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#45A049',
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
      }}
      text2Style={{
        fontSize: 14,
        color: '#fff',
        opacity: 0.9
      }}
      text2NumberOfLines={2}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#D32F2F',
        backgroundColor: '#F44336',
        borderRadius: 8,
        marginHorizontal: 16,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#fff'
      }}
      text2Style={{
        fontSize: 14,
        color: '#fff',
        opacity: 0.9
      }}
      text2NumberOfLines={2}
    />
  )
};

const { width } = Dimensions.get('window');
const SPRING_CONFIG = { damping: 15, stiffness: 150 };

// Add color constants
const COLORS = {
  primary: '#86A8E7',
  secondary: '#7F7FD5',
  primaryLight: '#E3F2FD',
  secondaryLight: '#EDE7F6',
  gradient: ['#86A8E7', '#7F7FD5'],
  gradientLight: ['#E3F2FD', '#EDE7F6'],
  background: '#F7F9FC',
  card: 'rgba(255,255,255,0.95)',
  border: 'rgba(134,168,231,0.12)',
  text: '#2A363B',
  textLight: '#666666',
  success: '#2ECC71',
  successLight: '#E8F5E9',
  warning: '#F1C40F',
  warningLight: '#FFF8E1',
  error: '#E74C3C',
  errorLight: '#FFEBEE',
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const headerOpacity = React.useRef(new Animated.Value(0)).current;

  // Add default translations in case t is undefined
  const defaultTranslations = {
    orders: {
      orderDetails: {
        title: 'Order',
        serviceLocation: 'Service Location',
        openInMaps: 'Open in Maps',
        appointmentTime: 'Appointment Time',
        paymentDetails: 'Payment Details',
        method: 'Payment Method',
        status: 'Status',
        quantity: 'Quantity',
        totalAmount: 'Total Amount',
        cancelOrder: 'Cancel Order',
        startService: 'Start Service',
        completeService: 'Complete Service',
        viewReceipt: 'View Receipt'
      },
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        in_progress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
    }
  };

  // Use translations with fallback
  const translations = t || defaultTranslations;

  // Load user role
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        console.log('User Data String:', userDataString); // Debug log
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          console.log('Parsed User Data:', userData); // Debug log
          console.log('User Role:', userData.role); // Debug log
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };
    loadUserRole();
  }, []);

  useEffect(() => {
    if (order) {
      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          ...SPRING_CONFIG,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          ...SPRING_CONFIG,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [order]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: headerOpacity } } }],
    { useNativeDriver: false }
  );

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await ensureValidToken(language);
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [params.id]);

  const formatDate = (dateString) => {
    if (!dateString) return { date: '', time: '' };
    
    const date = new Date(dateString);
    const dateOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    };

    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    };

    return {
      date: date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', dateOptions),
      time: date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', timeOptions)
    };
  };

  const formatCreatedDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    };

    return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return { bgColor: '#FF9A00', textColor: '#fff' };
      case 'CONFIRMED':
        return { bgColor: '#5B8EDC', textColor: '#fff' };
      case 'IN_PROGRESS':
        return { bgColor: '#388E3C', textColor: '#fff' };
      case 'COMPLETED':
        return { bgColor: '#388E3C', textColor: '#fff' };
      case 'CANCELLED':
        return { bgColor: '#D32F2F', textColor: '#fff' };
      default:
        return { bgColor: '#444', textColor: '#fff' };
    }
  };

  const openMaps = () => {
    if (!order?.address_details) return;
    
    const { latitude, longitude } = order.address_details;
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:'
    });
    const latLng = `${latitude},${longitude}`;
    const label = order.address;
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}`,
      android: `${scheme}${latLng}?q=${label}`
    });

    Linking.openURL(url);
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      translations?.orderDetails?.cancelConfirmTitle || 'Cancel Order',
      translations?.orderDetails?.cancelConfirmMessage || 'Are you sure you want to cancel this order?',
      [
        {
          text: translations?.common?.no || 'No',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: translations?.common?.yes || 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true);
              const token = await ensureValidToken(language);
              
              // Debug logs
              // console.log('=== Cancel Order Request ===');
              // console.log('Order ID:', order.id);
              // console.log('Order Status:', order.status);
              // console.log('API URL:', `${API_BASE_URL}/api/orders/${order.id}/cancel`);
              // console.log('Headers:', {
              //   'Authorization': `Bearer ${token}`,
              //   'Accept-Language': language,
              //   'Accept': 'application/json'
              // });
              
              const response = await fetch(`${API_BASE_URL}/api/orders/${order.id}/cancel`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept-Language': language,
                  'Accept': 'application/json'
                }
              });

              // Debug response
              // console.log('=== Cancel Order Response ===');
              // console.log('Status:', response.status);
              // console.log('Status Text:', response.statusText);
              
              const responseText = await response.text();
              // console.log('Response Text:', responseText);

              let data;
              try {
                data = JSON.parse(responseText);
                console.log('Parsed Response:', data);
              } catch (parseError) {
                console.log('Failed to parse response as JSON:', parseError);
                throw new Error('Invalid response from server');
              }

              if (response.ok) {
                // Update order status locally
                setOrder(prev => ({ ...prev, status: 'CANCELLED' }));
                
                Toast.show({
                  type: 'success',
                  text1: translations?.orderDetails?.cancelSuccessTitle || 'Success',
                  text2: translations?.orderDetails?.cancelSuccessMessage || 'Order cancelled successfully',
                  position: 'top',
                  visibilityTime: 3000,
                  topOffset: 60,
                  props: {
                    backgroundColor: '#4CAF50',
                    borderLeftColor: '#45A049'
                  },
                  onShow: () => {},
                  onHide: () => {},
                });
              } else {
                // Use the exact error message from the API response
                const errorMessage = data?.message || 'Failed to cancel order';
                
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: errorMessage,
                  position: 'top',
                  visibilityTime: 3000,
                  topOffset: 60,
                  props: {
                    backgroundColor: '#F44336',
                    borderLeftColor: '#D32F2F'
                  }
                });
              }
            } catch (error) {
              console.error('Cancel order error:', error);
              console.error('Error stack:', error.stack);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to cancel order. Please try again.',
                position: 'top',
                visibilityTime: 3000,
                props: {
                  icon: 'alert-circle'
                }
              });
              setError('Failed to cancel order. Please try again.');
            } finally {
              setCancelLoading(false);
            }
          }
        }
      ],
      {
        cancelable: true,
        titleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: '#FF6B6B'
        },
        messageStyle: {
          fontSize: 16,
          color: '#666'
        }
      }
    );
  };

  const handleViewReceipt = () => {
    setShowReceipt(true);
  };

  // Add helper function to check if items have service_id
  const isServiceOrder = (items) => {
    return items?.some(item => item.service_id);
  };

  const handleStartService = async () => {
    try {
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/orders/provider/${order.id}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update order status locally and refresh order details to update status bar
        setOrder(prev => ({ ...prev, status: 'IN_PROGRESS' }));
        fetchOrderDetails(); // Refresh the entire order details to update status bar
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order status updated to In Progress',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to update order status',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Start service error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update order status',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleCompleteService = async () => {
    try {
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/orders/provider/${order.id}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'COMPLETED'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update order status locally and refresh order details to update status bar
        setOrder(prev => ({ ...prev, status: 'COMPLETED' }));
        fetchOrderDetails(); // Refresh the entire order details to update status bar
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order marked as completed',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: data.message || 'Failed to complete order',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('Complete service error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to complete order',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const handleAcceptOrder = async () => {
    try {
      const token = await ensureValidToken(language);
      console.log('Order type:', order?.order_type); // Debug log
      
      // For product orders, directly accept without staff selection
      if (order?.order_type === 'product') {
        console.log('Handling product order acceptance'); // Debug log
        const response = await fetch(`${API_BASE_URL}/api/orders/provider/${order.id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': language,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'ACCEPTED'
          })
        });

        const data = await response.json();
        if (data.success) {
          setOrder(prev => ({ ...prev, status: 'ACCEPTED' }));
          fetchOrderDetails();
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Order accepted successfully',
            position: 'top',
            visibilityTime: 3000,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message || 'Failed to accept order',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      } else {
        // Only show staff modal for service orders
        console.log('Handling service order - showing staff modal');
        setShowStaffModal(true);
      }
    } catch (error) {
      console.error('Accept order error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to accept order',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const statusColor = order?.status ? getStatusColor(order.status) : COLORS.textLight;
  const orderStatus = order?.status?.toLowerCase() || 'pending';
  const orderStatusText = translations?.orders?.status?.[orderStatus] || orderStatus;

  const headerBackground = headerOpacity.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(255,255,252,0)', 'rgba(255,255,252,0.98)'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {console.log('Current User Role:', userRole)} {/* Debug log */}
      {console.log('Current Order Status:', order?.status)} {/* Debug log */}
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, { 
        backgroundColor: headerOpacity.interpolate({
          inputRange: [0, 100],
          outputRange: ['rgba(247,249,252,0)', 'rgba(247,249,252,0.98)']
        })
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            style={styles.backButtonGradient}
          >
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color="#fff" 
            />
          </LinearGradient>
        </TouchableOpacity>
        <Animated.Text style={[styles.floatingTitle, { 
          opacity: headerOpacity.interpolate({
            inputRange: [0, 100],
            outputRange: [0, 1]
          })
        }]}>
          {translations.orderDetails.title} #{order.id}
        </Animated.Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          <Text style={styles.orderId}>{translations.orderDetails.title} #{order.id}</Text>
          <OrderProgressBar status={order?.status} order_type={order?.order_type} />
        </Animated.View>

        {/* Content Cards */}
        <Animated.View style={[styles.content, { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]}>
          {/* Provider Card - Only show for regular users */}
          {(!userRole || (userRole !== 'admin' && userRole !== 'staff' && userRole !== 'driver')) && (
            <BlurView intensity={60} tint="light" style={styles.card}>
              <View style={styles.providerContainer}>
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.providerIconContainer}
                >
                  <Ionicons name="paw" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>
                    {order?.provider_name || 'Provider'}
                  </Text>
                  <Text style={styles.createdDate}>
                    {formatCreatedDate(order?.created_at)}
                  </Text>
                </View>
              </View>
            </BlurView>
          )}

          {/* User Card - Show for admin, staff, and driver */}
          {(userRole === 'admin' || userRole === 'staff' || userRole === 'driver') && (
            <BlurView intensity={60} tint="light" style={styles.card}>
              <View style={styles.providerContainer}>
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.providerIconContainer}
                >
                  <Ionicons name="person" size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>
                    {order?.user_name || 'Customer'}
                  </Text>
                  <Text style={styles.createdDate}>
                    {formatCreatedDate(order?.created_at)}
                  </Text>
                </View>
              </View>
            </BlurView>
          )}

          {/* Location Card */}
          {order.address_id !== 0 && (
            <BlurView intensity={60} tint="light" style={styles.card}>
              <TouchableOpacity onPress={openMaps} style={styles.locationContent}>
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={COLORS.gradient}
                    style={styles.iconContainer}
                  >
                    <Ionicons name="location" size={20} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.cardTitle}>{translations.orderDetails.serviceLocation}</Text>
                </View>
                <Text style={styles.locationText}>{order.address}</Text>
                <LinearGradient
                  colors={COLORS.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.mapButton}
                >
                  <Text style={styles.mapButtonText}>{translations.orderDetails.openInMaps}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          )}

          {/* Schedule Card - Only show for service orders */}
          {isServiceOrder(order?.items) && order?.scheduled_at && (
            <BlurView intensity={60} tint="light" style={[styles.card, styles.scheduleCard]}>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.iconContainer}
                >
                  <Ionicons name="calendar" size={20} color="#fff" />
                </LinearGradient>
                <Text style={styles.cardTitle}>{translations.orderDetails.appointmentTime}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleIconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.scheduleText}>
                    {formatDate(order.scheduled_at).date}
                  </Text>
                </View>
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleIconContainer}>
                    <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.scheduleText}>
                    {formatDate(order.scheduled_at).time}
                  </Text>
                </View>
              </View>
            </BlurView>
          )}

          {/* Services Card */}
          <BlurView intensity={60} tint="light" style={[styles.card,styles.servicesCard]}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={COLORS.gradient}
                style={styles.iconContainer}
              >
                <Ionicons name="list" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.cardTitle}>
                {isServiceOrder(order.items) ? 'Services' : 'Products'}
              </Text>
            </View>
            {order.items.map((item, index) => (
              <View key={item.id} style={[styles.serviceItem, 
                index === order.items.length - 1 && { borderBottomWidth: 0 }
              ]}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.quantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={[styles.servicePrice, { color: COLORS.primary }]}>
                  SAR {item.price}
                </Text>
              </View>
            ))}
            <LinearGradient
              colors={COLORS.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.totalContainer}
            >
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>SAR {order.total_amount}</Text>
            </LinearGradient>
          </BlurView>

          {/* Payment Card */}
          <BlurView intensity={60} tint="light" style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={COLORS.gradient}
                style={styles.iconContainer}
              >
                <Ionicons name="card" size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.cardTitle}>{translations?.orderDetails?.paymentDetails || 'Payment Details'}</Text>
            </View>
            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{translations?.orderDetails?.method || 'Method'}:</Text>
                <Text style={styles.paymentValue}>{order?.payment_method || '-'}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>{translations?.orderDetails?.status || 'Status'}:</Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: `${statusColor.bgColor}` }]}>
                  <View style={[styles.statusDotSmall, { backgroundColor: '#fff' }]} />
                  <Text style={[styles.statusTextSmall, { color: statusColor.textColor }]}>
                    {order?.payment_status || '-'}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>

      {/* Add ReceiptModal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        order={order}
      />

      {/* Updated Footer */}
      <SafeAreaView edges={['bottom']} style={[styles.safeFooter, { backgroundColor: COLORS.card }]}>
        <BlurView intensity={90} tint="light" style={styles.footer}>
          <View style={styles.actionButtons}>
            {/* Show Accept Order button for PENDING status */}
            {order?.status === 'PENDING' && (
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1 }]}
                onPress={handleAcceptOrder}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.actionGradient}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    Accept Order
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Show Start Service/Delivery button when order is CONFIRMED or ACCEPTED */}
            {(order?.status === 'CONFIRMED' || order?.status === 'ACCEPTED') && (
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1 }]}
                onPress={handleStartService}
              >
                <LinearGradient
                  colors={['#2196F3', '#1976D2']}
                  style={styles.actionGradient}
                >
                  <Ionicons name={order?.order_type === 'product' ? "bicycle" : "play-circle"} size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {order?.order_type === 'product' ? 'Start Delivery' : 'Start Service'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Show Complete Service/Delivered button when order is IN_PROGRESS */}
            {order?.status === 'IN_PROGRESS' && (
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1 }]}
                onPress={handleCompleteService}
              >
                <LinearGradient
                  colors={['#4CAF50', '#45A049']}
                  style={styles.actionGradient}
                >
                  <Ionicons name={order?.order_type === 'product' ? "checkmark-done-circle" : "checkmark-circle"} size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {order?.order_type === 'product' ? 'Mark as Delivered' : 'Complete Service'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Show Cancel Order button for PENDING status */}
            {order?.status === 'PENDING' && (
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1 }]}
                onPress={handleCancelOrder}
                disabled={cancelLoading}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E8E']}
                  style={styles.actionGradient}
                >
                  {cancelLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        {translations?.orderDetails?.cancelOrder || 'Cancel Order'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Updated View Receipt button */}
            {order?.status === 'COMPLETED' && (
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1 }]}
                onPress={handleViewReceipt}
              >
                <LinearGradient
                  colors={COLORS.gradient}
                  style={styles.actionGradient}
                >
                  <Ionicons name="receipt" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    {translations?.orderDetails?.viewReceipt || 'View Receipt'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </BlurView>
      </SafeAreaView>
      <Toast 
        config={toastConfig}
        ref={(ref) => Toast.setRef(ref)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 1000,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 16,
  },
  heroSection: {
    padding: 20,
    paddingTop: 12,
  },
  orderId: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 24,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  providerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  createdDate: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  locationContent: {
    // padding: 20,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
    marginTop: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleCard: {
    minHeight: 130,
  },
  scheduleDetails: {
    padding: 20,
    gap: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#fff',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666',
  },
  paymentValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  safeFooter: {
    position:'absolute',
    bottom:0,
    width:'100%',
    // backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footer: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTextSmall: {
    fontSize: 13,
    fontWeight: '500',
  },
}); 