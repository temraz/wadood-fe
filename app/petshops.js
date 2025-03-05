import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  I18nManager,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, ensureValidToken } from './constants/api';

export default function PetShopsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollY = new Animated.Value(0);
  
  // Parse location parameters with fallbacks
  const location = useMemo(() => ({
    latitude: parseFloat(params.latitude) || 0,
    longitude: parseFloat(params.longitude) || 0,
    distance: parseInt(params.distance) || 10
  }), [params.latitude, params.longitude, params.distance]);

  useEffect(() => {
    fetchShops(1);
  }, []); // Only run on mount

  useEffect(() => {
    if (location.latitude && location.longitude) {
      fetchShops(1);
    }
  }, [location.latitude, location.longitude]); // Only run when location changes

  useEffect(() => {
    filterShops();
  }, [searchQuery, shops]);

  const filterShops = () => {
    if (!searchQuery.trim()) {
      setFilteredShops(shops);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = shops.filter(shop => {
      const nameEn = shop.name?.toLowerCase() || '';
      const nameAr = shop.name_ar?.toLowerCase() || '';
      return nameEn.includes(query) || nameAr.includes(query);
    });

    setFilteredShops(filtered);
  };

  const loadUserLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        setUserLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const fetchShops = async (page) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const token = await ensureValidToken(language);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        has_products: 'true',
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        distance: location.distance.toString()
      }).toString();

      console.log('Fetching shops with params:', queryParams);

      const response = await fetch(`${API_BASE_URL}/api/providers?${queryParams}`, {
        headers: {
          'Accept-Language': language,
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Shops API response:', data);

      if (data.success) {
        // Handle null providers array
        const shopsList = data.providers || [];
        
        if (page === 1) {
          setShops(shopsList);
          setFilteredShops(shopsList);
        } else {
          setShops(prev => [...prev, ...shopsList]);
          setFilteredShops(prev => [...prev, ...shopsList]);
        }
        
        // Check if we have more pages based on pagination data
        const pagination = data.pagination || {};
        const hasMore = pagination.current_page < pagination.total_pages;
        setHasMorePages(hasMore);
        setCurrentPage(pagination.current_page || page);
      } else {
        setError(data.message || 'Failed to fetch pet shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setError('An error occurred while fetching pet shops');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleLoadMore = () => {
    if (!searchQuery && !isLoadingMore && hasMorePages) {
      fetchShops(currentPage + 1);
    }
  };

  const renderShopCard = ({ item: shop }) => (
    <TouchableOpacity 
      style={styles.shopCard}
      onPress={() => router.push({
        pathname: '/products',
        params: { 
          id: shop.id,
          shop: JSON.stringify(shop)
        }
      })}
    >
      <View style={styles.shopContent}>
        <View style={styles.shopHeader}>
          <Image 
            source={{ uri: shop.logo_url }} 
            style={styles.shopLogo}
          />
          <View style={styles.shopInfo}>
            <Text style={styles.shopName} numberOfLines={1}>
              {language === 'ar' ? shop.name_ar : shop.name}
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(shop.rating) ? 'star' : 'star-outline'}
                  size={12}
                  color="#FFD700"
                />
              ))}
              <Text style={styles.ratingText}>
                ({shop.total_ratings})
              </Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: shop.is_open ? '#4ECDC4' : '#FF6B6B' }
          ]}>
            <Text style={styles.statusText}>
              {shop.is_open ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.shopStats}>
          <View style={styles.statItem}>
            <Ionicons name="cube" size={16} color="#86A8E7" />
            <Text style={styles.statText}>
              {shop.number_of_products} Products
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="location" size={16} color="#86A8E7" />
            <Text style={styles.statText}>
              {(shop.distance / 1000).toFixed(1)} km
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#86A8E7" />
            <Text style={styles.statText}>
              {shop.delivery_time || '30-45'} min
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#86A8E7" />
      </View>
    );
  };

  return (
    <>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
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
          <Text style={styles.headerTitle}>
            Pet Shops
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#86A8E7" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pet shops..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#666"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#86A8E7" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchShops(1)}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.FlatList
            data={filteredShops}
            renderItem={renderShopCard}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="paw" size={64} color="#ccc" />
                <Text style={styles.emptyTitle}>No Pet Shops Found</Text>
                <Text style={styles.emptyText}>
                  Try adjusting your search or location
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2A363B',
  },
  shopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  shopContent: {
    gap: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  shopStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#86A8E7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A363B',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 