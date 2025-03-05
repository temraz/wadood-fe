import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  I18nManager,
  Dimensions,
  Modal,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from './context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import { BlurView } from 'expo-blur';
import ProfileMenu from './components/ProfileMenu';

const MOCK_ORDERS = [
  {
    id: 'o1',
    time: '09:00',
    customerName: 'John Doe',
    services: [
      { name: 'Pet Grooming', duration: 45 },
      { name: 'Nail Trimming', duration: 15 }
    ],
    duration: 60, // total duration
    status: 'confirmed'
  },
  {
    id: 'o2',
    time: '11:30',
    customerName: 'Sarah Smith',
    services: [
      { name: 'Full Service', duration: 60 },
      { name: 'Teeth Cleaning', duration: 30 }
    ],
    duration: 90,
    status: 'in_progress'
  },
  {
    id: 'o3',
    time: '14:00',
    customerName: 'Mike Johnson',
    services: [
      { name: 'Basic Grooming', duration: 45 }
    ],
    duration: 45,
    status: 'completed'
  },
  {
    id: 'o4',
    time: '16:00',
    customerName: 'Emily Brown',
    services: [
      { name: 'Nail Trimming', duration: 15 },
      { name: 'Bath Service', duration: 30 },
      { name: 'Ear Cleaning', duration: 15 }
    ],
    duration: 60,
    status: 'confirmed'
  }
];

const MOCK_PRODUCT_ORDERS = [
  {
    id: 'po1',
    customerName: 'John Smith',
    orderDate: '2024-03-15',
    orderTime: '10:30 AM',
    status: 'pending',
    items: [
      { name: 'Royal Canin Food', quantity: 2, price: 45 },
      { name: 'Pet Brush', quantity: 1, price: 15 }
    ],
    totalAmount: 105,
    address: '123 Pet Street, NY',
    paymentMethod: 'Credit Card',
    notes: 'Please deliver in the morning'
  },
  {
    id: 'po2',
    customerName: 'Sarah Wilson',
    orderDate: '2024-03-15',
    orderTime: '2:15 PM',
    status: 'pending',
    items: [
      { name: 'Pet Shampoo', quantity: 1, price: 20 },
      { name: 'Pet Toys Bundle', quantity: 1, price: 30 }
    ],
    totalAmount: 50,
    address: '456 Dog Avenue, NY',
    paymentMethod: 'Cash',
    notes: 'Call before delivery'
  }
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9 AM to 9 PM
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_WIDTH = SCREEN_WIDTH * 0.8;

export default function PartnerHomeScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleDays, setVisibleDays] = useState(14);
  const [baseDate] = useState(new Date());
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [hideEmptySlots, setHideEmptySlots] = useState(true);
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState({ services: [], products: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [providerId, setProviderId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const [selectedStaffFilter, setSelectedStaffFilter] = useState(null);

  useEffect(() => {
    loadProviderId();
    if (userRole === 'admin') {
      fetchStaffList();
    }
  }, [userRole]);

  useEffect(() => {
    if (providerId) {
      console.log('Fetching orders with selectedStaffFilter:', selectedStaffFilter); // Add debug log
      fetchOrders();
    }
  }, [providerId, selectedStaffFilter]);

  useEffect(() => {
    if (allOrders.services.length > 0 || allOrders.products.length > 0) {
      const selectedDateStr = formatDateForAPI(selectedDate);
      const selectedDateOrders = (activeTab === 'services' ? allOrders.services : allOrders.products)
        .filter(order => {
          console.log(`Order ID: ${order.id}, Scheduled At: ${order.scheduled_at}`);
          const orderDate = new Date(order.scheduled_at);
          // Get dates in local timezone
          const orderLocalDate = new Date(orderDate.getTime());
          const selectedLocalDate = new Date(selectedDate.getTime());
          
          // Compare dates in local timezone
          const orderDateStr = orderLocalDate.toLocaleDateString();
          const selectedDateStr = selectedLocalDate.toLocaleDateString();
          
          console.log(`Order ID: ${order.id}, Order Local Date: ${orderDateStr}, Selected Date: ${selectedDateStr}`);
          return orderDateStr === selectedDateStr;
        });
      setOrders(selectedDateOrders);
    }
  }, [selectedDate, activeTab, allOrders]);

  useEffect(() => {
    if (allOrders.services.length > 0 || allOrders.products.length > 0) {
      const pending = [...allOrders.services, ...allOrders.products].filter(
        order => order.status === 'PENDING'
      );
      setPendingOrders(pending);
      if (pending.length > 0 && !showPendingModal && userRole === 'admin') {
        setShowPendingModal(true);
        setSelectedPendingOrder(pending[0]);
      }
    }
  }, [allOrders, userRole]);

  const loadProviderId = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setProviderId(userData.provider_id);
        setUserRole(userData.role);
        setUserId(userData.id);
      }
    } catch (error) {
      console.error('Error loading provider ID:', error);
    }
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const fetchStaffList = async () => {
    try {
      setIsStaffLoading(true);
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStaffList(data.data.staff || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to fetch staff list'
        });
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch staff list'
      });
    } finally {
      setIsStaffLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      console.log('token', token);
      if (!token) {
        router.replace('/login');
        return;
      }

      // Calculate start and end dates based on the calendar range
      const startDate = formatDateForAPI(baseDate);
      const endDate = formatDateForAPI(getNextDays(baseDate, visibleDays)[visibleDays - 1]);

      // Build the API URL with query parameters
      let apiUrl = `${API_BASE_URL}/api/orders/provider`;
      const queryParams = [
        `provider_id=${providerId}`,
        `start_date=${startDate}`,
        `end_date=${endDate}`
      ];

      // Add staff filter based on role and selection
      if (userRole === 'staff' || userRole === 'driver') {
        // Staff and drivers can only see their own orders
        queryParams.push(`staff_id=${userId}`);
        queryParams.push('status=ACCEPTED', 'status=IN_PROGRESS', 'status=COMPLETED');
      } else if (userRole === 'admin' && selectedStaffFilter) {
        // Admin with staff filter selected
        console.log('Selected staff filter:', selectedStaffFilter); // Add debug log
        queryParams.push(`staff_id=${selectedStaffFilter.id}`);
        queryParams.push('status=COMPLETED', 'status=PENDING', 'status=IN_PROGRESS', 'status=ACCEPTED');
      } else if (userRole === 'admin') {
        // Admin without staff filter
        queryParams.push('status=COMPLETED', 'status=PENDING', 'status=IN_PROGRESS', 'status=ACCEPTED');
      }

      // Combine all query parameters
      apiUrl += `?${queryParams.join('&')}`;
      console.log('Fetching orders:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });

      const data = await response.json();
      if (data.success) {
        const allOrdersData = data.data.orders || [];
        // Separate orders by type
        const serviceOrders = allOrdersData.filter(order => order.order_type === 'service');
        const productOrders = allOrdersData.filter(order => order.order_type === 'product');
        
        setAllOrders({
          services: serviceOrders,
          products: productOrders
        });
        
        // Filter orders for the selected date
        const selectedDateOrders = allOrdersData.filter(order => {
          const orderDate = new Date(order.scheduled_at);
          const orderLocalDate = new Date(orderDate.getTime());
          const selectedLocalDate = new Date(selectedDate.getTime());
          
          const orderDateStr = orderLocalDate.toLocaleDateString();
          const selectedDateStr = selectedLocalDate.toLocaleDateString();
          
          return orderDateStr === selectedDateStr;
        });

        const filteredOrders = selectedDateOrders.filter(
          order => order.order_type === (activeTab === 'services' ? 'service' : 'product')
        );
        setOrders(filteredOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to fetch orders'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextDays = (startDate, count) => {
    const today = new Date(baseDate);
    const days = [];
    for (let i = 0; i < count; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      days.push(nextDate);
    }
    return days;
  };

  const getOrdersForTime = (time) => {
    return orders.filter(order => {
      const orderDate = new Date(order.scheduled_at);
      // Get hour in local time
      const localHour = orderDate.getHours();
      return localHour === time;
    });
  };

  const getOrdersForTimeRange = (hour) => {
    // Get orders that start in this hour
    const startingOrders = orders.filter(order => {
      const utcTime = new Date(order.scheduled_at);
      // Convert UTC to local time
      const localTime = new Date(utcTime.getTime() + utcTime.getTimezoneOffset() * 60000);
      return localTime.getHours() === hour;
    });

    // Get orders that span into this hour from previous hours
    const spanningOrders = orders.filter(order => {
      const utcTime = new Date(order.scheduled_at);
      // Convert UTC to local time
      const localTime = new Date(utcTime.getTime() + utcTime.getTimezoneOffset() * 60000);
      const localHour = localTime.getHours();
      const totalDuration = order.items.reduce((sum, item) => sum + (item.duration || 0), 0);
      const endHour = localHour + Math.ceil(totalDuration / 60);
      return localHour < hour && endHour > hour;
    });

    return [...startingOrders, ...spanningOrders];
  };

  const getOrderHeight = (order) => {
    const totalDuration = order.items.reduce((sum, item) => sum + (item.duration || 0), 0);
    const hourHeight = 80; // height of one hour slot
    return Math.max((totalDuration / 60) * hourHeight, 40); // Minimum height of 40
  };

  const getOrderPosition = (order) => {
    const utcTime = new Date(order.scheduled_at);
    // Convert UTC to local time
    const localTime = new Date(utcTime.getTime() + utcTime.getTimezoneOffset() * 60000);
    const orderMinutes = localTime.getMinutes();
    const hourHeight = 80; // height of one hour slot
    return (orderMinutes / 60) * hourHeight;
  };

  const getActiveHours = () => {
    return HOURS.filter(hour => getOrdersForTime(hour).length > 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#FFB74D';
      case 'ACCEPTED':
        return '#86A8E7';
      case 'IN_PROGRESS':
        return '#808080';  // Gray color for in-progress orders
      case 'COMPLETED':
        return '#96C93D';
      default:
        return '#666';
    }
  };

  const getDisplayedHours = () => {
    return HOURS;
  };

  const formatTime = (hour, minutes = '00') => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes}${period}`;
  };

  const renderTimeSlot = (hour) => {
    const orders = getOrdersForTimeRange(hour);
    const orderCount = orders.length;
    const orderWidth = orderCount > 1 ? (100 / orderCount) - 2 : 100; // 2% gap between orders

    return (
      <View key={hour} style={styles.timeSlot}>
        <View style={styles.timeLabel}>
          <Text style={styles.timeText}>{formatTime(hour)}</Text>
        </View>
        <View style={styles.orderSlots}>
          {orders.map((order, index) => {
            const utcTime = new Date(order.scheduled_at);
            // Convert UTC to local time
            const localTime = new Date(utcTime.getTime() + utcTime.getTimezoneOffset() * 60000);
            const orderHeight = getOrderHeight(order);
            const topPosition = getOrderPosition(order);
            const orderHour = localTime.getHours();
            const orderMinutes = localTime.getMinutes();
            const totalDuration = order.items.reduce((sum, item) => sum + (item.duration || 0), 0);
            const isShortDuration = totalDuration <= 30;
            
            if (orderHour === hour) {
              return (
                <TouchableOpacity 
                  key={order.id} 
                  style={[
                    styles.orderCard,
                    { 
                      backgroundColor: `${getStatusColor(order.status)}15`,
                      height: orderHeight,
                      top: topPosition,
                      position: 'absolute',
                      width: `${orderWidth}%`,
                      left: `${(index * (orderWidth + 2))}%`,
                      zIndex: 1
                    }
                  ]}
                  onPress={() => router.push({
                    pathname: '/order/[id]',
                    params: { id: order.id }
                  })}
                >
                  {isShortDuration ? (
                    <View style={styles.shortOrderContent}>
                      <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]} />
                      <Text style={styles.shortOrderTime}>
                        {formatTime(orderHour, orderMinutes.toString().padStart(2, '0'))}
                      </Text>
                      <Text style={[styles.providerName, { flex: 1 }]} numberOfLines={1}>
                        {order.provider_name}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.orderHeader}>
                        <View style={[styles.orderStatus, { backgroundColor: getStatusColor(order.status) }]} />
                        <Text style={styles.orderTime}>
                          {formatTime(orderHour, orderMinutes.toString().padStart(2, '0'))}
                        </Text>
                        <Text style={[styles.providerName, { flex: 1 }]} numberOfLines={1}>
                          {order.user_name}
                        </Text>
                        {order.order_type === 'service' && (
                          <Text style={styles.durationText}>{totalDuration}m</Text>
                        )}
                      </View>
                      <View style={styles.orderContent}>
                        <View style={styles.servicesList}>
                          {order.items.map((item, index) => (
                            <Text key={index} style={styles.serviceText} numberOfLines={1}>
                              • {item.name}
                            </Text>
                          ))}
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            }
            return null;
          })}
        </View>
      </View>
    );
  };

  const handleLogout = async () => {
    try {
      // Clear all authentication data
      await AsyncStorage.multiRemove([
        'token',
        'refresh_token',
        'user',
        'providerToken'
      ]);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: t.common.menu.logoutSuccess || 'Logged out successfully',
        visibilityTime: 2000,
      });
      
      // Close the menu
      setIsMenuVisible(false);
      
      // Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: t.common.menu.logoutError || 'Error logging out. Please try again.',
      });
    }
  };

  const renderMenu = () => (
    <ProfileMenu
      visible={isMenuVisible}
      onClose={() => setIsMenuVisible(false)}
      onLanguageChange={() => {}}
    />
  );

  const renderProductOrder = (order) => (
    <TouchableOpacity 
      key={order.id}
      style={styles.productOrderCard}
      onPress={() => router.push({
        pathname: '/order/[id]',
        params: { id: order.id }
      })}
    >
      <View style={styles.productOrderHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{order.user_name}</Text>
          <Text style={styles.orderTime}>
            {new Date(order.scheduled_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(order.status)}20` }
        ]}>
          <View style={[
            styles.statusDot,
            { backgroundColor: getStatusColor(order.status) }
          ]} />
          <Text style={[
            styles.statusText,
            { color: getStatusColor(order.status) }
          ]}>
            {order.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.itemLeftSection}>
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
            </View>
            <Text style={styles.priceText}>{item.price} SAR</Text>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalAmount}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{order.total_amount} SAR</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push({
            pathname: '/order/[id]',
            params: { id: order.id }
          })}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getOrdersCountForDate = (date) => {
    const ordersForType = activeTab === 'services' ? allOrders.services : allOrders.products;
    return ordersForType.filter(order => {
      const orderDate = new Date(order.scheduled_at);
      // Get dates in local timezone
      const orderLocalDate = new Date(orderDate.getTime());
      const selectedLocalDate = new Date(date.getTime());
      
      // Compare dates in local timezone
      const orderDateStr = orderLocalDate.toLocaleDateString();
      const selectedDateStr = selectedLocalDate.toLocaleDateString();
      
      return orderDateStr === selectedDateStr;
    }).length;
  };

  const handleAcceptButtonClick = async () => {
    console.log('Accept button clicked');
    console.log('Order type:', selectedPendingOrder?.order_type);

    // Check order type first
    if (selectedPendingOrder?.order_type === 'product') {
      console.log('Product order - directly accepting without staff');
      handleAcceptOrder();
      return;
    }

    // Only proceed with staff selection for service orders
    console.log('Service order - proceeding with staff selection');
    setIsStaffLoading(true);
    
    try {
      // Close the pending order modal first
      setShowPendingModal(false);
      
      await fetchStaffList();
      setShowStaffModal(true);
    } catch (error) {
      console.error('Error in handleAcceptButtonClick:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load staff list'
      });
      // If there's an error, show the pending modal again
      setShowPendingModal(true);
    } finally {
      setIsStaffLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    try {
      console.log('Accepting order:', selectedPendingOrder?.id);
      console.log('Order type:', selectedPendingOrder?.order_type);
      
      setIsLoading(true);
      const token = await ensureValidToken(language);
      if (!token) {
        router.replace('/login');
        return;
      }

      // For product orders, directly accept without staff
      if (selectedPendingOrder?.order_type === 'product') {
        console.log('Processing product order acceptance');
        const response = await fetch(`${API_BASE_URL}/api/orders/provider/${selectedPendingOrder.id}/status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': language,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            status: 'ACCEPTED'
          })
        });

        // Log the raw response for debugging
        const responseText = await response.text();
        console.log('Raw API Response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          throw new Error(`Invalid response from server: ${responseText}`);
        }

        if (data.success) {
          console.log('Product order accepted successfully');
          Toast.show({
            type: 'success',
            text1: 'Order Accepted',
            text2: 'Order has been accepted successfully',
            position: 'top',
            visibilityTime: 3000,
          });
          setPendingOrders(prev => prev.filter(order => order.id !== selectedPendingOrder.id));
          setShowPendingModal(false);
          fetchOrders();
        } else {
          console.error('Accept order API returned error:', data);
          Toast.show({
            type: 'error',
            text1: data.message || 'Failed to accept order'
          });
          setShowPendingModal(true);
        }
        return;
      }

      // For service orders, handle with staff selection
      console.log('Starting handleAcceptOrder with staffId:', selectedStaffMember?.id);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/provider/${selectedPendingOrder.id}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACCEPTED',
          staff_id: selectedStaffMember.id
        })
      });

      const data = await response.json();
      console.log('Accept service order API response:', data);

      if (data.success) {
        console.log('Service order accepted successfully');
        Toast.show({
          type: 'success',
          text1: 'Order accepted successfully'
        });
        setPendingOrders(prev => prev.filter(order => order.id !== selectedPendingOrder.id));
        setShowStaffModal(false);
        setSelectedStaffMember(null);
        fetchOrders();
      } else {
        console.error('Accept order API returned error:', data);
        Toast.show({
          type: 'error',
          text1: data.message || 'Failed to accept order'
        });
        setShowPendingModal(true);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to accept order',
        position: 'top',
        visibilityTime: 3000,
      });
      setShowPendingModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      const url = `${API_BASE_URL}/api/orders/provider/${selectedPendingOrder.id}/status`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'CANCELLED'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Order rejected successfully'
        });
        setPendingOrders(prev => prev.filter(order => order.id !== selectedPendingOrder.id));
        setShowPendingModal(false);
        fetchOrders();
      } else {
        Toast.show({
          type: 'error',
          text1: data.message || 'Failed to reject order'
        });
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to reject order'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPendingOrderModal = () => {
    // Only render for admin role
    if (userRole !== 'admin') return null;

    return (
      <Modal
        visible={showPendingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetIndicator} />
              <Text style={styles.modalTitle}>New Order Request</Text>
              <TouchableOpacity 
                onPress={() => setShowPendingModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPendingOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.orderTypeTag}>
                  <Ionicons 
                    name={selectedPendingOrder.order_type === 'service' ? 'cut' : 'cube'} 
                    size={16} 
                    color="#86A8E7" 
                  />
                  <Text style={styles.orderTypeText}>
                    {selectedPendingOrder.order_type === 'service' ? 'Service Order' : 'Product Order'}
                  </Text>
                </View>

                <View style={styles.customerSection}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.avatarText}>
                      {selectedPendingOrder.user_name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{selectedPendingOrder.user_name}</Text>
                    
                    <View style={styles.dateTimeContainer}>
                      <Ionicons 
                        name="calendar-outline" 
                        size={16} 
                        color="#666" 
                        style={styles.dateTimeIcon}
                      />
                      <Text style={styles.dateTimeText}>
                        {new Date(selectedPendingOrder.scheduled_at).toLocaleDateString(
                          language === 'ar' ? 'ar-SA' : 'en-US',
                          { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </Text>
                    </View>
                    
                    <View style={styles.dateTimeContainer}>
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color="#666" 
                        style={styles.dateTimeIcon}
                      />
                      <Text style={styles.dateTimeText}>
                        {new Date(selectedPendingOrder.scheduled_at).toLocaleTimeString(
                          language === 'ar' ? 'ar-SA' : 'en-US',
                          { hour: '2-digit', minute: '2-digit', hour12: true }
                        )}
                      </Text>
                    </View>

                    <View style={styles.locationContainer}>
                      <TouchableOpacity 
                        style={styles.goToLocationButton}
                        onPress={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${selectedPendingOrder.latitude},${selectedPendingOrder.longitude}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Ionicons name="location-outline" size={20} color="#fff" />
                        <Text style={styles.goToLocationText}>Go to Location</Text>
                        <View style={styles.locationArrow}>
                          <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.itemsCard}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  {selectedPendingOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {selectedPendingOrder.order_type === 'service' && (
                          <View style={styles.durationTag}>
                            <Ionicons name="time-outline" size={14} color="#86A8E7" />
                            <Text style={styles.durationText}>{item.duration} min</Text>
                          </View>
                        )}
                      </View>
                      {selectedPendingOrder.order_type === 'product' && (
                        <View style={styles.priceInfo}>
                          <Text style={styles.quantityText}>x{item.quantity}</Text>
                          <Text style={styles.priceText}>{item.price} SAR</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {selectedPendingOrder.notes && (
                  <View style={styles.notesCard}>
                    <Text style={styles.sectionTitle}>Customer Notes</Text>
                    <Text style={styles.notesText}>{selectedPendingOrder.notes}</Text>
                  </View>
                )}

                <View style={styles.totalCard}>
                  <Text style={styles.totalText}>Total Amount</Text>
                  <Text style={styles.totalAmount}>{selectedPendingOrder.total_amount} SAR</Text>
                </View>
              </ScrollView>
            )}

            <View style={styles.bottomSheetFooter}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectOrder}
              >
                <Ionicons name="close-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptButtonClick}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderStaffModal = () => (
    <Modal
      visible={showStaffModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowStaffModal(false);
        setSelectedStaffMember(null);
        setShowPendingModal(true);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.bottomSheetContent, { height: '50%' }]}>
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetIndicator} />
            <Text style={styles.modalTitle}>Select Staff Member</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowStaffModal(false);
                setSelectedStaffMember(null);
                setShowPendingModal(true);
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {isStaffLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#86A8E7" />
            </View>
          ) : (
            <>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.staffCard,
                    !selectedStaffFilter && styles.selectedStaffCard
                  ]}
                  onPress={() => {
                    console.log('Clearing staff filter'); // Add debug log
                    setSelectedStaffFilter(null);
                    setShowStaffFilter(false);
                  }}
                >
                  <View style={styles.staffAvatar}>
                    <Ionicons name="people" size={20} color="#fff" />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>All Staff</Text>
                    <Text style={styles.staffRole}>View all orders</Text>
                  </View>
                  {!selectedStaffFilter && (
                    <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
                  )}
                </TouchableOpacity>

                {staffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffCard,
                      selectedStaffFilter?.id === staff.id && styles.selectedStaffCard
                    ]}
                    onPress={() => {
                      console.log('Selecting staff:', staff); // Add debug log
                      setSelectedStaffFilter(staff);
                      setShowStaffFilter(false);
                    }}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.avatarText}>
                        {staff.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffRole}>{staff.role}</Text>
                    </View>
                    {selectedStaffFilter?.id === staff.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.bottomSheetFooter}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.acceptButton,
                    !selectedStaffFilter && styles.disabledButton
                  ]}
                  onPress={handleAcceptOrder}
                  disabled={!selectedStaffFilter}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Confirm Assignment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={[styles.headerMain, isRTL && styles.rtlRow]}>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
            {t?.partner?.schedule || 'Schedule'}
          </Text>
          <View style={styles.headerActions}>
            {userRole === 'admin' ? (
              <TouchableOpacity 
                style={styles.staffFilterButton}
                onPress={() => setShowStaffFilter(true)}
              >
                <Ionicons name="people" size={20} color="#86A8E7" />
                <Text style={styles.staffFilterText}>
                  {selectedStaffFilter ? selectedStaffFilter.name : 'All Staff'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#86A8E7" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={() => setSelectedDate(new Date())}
              >
                <Text style={styles.todayButtonText}>
                  {t?.common?.today || 'Today'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setIsMenuVisible(true)}
            >
              <Ionicons name="menu-outline" size={24} color="#86A8E7" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
                Services
              </Text>
              {allOrders.services.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {allOrders.services.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.activeTab]}
            onPress={() => setActiveTab('products')}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
                Products
              </Text>
              {allOrders.products.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {allOrders.products.length}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'services' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.daysScroll, isRTL && styles.rtlRow]}
          >
            {getNextDays(baseDate, visibleDays).map((date, index) => {
              const formattedDate = formatDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    isToday && styles.todayDayButton,
                    isSelected && !isToday && styles.selectedDayButton
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayName, 
                    (isToday || isSelected) && styles.selectedText
                  ]}>
                    {formattedDate.day}
                  </Text>
                  <Text style={[
                    styles.dayDate, 
                    (isToday || isSelected) && styles.selectedText
                  ]}>
                    {formattedDate.date}
                  </Text>
                  <Text style={[
                    styles.monthName, 
                    (isToday || isSelected) && styles.selectedText
                  ]}>
                    {formattedDate.month}
                  </Text>
                  {getOrdersCountForDate(date) > 0 && (
                    <View style={[
                      styles.dayBadge,
                      (isToday || isSelected) && styles.selectedDayBadge
                    ]}>
                      <Text style={[
                        styles.dayBadgeText,
                        (isToday || isSelected) && styles.selectedDayBadgeText
                      ]}>
                        {getOrdersCountForDate(date)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {renderMenu()}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#86A8E7" />
        </View>
      ) : activeTab === 'services' ? (
        <ScrollView style={styles.content}>
          {HOURS.map(hour => renderTimeSlot(hour))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.productOrdersContainer}>
          {orders.map(order => (
            <TouchableOpacity 
              key={order.id}
              style={styles.productOrderCard}
              onPress={() => router.push({
                pathname: '/order/[id]',
                params: { id: order.id }
              })}
            >
              <View style={styles.productOrderHeader}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{order.user_name}</Text>
                  <Text style={styles.orderTime}>
                    {new Date(order.scheduled_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(order.status)}20` }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(order.status) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor(order.status) }
                  ]}>
                    {order.status}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.itemLeftSection}>
                      <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>x{item.quantity}</Text>
                      </View>
                      <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                    <Text style={styles.priceText}>{item.price} SAR</Text>
                  </View>
                ))}
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.totalAmount}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>{order.total_amount} SAR</Text>
                </View>
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => router.push({
                    pathname: '/order/[id]',
                    params: { id: order.id }
                  })}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Only show notification button for admin users */}
      {userRole === 'admin' && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            if (pendingOrders.length > 0) {
              setSelectedPendingOrder(pendingOrders[0]);
              setShowPendingModal(true);
            }
          }}
        >
          <LinearGradient
            colors={pendingOrders.length > 0 ? ['#FFB74D', '#FF9800'] : ['#86A8E7', '#7F7FD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons 
              name={pendingOrders.length > 0 ? "notifications" : "notifications-outline"} 
              size={24} 
              color="#fff" 
            />
          </LinearGradient>
          {pendingOrders.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Only render pending order modal for admin */}
      {userRole === 'admin' && renderPendingOrderModal()}
      {renderStaffModal()}

      {/* Staff Filter Modal */}
      <Modal
        visible={showStaffFilter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStaffFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheetContent, { height: '50%' }]}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetIndicator} />
              <Text style={styles.modalTitle}>Select Staff Member</Text>
              <TouchableOpacity 
                onPress={() => setShowStaffFilter(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {isStaffLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#86A8E7" />
              </View>
            ) : (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.staffCard,
                    !selectedStaffFilter && styles.selectedStaffCard
                  ]}
                  onPress={() => {
                    console.log('Clearing staff filter'); // Add debug log
                    setSelectedStaffFilter(null);
                    setShowStaffFilter(false);
                  }}
                >
                  <View style={styles.staffAvatar}>
                    <Ionicons name="people" size={20} color="#fff" />
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>All Staff</Text>
                    <Text style={styles.staffRole}>View all orders</Text>
                  </View>
                  {!selectedStaffFilter && (
                    <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
                  )}
                </TouchableOpacity>

                {staffList.map((staff) => (
                  <TouchableOpacity
                    key={staff.id}
                    style={[
                      styles.staffCard,
                      selectedStaffFilter?.id === staff.id && styles.selectedStaffCard
                    ]}
                    onPress={() => {
                      console.log('Selecting staff:', staff); // Add debug log
                      setSelectedStaffFilter(staff);
                      setShowStaffFilter(false);
                    }}
                  >
                    <View style={styles.staffAvatar}>
                      <Text style={styles.avatarText}>
                        {staff.name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staff.name}</Text>
                      <Text style={styles.staffRole}>{staff.role}</Text>
                    </View>
                    {selectedStaffFilter?.id === staff.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
  },
  todayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '600',
  },
  daysScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
    position: 'relative',
  },
  todayDayButton: {
    backgroundColor: '#86A8E7',
  },
  dayName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 2,
  },
  monthName: {
    fontSize: 12,
    color: '#666',
  },
  todayText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  timeSlot: {
    flexDirection: 'row',
    height: 80, // Fixed height for time slots
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeLabel: {
    width: 80,
    paddingTop: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  orderSlots: {
    flex: 1,
    position: 'relative', // For absolute positioning of orders
    paddingHorizontal: 8,
  },
  orderCard: {
    padding: 6,
    borderRadius: 8,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minWidth: 120, // Ensure minimum width for readability
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    flexWrap: 'nowrap',
    minWidth: 0, // Allow text to shrink
  },
  orderStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  orderTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A363B',
    flexShrink: 0, // Prevent time from shrinking
  },
  providerName: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1, // Allow name to shrink if needed
  },
  durationText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    flexShrink: 0, // Prevent duration from shrinking
  },
  servicesList: {
    gap: 2,
    flexShrink: 1, // Allow services list to shrink
  },
  serviceText: {
    fontSize: 11,
    color: '#666',
    paddingRight: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  selectedDayButton: {
    backgroundColor: '#7F7FD5',
  },
  selectedText: {
    color: '#fff',
  },
  shortOrderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'nowrap',
    minWidth: 0, // Allow text to shrink
  },
  shortOrderTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A363B',
    width: 70,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuContent: {
    backgroundColor: '#fff',
    marginTop: 60,
    marginRight: 16,
    marginLeft: 'auto',
    padding: 16,
    borderRadius: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2A363B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#86A8E7',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF6B6B',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productOrdersContainer: {
    flex: 1,
    padding: 16,
  },
  productOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderItems: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    paddingVertical: 12,
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  quantityBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 35,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 13,
    color: '#86A8E7',
    fontWeight: '600',
  },
  itemName: {
    fontSize: 14,
    color: '#2A363B',
    flex: 1,
  },
  priceText: {
    fontSize: 15,
    color: '#86A8E7',
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
  },
  viewButton: {
    backgroundColor: '#86A8E7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  selectedDayBadge: {
    backgroundColor: '#fff',
  },
  dayBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  selectedDayBadgeText: {
    color: '#86A8E7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(134,168,231,0.12)',
    position: 'relative',
  },
  bottomSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  orderTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  orderTypeText: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '600',
    marginLeft: 6,
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#86A8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeIcon: {
    marginRight: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
  },
  locationContainer: {
    marginTop: 12,
  },
  goToLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#86A8E7',
    justifyContent: 'center',
    shadowColor: '#86A8E7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  goToLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  locationArrow: {
    marginLeft: 8,
  },
  itemsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemInfo: {
    flex: 1,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  notesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  totalCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  totalText: {
    fontSize: 16,
    color: '#2A363B',
    fontWeight: '600',
  },
  bottomSheetFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#86A8E7',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.12)',
  },
  selectedStaffCard: {
    backgroundColor: 'rgba(134,168,231,0.1)',
    borderColor: '#86A8E7',
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#86A8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A363B',
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 14,
    color: '#666',
  },
  staffFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  staffFilterText: {
    fontSize: 16,
    color: '#86A8E7',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
}); 