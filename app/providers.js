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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from './context/LanguageContext';
import FilterSheet from './components/FilterSheet';
import SearchSheet from './components/SearchSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getHeaders, ensureValidToken } from './constants/api';

export default function ProvidersScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
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

  // Get location from route params
  const params = useLocalSearchParams();
  const [location, setLocation] = useState({
    latitude: parseFloat(params.latitude) || 0,
    longitude: parseFloat(params.longitude) || 0,
    distance: parseInt(params.distance) || 10
  });

  useEffect(() => {
    fetchProviders(1);
  }, []); // Only run on mount

  useEffect(() => {
    if (location.latitude && location.longitude) {
      fetchProviders(1);
    }
  }, [location.latitude, location.longitude]); // Only run when location changes

  const getRandomColor = () => {
    // Curated palette of vibrant colors that match app's design
    const colors = [
      '#86A8E7',  // Soft Blue (Primary app color)
      '#7F7FD5',  // Purple (Secondary app color)
      '#FF6B6B',  // Coral Red (Accent color)
      '#4ECDC4',  // Turquoise
      '#FFD93D',  // Warm Yellow
      '#6C5CE7',  // Royal Purple
      '#FF8B94',  // Soft Pink
      '#98DDCA',  // Mint Green
      '#45B7D1',  // Sky Blue
      '#FFB347'   // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const fetchProviders = async (page = 1, filters = activeFilters) => {
    try {
      setError(null);
      if (page === 1) {
        setIsLoading(true);
        setHasMorePages(true);
      } else {
        setIsLoadingMore(true);
      }

      // Ensure we have a valid token
      const token = await ensureValidToken(language);

      // Construct the query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        has_services: 'true',
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        distance: filters.distance.toString()
      });

      // Add services if they exist
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
      console.log('Location:', location);
      console.log('Filters:', filters);

      const response = await fetch(url, { headers });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response Data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch providers');
      }
      
      if (data.success) {
        // Handle null providers array
        const providersList = data.providers || [];
        
        // Filter out providers without services
        const providersWithServices = providersList.filter(provider => 
          provider && provider.services && Array.isArray(provider.services) && provider.services.length > 0
        );
        
        console.log('Filtered Providers Count:', providersWithServices.length);
        console.log('Original Providers Count:', providersList.length);
        
        if (page === 1) {
          setProviders(providersWithServices);
        } else {
          // Check for duplicates before adding new providers
          const existingIds = new Set(providers.map(p => p.id));
          const newProviders = providersWithServices.filter(p => !existingIds.has(p.id));
          setProviders(prev => [...prev, ...newProviders]);
        }
        
        // Update pagination state
        const pagination = data.pagination;
        setHasMorePages(pagination && pagination.current_page < pagination.total_pages);
        setCurrentPage(pagination ? pagination.current_page : 1);
      } else {
        console.log('No providers found or invalid response format');
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
      
      // Get location from AsyncStorage
      const location = await AsyncStorage.getItem('userLocation');
      const { latitude, longitude } = location ? JSON.parse(location) : { latitude: 0, longitude: 0 };

      // Ensure we have a valid token
      const token = await ensureValidToken(language);

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10',
        has_services: 'true',
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        name: query
      });

      const url = `${API_BASE_URL}/api/providers?${queryParams.toString()}`;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': language,
        'Accept': 'application/json',
      };

      console.log('=== Searching Providers ===');
      console.log('Search URL:', url);
      console.log('Search Headers:', headers);

      const response = await fetch(url, { headers });
      const data = await response.json();

      console.log('Search Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search providers');
      }

      if (data.success && data.data && Array.isArray(data.data.providers)) {
        // Filter out providers without services
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#86A8E7" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SafeAreaView style={styles.topSafeArea} edges={['top']}>
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
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'مقدمي الخدمات' : 'Service Providers'}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowSearch(true)}
            >
              <Ionicons name="search" size={24} color="#2A363B" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="options-outline" size={24} color="#2A363B" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topSafeArea: {
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A363B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
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
  providersList: {
    padding: 16,
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
    marginTop: 12
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
}); 