import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function PaymentSheet({ visible, onClose, onPaymentComplete, totalAmount }) {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.handle} />
              <Text style={styles.title}>Payment Method</Text>
              
              <View style={styles.paymentOptions}>
                <TouchableOpacity 
                  style={styles.applePayButton}
                  onPress={() => {
                    onPaymentComplete();
                    onClose();
                  }}
                >
                  <Ionicons name="logo-apple" size={24} color="#fff" />
                  <Text style={styles.applePayText}>Pay</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or pay with card</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity style={styles.cardButton}>
                  <Ionicons name="card-outline" size={24} color="#86A8E7" />
                  <Text style={styles.cardButtonText}>Add Card</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Amount</Text>
                  <Text style={styles.summaryValue}>{totalAmount} SAR</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 24,
  },
  paymentOptions: {
    gap: 16,
  },
  applePayButton: {
    height: 56,
    backgroundColor: '#000',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applePayText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
  },
  cardButton: {
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
  },
  summary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
  },
}); 