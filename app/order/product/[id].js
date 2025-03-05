import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Mock data - in real app, fetch based on ID
const ORDER = {
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
  notes: 'Please deliver in the morning',
  phone: '+1234567890'
};

export default function ProductOrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleCall = () => {
    Linking.openURL(`tel:${ORDER.phone}`);
  };

  const handleOpenMaps = () => {
    const encodedAddress = encodeURIComponent(ORDER.address);
    Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
  };

  const handleAccept = async () => {
    setIsLoading(true);
    // Add your accept logic here
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1000);
  };

  const handleReject = async () => {
    setIsLoading(true);
    // Add your reject logic here
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#2A363B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.orderStatus}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: ORDER.status === 'pending' ? '#FFB74D20' : '#4CAF5020' }
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: ORDER.status === 'pending' ? '#FFB74D' : '#4CAF50' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: ORDER.status === 'pending' ? '#FFB74D' : '#4CAF50' }
              ]}>
                {ORDER.status === 'pending' ? 'Pending' : 'Accepted'}
              </Text>
            </View>
            <Text style={styles.orderDate}>
              {ORDER.orderDate} at {ORDER.orderTime}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person" size={20} color="#86A8E7" /> Customer Details
          </Text>
          <View style={styles.card}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{ORDER.customerName}</Text>
              <TouchableOpacity 
                style={styles.phoneButton}
                onPress={handleCall}
              >
                <Ionicons name="call" size={16} color="#86A8E7" />
                <Text style={styles.phoneText}>{ORDER.phone}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.addressButton}
              onPress={handleOpenMaps}
            >
              <Ionicons name="location" size={16} color="#86A8E7" />
              <Text style={styles.addressText}>{ORDER.address}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cart" size={20} color="#86A8E7" /> Order Items
          </Text>
          <View style={styles.card}>
            {ORDER.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${item.price * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>${ORDER.totalAmount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="card" size={20} color="#86A8E7" /> Payment Details
          </Text>
          <View style={styles.card}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentLabel}>Method</Text>
              <Text style={styles.paymentValue}>{ORDER.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {ORDER.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={20} color="#86A8E7" /> Notes
            </Text>
            <View style={styles.card}>
              <Text style={styles.notes}>{ORDER.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {ORDER.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
            disabled={isLoading}
          >
            <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
              Reject Order
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
            disabled={isLoading}
          >
            <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
              Accept Order
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  orderStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneText: {
    fontSize: 14,
    color: '#86A8E7',
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#86A8E7',
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#2A363B',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A363B',
  },
  totalSection: {
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
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#86A8E7',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#2A363B',
    fontWeight: '500',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B20',
  },
  rejectButtonText: {
    color: '#FF6B6B',
  },
  acceptButton: {
    backgroundColor: '#86A8E7',
  },
  acceptButtonText: {
    color: '#fff',
  },
}); 