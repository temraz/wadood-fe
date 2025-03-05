import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  I18nManager,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from './context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrdersScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({
    active: 0,
    completed: 0,
    total: 0
  });

  const fetchOrders = async (status = selectedStatus, pageNum = 1, shouldRefresh = false) => {
    try {
      if (!shouldRefresh && isLoading) return;
      
      if (shouldRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const token = await ensureValidToken(language);
      // let url = `${API_BASE_URL}/api/orders/active?page=${pageNum}&limit=10`;
      let url = ``;
      if (status == 'active') {
        url = `${API_BASE_URL}/api/orders/active?page=${pageNum}&limit=10`;
      }else if (status == 'completed') {
        url = `${API_BASE_URL}/api/orders?status=COMPLETED&page=${pageNum}&limit=10`;
      }
      else if (status == 'all') {
        url = `${API_BASE_URL}/api/orders?page=${pageNum}&limit=10`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });

      const data = await response.json();
      
      if (data.success) {
        if (shouldRefresh || pageNum === 1) {
          setOrders(data.data.orders);
        } else {
          setOrders(prev => [...prev, ...data.data.orders]);
        }
        setPage(data.data.page);
        setTotalPages(data.data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const token = await ensureValidToken(language);
      const statuses = ['active', 'completed','all'];
      const counts = {};

      // Fetch counts for active and completed orders
      await Promise.all(
        statuses.map(async (status) => {
          let url = ``;
          if (status == 'active') {
            url = `${API_BASE_URL}/api/orders/active`;
          }else if (status == 'completed') {
            url = `${API_BASE_URL}/api/orders?status=COMPLETED`;
          }
          else if (status == 'all') {
            url = `${API_BASE_URL}/api/orders`;
          }
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept-Language': language
            }
          });

          const data = await response.json();
          counts[status] = data.data.total || 0;
        })
      );

      // Fetch total count of all orders
      const totalResponse = await fetch(`${API_BASE_URL}/api/orders?page=1&limit=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      const totalData = await totalResponse.json();
      counts.total = totalData.data.total || 0;

      setCounts(counts);
      
      // Update the active orders count in AsyncStorage
      await AsyncStorage.setItem('activeOrdersCount', String(counts.active));
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [selectedStatus]);

  const handleRefresh = () => {
    setPage(1);
    fetchOrders(selectedStatus, 1, true);
    fetchCounts();
  };

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchOrders(selectedStatus, page + 1);
    }
  };

  const getStatusInfo = (status) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return {
          color: '#FFA000',
          icon: 'time',
          label: t.search.orders.status.pending
        };
      case 'CONFIRMED':
        return {
          color: '#5B8EDC',
          icon: 'checkmark-circle',
          label: t.search.orders.status.confirmed
        };
      case 'ACCEPTED':
        return {
          color: '#5B8EDC',
          icon: 'checkmark-circle',
          label: t.search.orders.status.accepted
        };
      case 'IN_PROGRESS':
        return {
          color: '#78909C',
          icon: 'time',
          label: t.search.orders.status.in_progress
        };
      case 'COMPLETED':
        return {
          color: '#4CAF50',
          icon: 'checkmark-done-circle',
          label: t.search.orders.status.completed
        };
      case 'CANCELLED':
        return {
          color: '#FF6B6B',
          icon: 'close-circle',
          label: t.search.orders.status.cancelled
        };
      default:
        return {
          color: '#666',
          icon: 'ellipse',
          label: status
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={80} color="#e0e0e0" />
      <Text style={styles.emptyStateTitle}>No Orders Found</Text>
      <Text style={styles.emptyStateText}>
        {selectedStatus === 'active' 
          ? "You don't have any active orders at the moment"
          : selectedStatus === 'completed'
          ? "You haven't completed any orders yet"
          : "You haven't placed any orders yet"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={[styles.headerTop]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={24} color="#86A8E7" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle]}>{t.search.orders.title}</Text>
          </View>
          
          <View style={styles.orderStats}>
            <TouchableOpacity 
              style={[
                styles.statItem,
                selectedStatus === 'active' && styles.statItemSelected
              ]}
              onPress={() => setSelectedStatus('active')}
            >
              <Text style={styles.statNumber}>{counts.active}</Text>
              <Text style={styles.statLabel}>{t.search.orders.stats.active}</Text>
              {selectedStatus === 'active' && (
                <View style={styles.statSelectedIndicator} />
              )}
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={[
                styles.statItem,
                selectedStatus === 'completed' && styles.statItemSelected
              ]}
              onPress={() => setSelectedStatus('completed')}
            >
              <Text style={styles.statNumber}>{counts.completed}</Text>
              <Text style={styles.statLabel}>{t.search.orders.stats.completed}</Text>
              {selectedStatus === 'completed' && (
                <View style={styles.statSelectedIndicator} />
              )}
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity 
              style={[
                styles.statItem,
                selectedStatus === 'all' && styles.statItemSelected
              ]}
              onPress={() => setSelectedStatus('all')}
            >
              <Text style={styles.statNumber}>{counts.total}</Text>
              <Text style={styles.statLabel}>{t.search.orders.all}</Text>
              {selectedStatus === 'all' && (
                <View style={styles.statSelectedIndicator} />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#86A8E7']}
            tintColor="#86A8E7"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isEndReached = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          if (isEndReached) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {!isLoading && orders.length === 0 ? (
          renderEmptyState()
        ) : (
          orders.map(order => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <TouchableOpacity 
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order.id}`)}
              >
                <View style={[styles.orderHeader, isRTL && styles.orderHeaderRTL]}>
                  <View style={[styles.providerSection, isRTL && styles.providerSectionRTL]}>
                    <View style={[styles.providerInfo, isRTL && styles.providerInfoRTL]}>
                      <Text style={[styles.providerName, isRTL && styles.rtlText]}>
                        {order.provider_name}
                      </Text>
                      <Text style={[styles.orderNumber, isRTL && styles.rtlText]}>
                        {isRTL ? `${order.id}# طلب` : `Order #${order.id}`}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: `${statusInfo.color}15` }                   
                    ]}>
                      <Ionicons 
                        name={statusInfo.icon} 
                        size={16} 
                        color={statusInfo.color} 
                        style={[styles.statusIcon]}
                      />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.orderMeta]}>
                    <Text style={[styles.orderDate]}>
                      <Ionicons name="calendar-outline" size={14} style={isRTL && { marginLeft: 4 }} /> {formatDate(order.created_at)}
                    </Text>
                    <Text style={[styles.orderTime]}>
                      <Ionicons name="time-outline" size={14} style={isRTL && { marginLeft: 4 }} /> {formatTime(order.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.servicesContainer]}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <View key={index} style={[styles.serviceRow]}>
                        <Text style={[styles.serviceItem]}>
                          {isRTL ? `${item.name || 'Item'} •` : '• ' + (item.name || 'Item')}
                        </Text>
                        <Text style={[styles.servicePrice]}>
                          {isRTL ? `ريال ${item.price}` : `${item.price} SAR`}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={[styles.serviceRow]}>
                      <Text style={[styles.serviceItem, { color: '#666' }]}>
                        {isRTL ? 'لا توجد خدمات' : 'No services'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.orderFooter]}>
                  <View style={[styles.locationContainer]}>
                    <Ionicons 
                      name="location-outline" 
                      size={16} 
                      color="#666" 
                      style={isRTL && { marginLeft: 4 }}
                    />
                    <Text 
                      style={[styles.locationText]} 
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {order.address}
                    </Text>
                  </View>
                  <Text style={[styles.price]}>
                    {order.total_amount} {isRTL ? 'ريال' : 'SAR'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {isLoading && !isRefreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#86A8E7" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 200,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  orderStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 8,
  },
  statItemSelected: {
    transform: [{ scale: 1.05 }],
  },
  statSelectedIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 20,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    marginBottom: 16,
  },
  orderHeaderRTL: {
    flexDirection: 'column',
  },
  providerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  providerSectionRTL: {
    flexDirection: 'row-reverse',
  },
  providerInfo: {
    flex: 1,
    marginRight: 12,
  },
  providerInfoRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeRTL: {
    flexDirection: 'row-reverse',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusIconRTL: {
    marginRight: 0,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  orderMetaRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  servicesContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  servicesContainerRTL: {
    alignItems: 'stretch',
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
    width: '100%',
  },
  serviceRowRTL: {
    flexDirection: 'row-reverse',
  },
  serviceItem: {
    flex: 1,
    fontSize: 15,
    color: '#2A363B',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  servicePrice: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    width: 80,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
    flexShrink: 0,
  },
  headerTopRTL: {
    flexDirection: 'row-reverse',
  },
 
  rtlText: {
    textAlign: 'right',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
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
    lineHeight: 20,
  },
}); 