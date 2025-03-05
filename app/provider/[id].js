import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';
import Toast from 'react-native-toast-message';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);

export default function ProviderScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const params = useLocalSearchParams();
  
  // Parse the provider data from params
  const provider = useMemo(() => {
    try {
      return JSON.parse(params.provider || '{}');
    } catch (error) {
      console.error('Error parsing provider data:', error);
      return {};
    }
  }, [params.provider]);

  useEffect(() => {
    const clearExistingCart = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/cart/provider/${provider.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': language,
          }
        });

        const data = await response.json();
        if (!data.success) {
          console.error('Failed to clear cart:', data.message);
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    };

    clearExistingCart();
  }, [provider.id, language]);

  useEffect(() => {
    if (provider?.services) {
      console.log('Available services:', provider.services.map(service => ({
        id: service.service.id,
        name: service.service.name,
        name_ar: service.service.name_ar
      })));
    }
  }, [provider]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [isDateTimeVisible, setIsDateTimeVisible] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceType, setServiceType] = useState('home');
  const [isLoading, setIsLoading] = useState(false);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, serviceId) => {
      const service = provider.services?.find(s => s.service.id === serviceId);
      return sum + (service ? (serviceType === 'shop' ? service.price_at_shop : service.price_at_home) : 0);
    }, 0);
  }, [selectedServices, provider.services, serviceType]);

  const handleServiceSelect = (serviceId) => {
    console.log('Selected service:', {
      serviceId,
      service: provider.services.find(s => s.service.id === serviceId)
    });
    
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleBookNow = () => {
    setIsDateTimeVisible(true);
  };

  const handleCloseDateTime = () => {
    setIsDateTimeVisible(false);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleConfirm = async () => {
    if (selectedDate && selectedTime) {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Authentication required',
            position: 'top',
          });
          return;
        }

        // Format the date and time for the API
        const orderDateTime = `${selectedDate} ${selectedTime}:00`;
        let cartId = null;

        // Add each selected service to cart
        for (const serviceId of selectedServices) {
          const service = provider.services.find(s => s.service.id === serviceId);
          const price = serviceType === 'shop' ? service.price_at_shop : service.price_at_home;

          const response = await fetch(`${API_BASE_URL}/api/cart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept-Language': language,
            },
            body: JSON.stringify({
              provider_id: provider.id,
              service_id: serviceId,
              quantity: 1,
              price: price,
              order_date: orderDateTime
            })
          });

          const data = await response.json();
          if (!data.success) {
            throw new Error(data.message || 'Failed to add service to cart');
          }

          // Store the cart_id from the first successful response
          if (!cartId) {
            cartId = data.cart_id;
          }
        }

        handleCloseDateTime();
        
        // Navigate to checkout with all necessary params
        router.push({
          pathname: '/serviceCheckout',
          params: {
            provider_id: provider.id,
            provider: JSON.stringify(provider),
            services: JSON.stringify(selectedServices.map(serviceId => {
              const service = provider.services.find(s => s.service.id === serviceId);
              return {
                ...service,
                icon: service.service.icon,
                color: getIconBackground(service.service.icon),
                price: serviceType === 'shop' ? service.price_at_shop : service.price_at_home,
                service_type: serviceType
              };
            })),
            date: selectedDate,
            time: selectedTime,
            service_type: serviceType,
            is_at_home: serviceType === 'home' ? 1 : 0,
            cart_id: cartId
          }
        });
      } catch (error) {
        console.error('Error adding services to cart:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to add services to cart',
          text2: error.message,
          position: 'top',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getActiveHours = useCallback(() => {
    return HOURS.filter(hour => {
      const currentHour = new Date().getHours();
      if (!selectedDate) return hour > currentHour;
      const today = new Date().toISOString().split('T')[0];
      return selectedDate === today ? hour > currentHour : true;
    });
  }, [selectedDate]);

  const calendarTheme = useMemo(() => ({
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#2A363B',
    selectedDayBackgroundColor: '#86A8E7',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#86A8E7',
    dayTextColor: '#2A363B',
    textDisabledColor: '#d9e1e8',
    dotColor: '#86A8E7',
    selectedDotColor: '#ffffff',
    arrowColor: '#86A8E7',
    monthTextColor: '#2A363B',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14
  }), []);

  const renderService = (service) => {
    const isSelected = selectedServices.includes(service.service.id);
    const price = serviceType === 'shop' ? service.price_at_shop : service.price_at_home;
    
    return (
      <TouchableOpacity
        key={service.service.id}
        style={[
          styles.serviceCard,
          isSelected && styles.selectedServiceCard
        ]}
        onPress={() => handleServiceSelect(service.service.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.serviceIcon, { backgroundColor: getIconBackground(service.service.icon) }]}>
          <Ionicons 
            name={service.service.icon ? `${service.service.icon}-outline` : 'help-outline'} 
            size={20} 
            color={getIconColor(service.service.icon)} 
          />
        </View>
        <View style={styles.serviceContent}>
          <Text style={styles.serviceName}>
            {language === 'ar' ? service.service.name_ar : service.service.name}
          </Text>
          <Text style={styles.serviceDescription}>
            {language === 'ar' ? service.service.description_ar : service.service.description}
          </Text>
          <View style={styles.serviceFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.servicePrice}>SAR {price}</Text>
              <Text style={styles.serviceLocation}>
                {serviceType === 'shop' ? 'At Shop' : 'At Home'}
              </Text>
            </View>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.serviceDuration}>{service.duration} min</Text>
            </View>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons 
            name={isRTL ? "chevron-forward" : "chevron-back"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
        <Image
          source={{ uri: provider.logo_url }}
          style={styles.providerLogo}
        />
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>
            {language === 'ar' ? provider.name_ar : provider.name}
          </Text>
          <View style={styles.providerDetails}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{provider.rating} ({provider.total_ratings})</Text>
            <Ionicons name="location" size={16} color="#666" style={styles.locationIcon} />
            <Text style={styles.distanceText}>{provider.distance} km</Text>
            <View style={[styles.statusContainer, { marginLeft: 8 }]}>
              <View style={[styles.statusDot, { backgroundColor: provider.is_open ? '#4ECDC4' : '#FF6B6B' }]} />
              <Text style={[styles.statusText, { color: provider.is_open ? '#4ECDC4' : '#FF6B6B' }]}>
                {provider.is_open ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.serviceTypeContainer}>
          <TouchableOpacity 
            style={[styles.serviceTypeTab, serviceType === 'home' && styles.activeServiceTypeTab]}
            onPress={() => setServiceType('home')}
          >
            <Ionicons name="home-outline" size={20} color={serviceType === 'home' ? '#86A8E7' : '#666'} />
            <Text style={[styles.serviceTypeText, serviceType === 'home' && styles.activeServiceTypeText]}>
              At Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.serviceTypeTab, serviceType === 'shop' && styles.activeServiceTypeTab]}
            onPress={() => setServiceType('shop')}
          >
            <Ionicons name="business-outline" size={20} color={serviceType === 'shop' ? '#86A8E7' : '#666'} />
            <Text style={[styles.serviceTypeText, serviceType === 'shop' && styles.activeServiceTypeText]}>
              At Shop
            </Text>
          </TouchableOpacity>
        </View>
        {provider.services?.map(renderService)}
      </ScrollView>

      <View style={styles.footer}>
        {selectedServices.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalPrice}>SAR {totalPrice}</Text>
          </View>
        )}
        <TouchableOpacity 
          style={[styles.bookButton, selectedServices.length === 0 && styles.disabledButton]} 
          onPress={handleBookNow}
          disabled={selectedServices.length === 0 || !provider.is_open}
        >
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <Text style={styles.bookButtonText}>
              {!provider.is_open ? 'Currently Closed' : 
                selectedServices.length > 0 ? `Book (${selectedServices.length} Services)` : 'Book'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDateTimeVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseDateTime}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateTimeContent}>
            <View style={styles.dateTimeHeader}>
              <Text style={styles.dateTimeTitle}>
                {t?.dateTimeSheet?.selectDateTime || 'Select Date & Time'}
              </Text>
              <TouchableOpacity onPress={handleCloseDateTime}>
                <Ionicons name="close" size={24} color="#2A363B" />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={day => setSelectedDate(day.dateString)}
              markedDates={selectedDate ? {
                [selectedDate]: {
                  selected: true,
                  selectedColor: '#86A8E7'
                }
              } : {}}
              minDate={new Date().toISOString().split('T')[0]}
              theme={calendarTheme}
            />

            <View style={styles.timeSection}>
              <Text style={styles.timeSectionTitle}>
                {t?.dateTimeSheet?.availableTimeSlots || 'Available Time Slots'}
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.timeSlots}
              >
                {getActiveHours().map(hour => {
                  const timeString = `${hour}:00`;
                  const isSelected = selectedTime === timeString;
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeSlot,
                        isSelected && styles.selectedTimeSlot
                      ]}
                      onPress={() => setSelectedTime(timeString)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        isSelected && styles.selectedTimeSlotText
                      ]}>
                        {timeString}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedDate || !selectedTime || isLoading) && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={!selectedDate || !selectedTime || isLoading}
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
                  <Text style={styles.confirmButtonText}>
                    {t?.dateTimeSheet?.confirm || 'Confirm'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getIconBackground = (icon) => {
  const iconColors = {
    'paw': '#FFE0E9',      // Soft Pink
    'cut': '#E0F4FF',      // Light Blue
    'medical': '#FFE8D6',   // Peach
    'home': '#D7FFE0',     // Mint Green
    'car': '#F0E6FF',      // Lavender
    'construct': '#FFF4CC', // Light Yellow
    'fitness': '#FFE0E0',   // Light Red
    'brush': '#E5F8FF',    // Sky Blue
    'walk': '#E6FFE6',     // Light Green
    'food': '#FFE5CC',     // Light Orange
    'bath': '#E0EEFF',     // Baby Blue
    'vaccine': '#FFE6F0'    // Rose
  };
  return iconColors[icon] || '#F0F4FF';
};

const getIconColor = (icon) => {
  const iconColors = {
    'paw': '#FF4D8D',      // Deep Pink
    'cut': '#00A3FF',      // Bright Blue
    'medical': '#FF8C42',   // Orange
    'home': '#00CC66',     // Green
    'car': '#8C52FF',      // Purple
    'construct': '#FFB800', // Gold
    'fitness': '#FF5C5C',   // Red
    'brush': '#00B8D4',    // Cyan
    'walk': '#4CAF50',     // Forest Green
    'food': '#FF6B2C',     // Deep Orange
    'bath': '#2196F3',     // Royal Blue
    'vaccine': '#E91E63'    // Pink
  };
  return iconColors[icon] || '#7F7FD5';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 12,
  },
  providerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  providerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    marginRight: 12,
    fontSize: 14,
    color: '#666',
  },
  locationIcon: {
    marginRight: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F7FA',
    paddingBottom: 120,
  },
  serviceCard: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  selectedServiceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#86A8E7',
    borderWidth: 1,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceContent: {
    flex: 1,
    marginRight: 24,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDuration: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A363B',
  },
  bookButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dateTimeContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '90%',
  },
  dateTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateTimeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  timeSection: {
    marginTop: 24,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  timeSlots: {
    paddingVertical: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  selectedTimeSlot: {
    backgroundColor: '#86A8E7',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#2A363B',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  confirmButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  serviceTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeServiceTypeTab: {
    backgroundColor: '#F0F4FF',
  },
  serviceTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeServiceTypeText: {
    color: '#86A8E7',
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'column',
  },
  serviceLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
}); 