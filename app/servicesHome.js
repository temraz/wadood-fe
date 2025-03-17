import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import FilterSheet from './components/FilterSheet';
import SearchSheet from './components/SearchSheet';
import AddressSheet from './components/AddressSheet';
import ProfileMenu from './components/ProfileMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getHeaders, ensureValidToken } from './constants/api';

export default function ServicesHomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    distance: 10,
    services: '',
    has_products: false
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    loadSavedLocation();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      fetchProviders(1);
    }
  }, [selectedLocation]);

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

  const handleAddressSelect = async (address) => {
    setSelectedLocation(address);
    setShowAddressSheet(false);
    try {
      await AsyncStorage.setItem('selectedLocation', JSON.stringify(address));
      // Fetch providers with new location
      fetchProviders(1);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B',  // Coral Red
      '#7F7FD5',  // Purple
      '#FF8B94',  // Pink
      '#6C5CE7',  // Royal Purple
      '#20C997',  // Mint
      '#FD7E14',  // Deep Orange
      '#9775FA'   // Violet
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const fetchProviders = async (page = 1, filters = activeFilters) => {
    if (!selectedLocation?.latitude || !selectedLocation?.longitude) {
      setError('Please select a location first');
      setIsLoading(false);
      setProviders([]);
      return;
    }

    try {
      setError(null);
      if (page === 1) {
        setIsLoading(true);
        setHasMorePages(true);
      } else {
        setIsLoadingMore(true);
      }

      const token = await ensureValidToken(language);

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        has_services: 'true',
        latitude: selectedLocation.latitude.toString(),
        longitude: selectedLocation.longitude.toString(),
        distance: filters.distance.toString()
      });

      if (filters.services) {
        queryParams.append('services', filters.services);
      }

      const url = `${API_BASE_URL}/api/providers?${queryParams.toString()}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
        'Accept': 'application/json',
      };

      console.log('=== Fetching Providers ===');
      console.log('Request URL:', url);
      console.log('Request Headers:', headers);
      console.log('Selected Location:', selectedLocation);
      console.log('Filters:', filters);

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch providers');
      }
      
      if (data.success) {
        const providersList = data.providers || [];
        const providersWithServices = providersList.filter(provider => 
          provider && provider.services && Array.isArray(provider.services) && provider.services.length > 0
        );
        
        console.log('Filtered Providers Count:', providersWithServices.length);
        console.log('Original Providers Count:', providersList.length);
        
        if (page === 1) {
          setProviders(providersWithServices);
        } else {
          const existingIds = new Set(providers.map(p => p.id));
          const newProviders = providersWithServices.filter(p => !existingIds.has(p.id));
          setProviders(prev => [...prev, ...newProviders]);
        }
        
        const pagination = data.pagination;
        setHasMorePages(pagination && pagination.current_page < pagination.total_pages);
        setCurrentPage(pagination ? pagination.current_page : 1);
      } else {
        setProviders([]);
        setHasMorePages(false);
      }
    } catch (err) {
      console.error('Fetch Providers Error:', err);
      setError(err.message);
      setHasMorePages(false);
      setProviders([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleFilters = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    fetchProviders(1, filters);
    setShowFilters(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePages && !isLoading && !error) {
      fetchProviders(currentPage + 1);
    }
  };

  const handleSearch = async (query) => {
    try {
      setError(null);
      
      const token = await ensureValidToken(language);

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10',
        has_services: 'true',
        latitude: selectedLocation.latitude.toString(),
        longitude: selectedLocation.longitude.toString(),
        name: query
      });

      const url = `${API_BASE_URL}/api/providers?${queryParams.toString()}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
        'Accept': 'application/json',
      };

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search providers');
      }

      if (data.success && data.data && Array.isArray(data.data.providers)) {
        const providersWithServices = data.data.providers.filter(provider => 
          provider && provider.services && Array.isArray(provider.services) && provider.services.length > 0
        );
        setSearchResults(providersWithServices);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search Providers Error:', err);
      Alert.alert('Error', err.message);
      setSearchResults([]);
    }
  };

  const renderProvider = ({ item: provider }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: `/provider/${provider.id}`,
        params: {
          provider: JSON.stringify(provider)
        }
      })}
    >
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: provider.logo_url || 'https://via.placeholder.com/48' }} 
          style={styles.providerLogo}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.cardTitle}>
            {language === 'ar' ? provider.name_ar : provider.name}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#7F7FD5" />
            <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({provider.total_ratings})</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.infoText}>
            {provider.open_time.slice(0, 5)} - {provider.close_time.slice(0, 5)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: provider.is_open ? '#4ECDC4' : '#FF6B6B' }
          ]}>
            <Text style={styles.statusText}>
              {provider.is_open ? (language === 'ar' ? 'مفتوح' : 'Open') : (language === 'ar' ? 'مغلق' : 'Closed')}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.infoText}>{provider.distance} km</Text>
        </View>
      </View>
      
      <View style={styles.servicesPreview}>
        {provider.services.slice(0, 2).map((serviceItem) => {
          const color = getRandomColor();
          return (
            <View 
              key={serviceItem.id} 
              style={[styles.serviceTag, { backgroundColor: `${color}15` }]}
            >
              <Ionicons name={`${serviceItem.service.icon}-outline`} size={14} color={color} />
              <Text style={[styles.serviceText, { color: color }]}>
                {language === 'ar' ? serviceItem.service.name_ar : serviceItem.service.name}
              </Text>
            </View>
          );
        })}
        {provider.services.length > 2 && (
          <View style={styles.moreTag}>
            <Text style={styles.moreText}>+{provider.services.length - 2} more</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMorePages) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#86A8E7" />
        <Text style={styles.loadingMoreText}>
          {language === 'ar' ? 'جاري التحميل...' : 'Loading more...'}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowProfileMenu(true)}
            >
              <Ionicons name="paw-outline" size={24} color="#2A363B" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.locationButton}
              onPress={() => setShowAddressSheet(true)}
            >
              <Ionicons name="location-outline" size={20} color="#86A8E7" />
              <Text style={styles.locationText} numberOfLines={1}>
                {selectedLocation ? selectedLocation.name : 'Home'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#86A8E7" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="options-outline" size={24} color="#2A363B" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {renderHeader()}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#86A8E7" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        {renderHeader()}
        <View style={styles.contentContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchProviders()}
              >
                <Text style={styles.retryText}>
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={providers}
              renderItem={renderProvider}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.providersList}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isLoadingMore ? renderFooter : null}
              refreshing={isLoading}
              onRefresh={() => fetchProviders(1)}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {language === 'ar' ? 'لا يوجد مقدمي خدمات' : 'No providers found'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </LinearGradient>

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleFilters}
      />

      <SearchSheet
        visible={showSearch}
        onClose={() => {
          setShowSearch(false);
          setSearchResults([]);
        }}
        providers={searchResults}
        onSearch={handleSearch}
        language={language}
      />

      <AddressSheet
        visible={showAddressSheet}
        onClose={() => setShowAddressSheet(false)}
        onSelectLocation={handleAddressSelect}
        language={language}
      />

      <ProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
        onLanguageChange={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  header: {
    height: 140,
    backgroundColor: 'transparent',
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    justifyContent: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    gap: 4,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#2A363B',
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#86A8E7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  providersList: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '500',
  },
  servicesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loadingMoreText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
}); 