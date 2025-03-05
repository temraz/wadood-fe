import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ImageBackground,
  Modal,
  Platform,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FilterSheet from './components/FilterSheet';
import RatingSheet from './components/RatingSheet';
import ProfileMenu from './components/ProfileMenu';
import AddressSheet from './components/AddressSheet';
import { useLanguage } from './context/LanguageContext';
import SearchSheet from './components/SearchSheet';
import ProductCard from './components/ProductCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import Toast from 'react-native-toast-message';

const GOOGLE_MAPS_APIKEY = "AIzaSyCd0luF6FXBYOvJy1ZWpr3ALjjYhJ5LtOo";

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const ProviderCard = ({ provider, onPress }) => {
  const [visibleServices, setVisibleServices] = React.useState([]);
  const [remainingCount, setRemainingCount] = React.useState(0);
  const servicesContainerRef = React.useRef(null);

  React.useEffect(() => {
    if (servicesContainerRef.current) {
      servicesContainerRef.current.measure((x, y, width) => {
        const maxRows = 2;
        const rowHeight = 32;
        const verticalGap = 8;
        const maxHeight = (rowHeight * maxRows) + (verticalGap * (maxRows - 1));
        
        let currentHeight = 0;
        let visibleCount = 0;
        
        for (let service of provider.services) {
          if (currentHeight + rowHeight <= maxHeight) {
            visibleCount++;
            currentHeight += rowHeight + verticalGap;
          } else {
            break;
          }
        }

        setVisibleServices(provider.services.slice(0, visibleCount));
        setRemainingCount(provider.services.length - visibleCount);
      });
    }
  }, [provider.services]);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: provider.logoURL }} 
          style={styles.providerLogo}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.cardTitle}>{provider.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#7F7FD5" />
            <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.infoText}>
            {provider.openTime} - {provider.closeTime}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: provider.status === 'Open' ? '#4ECDC4' : '#FF6B6B' }
          ]}>
            <Text style={styles.statusText}>{provider.status}</Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{provider.distance} km</Text>
        </View>
      </View>
      
      <View 
        ref={servicesContainerRef}
        style={styles.servicesPreview}
      >
        {visibleServices.map((service) => (
          <View 
            key={service.id} 
            style={[styles.serviceTag, { backgroundColor: `${service.color}15` }]}
          >
            <Ionicons name={service.icon} size={14} color={service.color} />
            <Text style={[styles.serviceText, { color: service.color }]}>
              {service.name}
            </Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={styles.moreTag}>
            <Text style={styles.moreText}>+{remainingCount} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Add mock products data
const PRODUCTS = [
  {
    id: 1,
    name: 'Royal Canin Premium Food',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 79.99,
    rating: 4.8,
    reviews: 245,
    category: 'Food',
    badge: 'Popular'
  },
  {
    id: 2,
    name: 'Cozy Pet Bed',
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 49.99,
    rating: 4.6,
    reviews: 189,
    category: 'Beds',
    badge: 'New'
  },
  {
    id: 3,
    name: 'Royal Canin Premium Food',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 79.99,
    rating: 4.8,
    reviews: 245,
    category: 'Food',
    badge: 'Popular'
  },
  // Add more products...
];

const saveLocation = async (location) => {
  try {
    await AsyncStorage.setItem('userLocation', JSON.stringify(location));
  } catch (error) {
    // console.log('Error saving location:', error);
  }
};

const loadSavedLocation = async () => {
  try {
    const savedLocation = await AsyncStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      setSelectedAddress(location.addressName || location.formattedAddress);
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setCurrentLocation(location);
    }
  } catch (error) {
    // console.log('Error loading location:', error);
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showRatingSheet, setShowRatingSheet] = useState(false);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('Select Location');
  const [petShops, setPetShops] = useState([]);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [user, setUser] = useState({
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    name: '',
    location: '',
    phone: ''
  });
  const [userLocation, setUserLocation] = useState({
    latitude: 0,
    longitude: 0
  });
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

  useEffect(() => {
    loadUserData();
    fetchPetShops();
    fetchServiceProviders();
    fetchActiveOrders();
    fetchAddresses();
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrders();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(prevUser => ({
          ...prevUser,
          ...parsedUser
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchPetShops = async () => {
    try {
      // Get the selected address from AsyncStorage
      const savedAddress = await AsyncStorage.getItem('selectedAddress');
      const address = savedAddress ? JSON.parse(savedAddress) : null;
      
      // Only proceed if we have valid coordinates
      if (!address?.latitude || !address?.longitude) {
        console.log('No address coordinates available. Skipping pet shops fetch.');
        setPetShops([]);
        return;
      }

      setIsLoadingShops(true);
      const token = await ensureValidToken(language);
      
      // Build the URL with coordinates
      const url = `${API_BASE_URL}/api/providers?has_products=true&latitude=${address.latitude}&longitude=${address.longitude}&limit=5&page=1`;
      
      // console.log('=== Fetching Pet Shops ===');
      // console.log('Request URL:', url);
      // console.log('Headers:', {
      //   'Authorization': `Bearer ${token}`,
      //   'Accept-Language': language,
      //   'Accept': 'application/json',
      // });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json',
        }
      });

      // Log response status and headers
      // console.log('Response status:', response.status);
      // console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get response text first
      const responseText = await response.text();
      // console.log('Raw response:', responseText);
      // console.log('=== End Pet Shops Request ===\n');

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // console.error('JSON Parse error:', parseError);
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }

      if (data.success) {
        setPetShops(data.providers || []);
      } else {
        throw new Error(data.message || 'Failed to fetch pet shops');
      }
    } catch (error) {
      // console.error('Error fetching pet shops:', error);
      setPetShops([]); // Set empty array on error
    } finally {
      setIsLoadingShops(false);
    }
  };

  const fetchServiceProviders = async () => {
    try {
      // Get the selected address from AsyncStorage
      const savedAddress = await AsyncStorage.getItem('selectedAddress');
      const address = savedAddress ? JSON.parse(savedAddress) : null;
      
      // Only proceed if we have valid coordinates
      if (!address?.latitude || !address?.longitude) {
        console.log('No address coordinates available. Skipping service providers fetch.');
        setServiceProviders([]);
        return;
      }

      setIsLoadingServices(true);
      const token = await ensureValidToken(language);
      
      // Build the URL with coordinates
      const url = `${API_BASE_URL}/api/providers?has_services=true&latitude=${address.latitude}&longitude=${address.longitude}&limit=10&page=1`;

      console.log('=== Fetching Service Providers ===');
      console.log('Request URL:', url);
      console.log('Headers:', {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
        'Accept': 'application/json',
      });

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json',
        }
      });

      // Log response status and headers
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get response text first
      const responseText = await response.text();
      // console.log('Raw response:', responseText);
      console.log('=== End Service Providers Request ===\n');

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse error:', parseError);
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }

      if (data.success) {
        // Filter out providers that don't have services
        const providersWithServices = (data.providers || []).filter(
          provider => provider.services && provider.services.length > 0
        );
        setServiceProviders(providersWithServices);
      } else {
        throw new Error(data.message || 'Failed to fetch service providers');
      }
    } catch (error) {
      console.error('Error fetching service providers:', error);
      setServiceProviders([]); // Set empty array on error
    } finally {
      setIsLoadingServices(false);
    }
  };

  const fetchActiveOrders = async () => {
    try {
      const token = await ensureValidToken(language);
      
      // First fetch all orders to check for completed ones
      const allOrdersResponse = await fetch(`${API_BASE_URL}/api/orders?status_type=all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json'
        }
      });

      const allOrdersData = await allOrdersResponse.json();
      
      if (allOrdersData.success) {
        // Check completed orders for rating status
        const completedOrders = allOrdersData.data.orders.filter(order => order.status === 'COMPLETED');
        
        for (const order of completedOrders) {
          const hasRatedResponse = await fetch(`${API_BASE_URL}/api/orders/${order.id}/has-rated`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept-Language': language
            }
          });
          
          const hasRatedData = await hasRatedResponse.json();
          
          if (hasRatedData.success && !hasRatedData.has_rated) {
            // Found an unrated completed order
            setOrderToRate(order);
            setShowRatingSheet(true);
            break; // Only show rating for one order at a time
          }
        }
      }

      // Fetch active orders count as before
      const activeOrdersResponse = await fetch(`${API_BASE_URL}/api/orders/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json'
        }
      });

      const activeOrdersData = await activeOrdersResponse.json();
      if (activeOrdersData.success) {
        const activeOrdersCount = activeOrdersData.data.total || 0;
        setActiveOrdersCount(activeOrdersCount);
        await AsyncStorage.setItem('activeOrdersCount', String(activeOrdersCount));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      const data = await response.json();
      if (data.success && data.addresses.length > 0) {
        const defaultAddress = data.addresses.find(addr => addr.is_default) || data.addresses[0];
        setSelectedAddress(defaultAddress);
        setUserLocation({
          latitude: defaultAddress.latitude,
          longitude: defaultAddress.longitude,
        });
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleAddressSelect = async (address) => {
    try {
      // console.log('Selected address:', address);
      
      // Save the selected address to AsyncStorage
      await AsyncStorage.setItem('selectedAddress', JSON.stringify(address));
      
      // Update UI with selected address
      setSelectedAddress(address);
      
      // Update user location coordinates
      setUserLocation({
        latitude: address.latitude,
        longitude: address.longitude,
      });
      
      // Refresh providers and shops with new location
      await Promise.all([
        fetchPetShops(),
        fetchServiceProviders()
      ]);
      
      setShowAddressSheet(false);
    } catch (error) {
      console.error('Error handling address selection:', error);
    }
  };

  const handleSaveLocation = (location) => {
    setCurrentLocation(location.name);
  };

  const handleFilters = (filters) => {
    // console.log('Applied filters:', filters);
    // Add your filter logic here
  };

  const handleRatingSubmit = async (rating, comment) => {
    try {
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/orders/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderToRate.id,
          rating,
          comment
        })
      });

      const data = await response.json();
      
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: t.orders.rating.success || 'Thank you for your rating!',
          position: 'top',
          visibilityTime: 3000
        });
      } else {
        throw new Error(data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Toast.show({
        type: 'error',
        text1: t.orders.rating.error || 'Failed to submit rating',
        text2: error.message,
        position: 'top',
        visibilityTime: 3000
      });
    } finally {
      setShowRatingSheet(false);
      setOrderToRate(null);
    }
  };

  const handleLanguageChange = (language) => {
    // console.log('Language changed to:', language);
    // Add your language change logic here
  };

  const handleLocationSelect = (location) => {
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    
    // Update the displayed address
    setSelectedAddress(location.addressName || location.formattedAddress);
  };

  useEffect(() => {
    if (router.params?.selectedLocation) {
      const location = router.params.selectedLocation;
      // console.log('Received location:', location);
      
      // Update all location-related states
      setSelectedAddress(location.addressName || location.formattedAddress);
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setCurrentLocation(location);
      
      // Save to AsyncStorage
      saveLocation(location);
      
      // Clear the params to prevent re-updating on navigation
      router.setParams({ selectedLocation: null });
    }
  }, [router.params?.selectedLocation]);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            <View style={styles.headerRow}>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
                  <View style={styles.menuButton}>
                    <Ionicons name="paw" size={24} color="#86A8E7" />
                  </View>
                </TouchableOpacity>
              
              </View>

              <TouchableOpacity 
                style={styles.locationButton}
                onPress={() => setShowAddressSheet(true)}
              >
                <Ionicons name="location-outline" size={18} color="#86A8E7" />
                <Text 
                  style={[styles.locationText]} 
                  numberOfLines={1}
                >
                  {selectedAddress ? selectedAddress.name : t.home.location.setLocation}
                </Text>
                <Ionicons 
                  name={isRTL ? "chevron-back" : "chevron-forward"} 
                  size={18} 
                  color="#86A8E7" 
                />
              </TouchableOpacity>

              <TouchableOpacity >
                  <View style={[styles.menuButton,styles.notificationButton]}>
                    <Ionicons name="notifications-outline" size={24} color="#86A8E7" />
                  </View>
                </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content}>
        {/* Product Providers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
              {t.home.petShops || 'Pet Shops'}
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/petshops',
              params: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                distance: 10
              }
            })}>
              <Text style={styles.viewAll}>{t.home.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.productProvidersScroll, 
              isRTL && { flexDirection: 'row-reverse' },
              petShops.length === 0 && { flex: 1, justifyContent: 'center' }
            ]}
          >
            {isLoadingShops ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#86A8E7" />
              </View>
            ) : petShops.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="storefront-outline" size={48} color="#86A8E7" />
                <Text style={styles.emptyStateTitle}>{t.home.noShopsTitle || 'No Pet Shops Found'}</Text>
              </View>
            ) : petShops.map((provider) => (
              <TouchableOpacity 
                key={provider.id}
                style={styles.productProviderCard}
                onPress={() => router.push({
                  pathname: '/products',
                  params: { 
                    id: provider.id,
                    shop: JSON.stringify(provider)
                  }
                })}
              >
                <Image source={{ uri: provider.cover_url || provider.logo_url }} style={styles.providerImage} />
                <View style={styles.statusLabel}>
                  <View style={[styles.statusDot, { backgroundColor: provider.is_open ? '#4ECDC4' : '#FF6B6B' }]} />
                  <Text style={styles.shopText}>
                    {provider.is_open ? t.provider.orders.status.open || 'Open' : t.provider.orders.status.closed || 'Closed'}
                  </Text>
                </View>
                <View style={styles.providerOverlay}>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlayGradient}
                  >
                    <View style={styles.providerInfo}>
                      <View style={styles.providerHeader}>
                        <Image source={{ uri: provider.logo_url }} style={styles.shopsLogo} />
                        <View style={styles.providerMeta}>
                          <Text style={styles.providerName} numberOfLines={1}>
                            {language === 'ar' ? provider.name_ar : provider.name}
                          </Text>
                          <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.shopsRating}>{provider.rating}</Text>
                            <Text style={styles.ratingCount}>({provider.total_ratings})</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.providerStats}>
                        <View style={styles.statItem}>
                          <Ionicons name="pricetag-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>{provider.number_of_products} Products</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Ionicons name="location-outline" size={16} color="#fff" />
                          <Text style={styles.statText}>{provider.distance} km</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <View style={styles.servicesSectionHeader}>
            <Text style={[styles.servicesSectionTitle, isRTL && styles.rtlText]}>
              {t.home.services || 'Services'}
            </Text>
            <TouchableOpacity onPress={() => router.push({
              pathname: '/providers',
              params: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                distance: 10
              }
            })}>
              <Text style={styles.viewAll}>{t.home.viewAll}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.providersList}>
            {isLoadingServices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#86A8E7" />
              </View>
            ) : serviceProviders.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="paw-outline" size={48} color="#86A8E7" />
                <Text style={styles.emptyStateTitle}>{t.home.noServicesTitle || 'No Service Providers Found'}</Text>
              </View>
            ) : serviceProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={{
                  ...provider,
                  name: language === 'ar' ? provider.name_ar : provider.name,
                  logoURL: provider.logo_url,
                  openTime: provider.open_time.slice(0, 5),
                  closeTime: provider.close_time.slice(0, 5),
                  status: provider.is_open ? 'Open' : 'Closed',
                  services: provider.services.map(s => ({
                    id: s.id,
                    name: language === 'ar' ? s.service.name_ar : s.service.name,
                    icon: s.service.icon + '-outline',
                    color: getServiceColor(s.service.icon),
                    price: s.price
                  }))
                }}
                onPress={() => router.push({
                  pathname: `/provider/${provider.id}`,
                  params: {
                    provider: JSON.stringify(provider)
                  }
                })}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {activeOrdersCount > 0 && (
        <TouchableOpacity 
          style={styles.ordersButton}
          onPress={() => router.push('/orders')}
        >
          <LinearGradient
            colors={['#7F7FD5', '#86A8E7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ordersButtonGradient}
          >
            <View style={styles.ordersButtonContent}>
              <Ionicons name="receipt-outline" size={24} color="#fff" />
              <View style={styles.ordersBadge}>
                <Text style={styles.ordersBadgeText}>{activeOrdersCount}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      <AddressSheet
        visible={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        onSelectLocation={handleAddressSelect}
        language={language}
      />

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilters}
      />

      <RatingSheet
        visible={showRatingSheet}
        onClose={() => setShowRatingSheet(false)}
        order={orderToRate}
        onSubmit={handleRatingSubmit}
      />

      <ProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        user={{
          ...user,
          phone: '+966 50 123 4567'
        }}
        onLanguageChange={handleLanguageChange}
      />

      <SearchSheet
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        products={PRODUCTS}
      />
    </View>
  );
}

const getServiceColor = (icon) => {
  const colors = {
    'cut': '#FF6B6B',
    'paw': '#4ECDC4',
    'medical': '#45B7D1',
    'home': '#96CEB4',
    'water': '#FFD93D',
    'sunny': '#6C5CE7',
    'school': '#FF8B94'
  };
  return colors[icon] || '#86A8E7';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 120,
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    marginTop: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '75%',
    marginLeft:10,
    gap: 4,
  },
  notificationButton: {
    marginLeft: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#2A363B',
    fontWeight: '500',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  section: {
    paddingTop: 16,
  },
  servicesSection: {
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  servicesSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
  },
  servicesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  providersList: {
    gap: 16,
    paddingTop: 4,
  },
  productProvidersScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
    minHeight: 200,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    // marginBottom: 10,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopsLogo: {
    width: 40,
    height: 40,
    borderRadius: 40,
    // marginRight: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopsRating: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  rating: {
    fontSize: 14,
    color: '#7F7FD5',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  servicesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  moreTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(145,234,228,0.1)',
  },
  moreText: {
    fontSize: 13,
    color: '#91EAE4',
    fontWeight: '600',
  },
  ordersButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ordersButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    padding: 8,
  },
  ordersButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  ordersBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rtlContainer: {
    direction: 'rtl',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  productCard: {
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  productInfo: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  productDetails: {
    gap: 2,
  },
  productCategory: {
    fontSize: 11,
    color: '#86A8E7',
    fontWeight: '600',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 2,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#86A8E7',
    marginTop: 'auto',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
  },
  viewAll: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '500',
  },
  servicesGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  providerContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  productProviderCard: {
    width: 220,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  providerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  providerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  overlayGradient: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  providerInfo: {
    gap: 8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  providerMeta: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  providerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#fff',
  },
  statusLabel: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
  shopText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A363B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
}); 