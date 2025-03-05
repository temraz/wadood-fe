import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  I18nManager,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getHeaders } from './constants/api';
import { useLanguage } from './context/LanguageContext';
import AddressSheet from './components/AddressSheet';
import Toast from 'react-native-toast-message';

export default function ServiceCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

  const { provider, services, date, time, is_at_home } = useMemo(() => {
    return {
      provider: JSON.parse(params.provider || '{}'),
      services: JSON.parse(params.services || '[]'),
      date: params.date,
      time: params.time,
      is_at_home: parseInt(params.is_at_home || '1'),
    };
  }, [params]);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('selectedLocation');
      if (savedLocation) {
        setSelectedLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  const handleLocationSelect = () => {
    setShowAddressSheet(true);
  };

  const handleAddressSelect = async (address) => {
    setSelectedLocation(address);
    setShowAddressSheet(false);
    try {
      await AsyncStorage.setItem('selectedLocation', JSON.stringify(address));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleSubmitBooking = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: t.common.errors.authRequired || 'Authentication required',
          position: 'top',
        });
        return;
      }

      // If service is at shop (is_at_home = 0), use address_id = 0
      // Otherwise, require a selected address
      const addressId = params.is_at_home === 0 ? 0 : selectedLocation?.id;
      
      if (params.is_at_home === 1 && !addressId) {
        Toast.show({
          type: 'error',
          text1: t.serviceCheckout.errors.addressRequired || 'Please select a delivery address',
          position: 'top',
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        },
        body: JSON.stringify({
          cart_id: parseInt(params.cart_id),
          address_id: addressId,
          payment_method: 'cash'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Order Placed Successfully',
          text2: 'Thank you for your order',
          position: 'top',
          visibilityTime: 2000,
        });

        // Wait for toast to be visible before navigation
        setTimeout(() => {
          // Navigate back to home screen
          router.replace('/home');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to place order',
        text2: error.message,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMaps = () => {
    const { latitude, longitude } = provider;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open maps application');
      }
    });
  };

  const totalAmount = services.reduce((sum, service) => sum + service.price, 0);

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
            color="#2A363B" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.dateTimeCard}>
          <LinearGradient
            colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeItem}>
                <Ionicons name="calendar-outline" size={24} color="#fff" />
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{date}</Text>
              </View>
              <View style={styles.dateTimeDivider} />
              <View style={styles.dateTimeItem}>
                <Ionicons name="time-outline" size={24} color="#fff" />
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{time}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Selected Services</Text>
          {services.map((service, index) => (
            <View key={index} style={styles.serviceCard}>
              <View style={[styles.serviceIcon, { backgroundColor: service.color || '#E3F2FD' }]}>
                <Ionicons 
                  name={service.icon ? `${service.icon}-outline` : 'help-outline'} 
                  size={20} 
                  color={service.color ? service.color.replace('15', '') : '#86A8E7'} 
                />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>
                  {language === 'ar' ? service.service.name_ar : service.service.name}
                </Text>
                <Text style={styles.serviceDuration}>{service.duration} min</Text>
              </View>
              <Text style={styles.servicePrice}>{service.price} SAR</Text>
            </View>
          ))}
        </View>

        {is_at_home ? (
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={handleLocationSelect}
          >
            <View style={styles.locationContent}>
              <Ionicons name="location-outline" size={24} color="#86A8E7" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Service Location</Text>
                {selectedLocation ? (
                  <>
                    <Text style={styles.locationName}>{selectedLocation.name}</Text>
                    <Text style={styles.locationAddress} numberOfLines={1}>
                      {selectedLocation.address}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectLocation}>Select location</Text>
                )}
              </View>
            </View>
            <Ionicons 
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={20} 
              color="#86A8E7" 
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.locationButton}>
            <View style={styles.locationContent}>
              <Ionicons name="business-outline" size={24} color="#86A8E7" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Service Location</Text>
                <Text style={styles.locationName}>At Shop</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {provider.address || 'Provider Shop Location'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={handleOpenMaps}
            >
              <Ionicons 
                name="map" 
                size={24} 
                color="#86A8E7" 
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.paymentMethod}>
          <View style={styles.paymentHeader}>
            <Ionicons name="wallet-outline" size={24} color="#86A8E7" />
            <Text style={styles.paymentTitle}>Payment Method</Text>
          </View>
          <View style={styles.cashOption}>
            <Ionicons name="cash-outline" size={24} color="#86A8E7" />
            <Text style={styles.cashText}>Cash</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{totalAmount} SAR</Text>
        </View>
        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.disabledButton]} 
          onPress={handleSubmitBooking}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t?.serviceCheckout?.placeOrder || 'Place Order'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {is_at_home && (
        <AddressSheet
          visible={showAddressSheet}
          onClose={() => setShowAddressSheet(false)}
          onSelectLocation={handleAddressSelect}
          language={language}
        />
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  dateTimeCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7F7FD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradientCard: {
    padding: 20,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  dateTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
  },
  dateTimeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  dateTimeValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  servicesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#7F7FD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#666',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#7F7FD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  locationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  selectLocation: {
    fontSize: 16,
    color: '#86A8E7',
  },
  paymentMethod: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#7F7FD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginLeft: 12,
  },
  cashOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  cashText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#86A8E7',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#86A8E7',
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
}); 