import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;

const QUICK_AMOUNTS = [50, 100, 200, 500];
const PAYMENT_METHODS = [
  { id: 'apple', name: 'Apple Pay', icon: 'logo-apple', color: '#000' },
  { id: 'card', name: 'Credit Card', icon: 'card-outline', color: '#86A8E7' },
  { id: 'mada', name: 'Mada', icon: 'card-outline', color: '#00ADB5' },
  { id: 'stc', name: 'STC Pay', icon: 'phone-portrait-outline', color: '#4C3494' },
];

export default function TopUpSheet({ visible, onClose, onTopUp }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
      }).start();
      // Reset state when closing
      setStep(1);
      setAmount('');
      setSelectedMethod(null);
    }
  }, [visible]);

  const handleContinue = () => {
    if (step === 1 && amount) {
      setStep(2);
    } else if (step === 2 && selectedMethod) {
      onTopUp({ amount: parseFloat(amount), method: selectedMethod });
      onClose();
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.subtitle}>Enter amount to top up</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>SAR</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0.00"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((quickAmount) => (
          <TouchableOpacity
            key={quickAmount}
            style={[
              styles.quickAmountButton,
              amount === quickAmount.toString() && styles.quickAmountButtonSelected
            ]}
            onPress={() => setAmount(quickAmount.toString())}
          >
            <Text style={[
              styles.quickAmountText,
              amount === quickAmount.toString() && styles.quickAmountTextSelected
            ]}>
              {quickAmount} SAR
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.subtitle}>Select payment method</Text>
      <View style={styles.paymentMethods}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              selectedMethod?.id === method.id && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedMethod(method)}
          >
            <View style={[styles.methodIcon, { backgroundColor: `${method.color}15` }]}>
              <Ionicons name={method.icon} size={24} color={method.color} />
            </View>
            <Text style={styles.methodName}>{method.name}</Text>
            {selectedMethod?.id === method.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Amount to Top Up</Text>
        <Text style={styles.summaryAmount}>{amount} SAR</Text>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom,
          }
        ]}
      >
        <LinearGradient
          colors={['#fff', '#f8f9fa']}
          style={styles.content}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => step === 1 ? onClose() : setStep(1)}
            >
              <Ionicons 
                name={step === 1 ? "close" : "arrow-back"} 
                size={24} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={styles.title}>Top Up Wallet</Text>
            <View style={styles.steps}>
              <View style={[styles.step, step >= 1 && styles.stepActive]} />
              <View style={[styles.step, step >= 2 && styles.stepActive]} />
            </View>
          </View>

          {step === 1 ? renderStep1() : renderStep2()}

          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!amount || (step === 2 && !selectedMethod)) && styles.continueButtonDisabled
            ]} 
            onPress={handleContinue}
            disabled={!amount || (step === 2 && !selectedMethod)}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.continueButtonText}>
                {step === 1 ? 'Continue' : 'Confirm Payment'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A363B',
    marginTop: 8,
  },
  steps: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  step: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  stepActive: {
    backgroundColor: '#86A8E7',
  },
  stepContainer: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A363B',
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2A363B',
    minWidth: 120,
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickAmountButtonSelected: {
    backgroundColor: '#86A8E715',
    borderWidth: 2,
    borderColor: '#86A8E7',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  quickAmountTextSelected: {
    color: '#86A8E7',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paymentMethodSelected: {
    backgroundColor: '#86A8E715',
    borderColor: '#86A8E7',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    flex: 1,
  },
  checkmark: {
    marginLeft: 12,
  },
  summary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
  },
  continueButton: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 