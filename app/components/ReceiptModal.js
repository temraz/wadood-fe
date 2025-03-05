import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#86A8E7',
  secondary: '#7F7FD5',
  text: '#2A363B',
  textLight: '#666666',
  border: 'rgba(134,168,231,0.12)',
  background: '#F7F9FC',
  card: 'rgba(255,255,255,0.95)',
};

export default function ReceiptModal({ visible, onClose, order }) {
  if (!order) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView intensity={90} tint="light" style={styles.receiptCard}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Receipt</Text>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Logo and Business Info */}
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>PetMe</Text>
              <Text style={styles.orderNumber}>Order #{order.id}</Text>
              <Text style={styles.date}>{formatDate(order.created_at)}</Text>
            </View>

            <View style={styles.divider} />

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <Text style={styles.customerName}>{order.user_name}</Text>
              {order.address && (
                <Text style={styles.address}>{order.address}</Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>SAR {item.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            {/* Payment Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Subtotal</Text>
                <Text style={styles.paymentValue}>SAR {order.total_amount}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment Method</Text>
                <Text style={styles.paymentValue}>{order.payment_method}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Status</Text>
                <Text style={[styles.paymentValue, styles.statusText]}>
                  {order.payment_status}
                </Text>
              </View>
            </View>

            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.totalContainer}
            >
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>SAR {order.total_amount}</Text>
            </LinearGradient>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for your business!</Text>
              <Text style={styles.footerSubtext}>
                For any questions, please contact support
              </Text>
            </View>
          </ScrollView>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptCard: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  businessInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: COLORS.text,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  paymentValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  statusText: {
    color: '#4CAF50',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  totalLabel: {
    fontSize: 18,
    color: '#fff',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
}); 