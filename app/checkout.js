import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  I18nManager,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import AddressSheet from './components/AddressSheet';
import Toast, { BaseToast } from 'react-native-toast-message';
import { useCart } from './context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const toastConfig = {
  error: ({ text1, text2, props }) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8787']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastContent}>
          <View style={styles.toastIcon}>
            <Ionicons name={props?.icon || 'alert-circle'} size={24} color="#fff" />
          </View>
          <View style={styles.toastTexts}>
            <Text style={styles.toastTitle}>{text1}</Text>
            <Text style={styles.toastMessage}>{text2}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  ),
  success: ({ text1, text2, props }) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toastGradient}
      >
        <View style={styles.toastContent}>
          <View style={styles.toastIcon}>
            <Ionicons name={props?.icon || 'checkmark-circle'} size={24} color="#fff" />
          </View>
          <View style={styles.toastTexts}>
            <Text style={styles.toastTitle}>{text1}</Text>
            <Text style={styles.toastMessage}>{text2}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
};

export default function CheckoutScreen() {
  const { cart_id, provider_id } = useLocalSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const [cartData, setCartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const DELIVERY_FEE = 20;

  useEffect(() => {
    fetchCartDetails();
  }, [cart_id, provider_id]);

  const fetchCartDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await ensureValidToken(language);
      console.log('Fetching cart details with provider_id:', provider_id, 'cart_id:', cart_id);
      
      if (!provider_id || !cart_id) {
        setError('Missing required parameters');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart?provider_id=${provider_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Cart details response:', data);
      
      if (data.success && data.cart) {
        // Verify that the cart ID matches the one we're expecting
        if (data.cart.id.toString() === cart_id) {
          setCartData(data.cart);
        } else {
          setError('Cart ID mismatch');
        }
      } else {
        setError(data.message || 'Failed to fetch cart details');
      }
    } catch (error) {
      console.error('Error fetching cart details:', error);
      setError('An error occurred while fetching cart details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (address) => {
    setSelectedAddress(address);
    setShowAddressSheet(false);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Toast.show({
        type: 'error',
        text1: 'Address Required',
        text2: 'Please select a delivery address to continue',
        position: 'top',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
        props: {
          icon: 'location-outline'
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Required',
          text2: 'Please login to continue',
          position: 'top'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': language
        },
        body: JSON.stringify({
          cart_id: parseInt(cart_id),
          address_id: selectedAddress.id,
          payment_method: 'cash'
        })
      });

      const data = await response.json();
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Order Placed Successfully',
          text2: data.message || 'Your order has been placed successfully',
          position: 'top',
          visibilityTime: 2000,
        });
        
        // Wait for toast to be visible, then close checkout and cart pages
        setTimeout(async () => {
          // Fetch active orders to update the badge count
          try {
            const token = await ensureValidToken(language);
            const ordersResponse = await fetch(`${API_BASE_URL}/api/orders/active`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Language': language,
                'Accept': 'application/json'
              }
            });
            
            const ordersData = await ordersResponse.json();
            if (ordersData.success) {
              // Store the active orders count in AsyncStorage for persistence
              await AsyncStorage.setItem('activeOrdersCount', String(ordersData.orders.length));
            }
          } catch (error) {
            console.error('Error fetching active orders:', error);
          }

          router.back();
          router.back();
          router.back();
        }, 1000);
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Place order error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to place order. Please try again.',
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSubtotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = (subtotal) => {
    return subtotal + DELIVERY_FEE;
  };

  if (!cartData || !cartData.items || cartData.items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"} 
              size={24} 
              color="#2A363B" 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t?.checkout?.title || 'Checkout'}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyStateContainer}>
          <Ionicons name="cart-outline" size={64} color="#86A8E7" />
          <Text style={styles.emptyStateTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyStateMessage}>Add some items to your cart to checkout</Text>
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t.common.goBack}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color="#2A363B" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t?.checkout?.title || 'Checkout'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cartData && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cart" size={20} color="#86A8E7" /> {t?.checkout?.orderSummary || 'Order Summary'}
              </Text>
              <View style={styles.cartItems}>
                {cartData.items.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <Image 
                      source={{ uri: item.product_image }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemQuantity}>
                        {t?.checkout?.quantity || 'Quantity'}: {item.quantity}
                      </Text>
                      <Text style={styles.itemPrice}>
                        {item.price * item.quantity} SAR
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="location" size={20} color="#86A8E7" /> {t?.checkout?.deliveryLocation || 'Delivery Location'}
              </Text>
              <TouchableOpacity 
                style={styles.locationSelector}
                onPress={() => setShowAddressSheet(true)}
              >
                {selectedAddress ? (
                  <View style={styles.selectedLocationContainer}>
                    <View style={styles.locationIcon}>
                      <Ionicons name="location" size={24} color="#86A8E7" />
                    </View>
                    <View style={styles.locationDetails}>
                      <Text style={styles.selectedLocation}>
                        {selectedAddress.name}
                      </Text>
                      <Text style={styles.locationAddress}>
                        {selectedAddress.address}
                      </Text>
                      {selectedAddress.is_default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.selectLocationPrompt}>
                    <Ionicons name="location-outline" size={24} color="#86A8E7" />
                    <Text style={styles.selectLocationText}>
                      {t?.checkout?.selectLocation || 'Select Delivery Location'}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#86A8E7" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="wallet" size={20} color="#86A8E7" /> {t?.checkout?.paymentMethod || 'Payment Method'}
              </Text>
              <View style={styles.paymentSelector}>
                <View style={styles.paymentOption}>
                  <View style={styles.paymentIconContainer}>
                    <Ionicons name="cash" size={20} color="#86A8E7" />
                  </View>
                  <Text style={styles.paymentMethodName}>Cash on Delivery</Text>
                  <View style={styles.selectedPaymentIndicator}>
                    <View style={styles.radioOuter}>
                      <View style={styles.radioInner} />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="card" size={20} color="#86A8E7" /> {t?.checkout?.orderSummary || 'Order Summary'}
              </Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t?.checkout?.subtotal || 'Subtotal'}</Text>
                  <Text style={styles.summaryValue}>{calculateSubtotal(cartData.items)} SAR</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t?.checkout?.deliveryFee || 'Delivery Fee'}</Text>
                  <Text style={styles.summaryValue}>{DELIVERY_FEE} SAR</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>{t?.checkout?.total || 'Total'}</Text>
                  <Text style={styles.totalValue}>{calculateTotal(calculateSubtotal(cartData.items))} SAR</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, isLoading && styles.gradientDisabled]}
          >
            <View style={styles.orderButtonContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.placeOrderText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.placeOrderText}>{t?.checkout?.placeOrder || 'Place Order'}</Text>
                  <View style={styles.orderPriceContainer}>
                    <Text style={styles.orderPriceText}>
                      {calculateTotal(calculateSubtotal(cartData?.items || []))} SAR
                    </Text>
                  </View>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <AddressSheet
        visible={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        onSelectLocation={handleLocationSelect}
        language={language}
      />
      <Toast config={toastConfig} />
      {isLoading && (
        <Modal transparent visible={true}>
          <View style={styles.overlayContainer}>
            <View style={styles.loaderCard}>
              <ActivityIndicator size="large" color="#86A8E7" />
              <Text style={styles.loaderText}>Processing your order...</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  cartItems: {
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A363B',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  selectedLocationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  selectedLocation: {
    fontSize: 16,
    color: '#2A363B',
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  selectLocationPrompt: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectLocationText: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2A363B',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#86A8E7',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  placeOrderButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  orderPriceContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderPriceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: '#86A8E720',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultText: {
    color: '#86A8E7',
    fontSize: 12,
    fontWeight: '500',
  },
  toastContainer: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  toastGradient: {
    width: '100%',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastTexts: {
    flex: 1,
  },
  toastTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  paymentSelector: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  paymentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#2A363B',
  },
  selectedPaymentIndicator: {
    marginLeft: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#86A8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#86A8E7',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A363B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  continueShoppingButton: {
    width: '80%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  gradientDisabled: {
    opacity: 0.8,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loaderText: {
    fontSize: 16,
    color: '#2A363B',
    fontWeight: '500',
  },
}); 