import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  Animated,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from './context/LanguageContext';

const MOCK_ORDERS = [
  {
    id: '1',
    customerName: 'Ahmed Mohammed',
    customerPhone: '+966 50 123 4567',
    services: [
      { name: 'Full Grooming', price: 65 },
      { name: 'Nail Care', price: 20 }
    ],
    total: 85,
    date: '2024-03-25',
    timeSlot: '14:00 - 16:00',
    location: 'At Home',
    address: 'Al Olaya District, Street 15, House 23',
    status: 'pending',
    notes: 'Please bring hypoallergenic shampoo',
    petInfo: {
      name: 'Max',
      type: 'Dog',
      breed: 'Golden Retriever'
    }
  },
  // Add more mock orders...
];

export default function OrderRequestsScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [orders, setOrders] = React.useState(MOCK_ORDERS);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAccept = (orderId) => {
    Alert.alert(
      t.provider.orders.acceptTitle,
      t.provider.orders.acceptMessage,
      [
        {
          text: t.common.cancel,
          style: 'cancel'
        },
        {
          text: t.common.confirm,
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'accepted' }
                  : order
              )
            );
          }
        }
      ]
    );
  };

  const handleReject = (orderId) => {
    Alert.alert(
      t.provider.orders.rejectTitle,
      t.provider.orders.rejectMessage,
      [
        {
          text: t.common.cancel,
          style: 'cancel'
        },
        {
          text: t.common.confirm,
          style: 'destructive',
          onPress: () => {
            setOrders(prev => 
              prev.map(order => 
                order.id === orderId 
                  ? { ...order, status: 'rejected' }
                  : order
              )
            );
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'accepted':
        return '#4CAF50';
      case 'rejected':
        return '#FF6B6B';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return t.provider.orders.status.pending;
      case 'accepted':
        return t.provider.orders.status.accepted;
      case 'rejected':
        return t.provider.orders.status.rejected;
      default:
        return status;
    }
  };

  const renderOrderCard = (order) => {
    const statusColor = getStatusColor(order.status);

    return (
      <Animated.View 
        key={order.id}
        style={[
          styles.orderCard,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.customerInfo, isRTL && styles.rtlRow]}>
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="person" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.customerDetails}>
              <Text style={[styles.customerName, isRTL && styles.rtlText]}>
                {order.customerName}
              </Text>
              <Text style={[styles.customerPhone, isRTL && styles.rtlText]}>
                {order.customerPhone}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={[styles.detailText, isRTL && styles.rtlText]}>
              {order.date}
            </Text>
          </View>
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={[styles.detailText, isRTL && styles.rtlText]}>
              {order.timeSlot}
            </Text>
          </View>
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={[styles.detailText, isRTL && styles.rtlText]}>
              {order.location} - {order.address}
            </Text>
          </View>
        </View>

        <View style={styles.petInfo}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t.provider.orders.petInfo}
          </Text>
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Ionicons name="paw-outline" size={20} color="#666" />
            <Text style={[styles.detailText, isRTL && styles.rtlText]}>
              {order.petInfo.name} - {order.petInfo.breed}
            </Text>
          </View>
        </View>

        <View style={styles.services}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t.provider.orders.services}
          </Text>
          {order.services.map((service, index) => (
            <View key={index} style={[styles.serviceRow, isRTL && styles.rtlRow]}>
              <Text style={[styles.serviceName, isRTL && styles.rtlText]}>
                {service.name}
              </Text>
              <Text style={styles.servicePrice}>
                SAR {service.price}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, isRTL && styles.rtlText]}>
              {t.provider.orders.total}
            </Text>
            <Text style={styles.totalAmount}>
              SAR {order.total}
            </Text>
          </View>
        </View>

        {order.status === 'pending' && (
          <View style={[styles.actions, isRTL && styles.rtlRow]}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(order.id)}
            >
              <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                {t.provider.orders.reject}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(order.id)}
            >
              <LinearGradient
                colors={['#86A8E7', '#7F7FD5']}
                style={styles.gradient}
              >
                <Text style={styles.actionButtonText}>
                  {t.provider.orders.accept}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"}
            size={24} 
            color="#86A8E7" 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
          {t.provider.orders.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {orders.map(renderOrderCard)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerDetails: {
    gap: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
    fontSize: 14,
    fontWeight: '600',
  },
  orderDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#2A363B',
  },
  petInfo: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  services: {
    gap: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  serviceName: {
    fontSize: 15,
    color: '#2A363B',
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#86A8E7',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#86A8E7',
  },
  notes: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE3E3',
  },
  notesText: {
    fontSize: 14,
    color: '#FF6B6B',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rejectButton: {
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  rejectButtonText: {
    color: '#FF6B6B',
  },
  acceptButton: {
    backgroundColor: '#86A8E7',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});

// Update the status text colors
const getStatusStyle = (status) => {
  switch (status) {
    case 'pending':
      return { color: '#FFB347' };
    case 'accepted':
      return { color: '#4ECDC4' };
    case 'rejected':
      return { color: '#FF6B6B' };
    default:
      return {};
  }
}; 