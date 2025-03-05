import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  I18nManager,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import ProductCard from './components/ProductCard';
import { API_BASE_URL, getHeaders, ensureValidToken } from './constants/api';
import { useCart } from './context/CartContext';

// Mock products data - you can expand this
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Royal Canin Premium Food',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 79.99,
    rating: 4.8,
    reviews: 245,
    category: 'food',
    badge: 'Popular',
    description: 'Premium quality pet food with balanced nutrition'
  },
  {
    id: 'p2',
    name: 'Cozy Pet Bed',
    image: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 49.99,
    rating: 4.6,
    reviews: 189,
    category: 'beds',
    badge: 'New',
    description: 'Ultra-comfortable bed for your furry friend'
  },
  {
    id: 'p3',
    name: 'Interactive Cat Toy',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 24.99,
    rating: 4.7,
    reviews: 156,
    category: 'toys',
    description: 'Engaging toy for active cats'
  },
  {
    id: 'p4',
    name: 'Pet Grooming Kit',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 34.99,
    rating: 4.5,
    reviews: 178,
    category: 'grooming',
    description: 'Complete grooming set for pets'
  },
  {
    id: 'p5',
    name: 'Stylish Pet Collar',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 19.99,
    rating: 4.4,
    reviews: 134,
    category: 'accessories',
    description: 'Durable and fashionable collar'
  },
  {
    id: 'p6',
    name: 'Pet Health Supplements',
    image: 'https://images.unsplash.com/photo-1512341689857-198e7e2f3ca8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 29.99,
    rating: 4.7,
    reviews: 167,
    category: 'health',
    description: 'Essential vitamins for pet health'
  },
  {
    id: 'p7',
    name: 'Training Treats Pack',
    image: 'https://images.unsplash.com/photo-1582798358481-d199fb7347bb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 14.99,
    rating: 4.9,
    reviews: 342,
    category: 'treats',
    description: 'Perfect for training rewards'
  },
  {
    id: 'p8',
    name: 'Pet Stain Remover',
    image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    price: 19.99,
    rating: 4.5,
    reviews: 213,
    category: 'cleaning',
    description: 'Effective stain and odor removal'
  },
  // Add more products...
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const SHOP = {
  name: "Pet Food Express",
  logo: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  rating: 4.6,
  distance: "1.8 km",
  isOpen: true,
  products: 180
};

export default function ProductsScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const { id, shop, shouldRefreshCart, timestamp } = useLocalSearchParams();
  const { cartItems, cartCount, fetchCartData } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shopData, setShopData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch shop data and products only once when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the token
        const token = await ensureValidToken(language);
        
        // Fetch categories first
        await fetchCategories();
        
        // Parse shop data if available
        if (shop) {
          try {
            const parsedShopData = JSON.parse(shop);
            if (parsedShopData && parsedShopData.id) {
              setShopData(parsedShopData);
              // Fetch products for the shop
              await fetchProducts(parsedShopData.id, 1);
            } else {
              throw new Error('Invalid shop data');
            }
          } catch (parseError) {
            console.error('Error parsing shop data:', parseError);
            setError('Invalid shop data format');
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Only filter products when criteria change and products exist
  useEffect(() => {
    if (products && products.length > 0) {
      const filtered = filterProducts();
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [selectedCategory, selectedSort, searchQuery, products]);

  const fetchProducts = async (providerId, pageNum = 1) => {
    if (!providerId) {
      console.error('No provider ID provided for fetching products');
      return;
    }

    try {
      const token = await ensureValidToken(language);
      const url = `${API_BASE_URL}/api/products?page=${pageNum}&limit=10&provider_id=${providerId}`;
      
      // console.log('Fetching products:', { page: pageNum, providerId, url });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      // console.log('Products response:', data);

      if (data.products) {
        if (pageNum === 1) {
          setProducts(data.products);
          setPage(1);
        } else {
          setProducts(prev => [...prev, ...data.products]);
          setPage(pageNum);
        }
        setHasMore(pageNum < data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products');
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === parseInt(selectedCategory));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    // Sort products
    switch (selectedSort) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      // 'popular' is default, no need to sort
    }

    return filtered;
  };

  const fetchCategories = async () => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        headers: getHeaders(language)
      });

      const data = await response.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        throw new Error(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.message);
    }
  };

  const renderProduct = ({ item }) => {
    // console.log('Rendering product:', item.id);
    return (
      <ProductCard 
        product={item} 
        categories={categories}
        style={styles.productCard}
      />
    );
  };

  const getIconName = (icon) => {
    return icon || 'paw-outline'; // Default icon if none provided
  };

  // Update the useEffect for cart refresh
  useEffect(() => {
    const checkCart = async () => {
      if (shopData?.id) {
        // console.log('Checking cart for provider:', shopData.id);
        try {
          const cartData = await fetchCartData(shopData.id, language);
          // console.log('Cart data received:', cartData);
        } catch (error) {
          console.error('Error checking cart:', error);
        }
      }
    };

    checkCart();
  }, [shopData, shouldRefreshCart, timestamp]);

  // Update the FlatList onEndReached handler
  const handleLoadMore = () => {
    if (hasMore && !isLoading && shopData?.id) {
      const nextPage = page + 1;
      fetchProducts(shopData.id, nextPage);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={[styles.headerMain, isRTL && styles.rtlRow]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons 
                name={isRTL ? "chevron-forward" : "chevron-back"} 
                size={24} 
                color="#86A8E7" 
              />
            </TouchableOpacity>

            {shopData && (
              <View style={styles.shopInfo}>
                <Image 
                  source={{ uri: shopData.logo_url }} 
                  style={styles.shopLogo}
                />
                <View style={styles.shopDetails}>
                  <Text style={styles.shopName}>
                    {language === 'ar' ? shopData.name_ar : shopData.name}
                  </Text>
                  <View style={styles.shopStats}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.rating}>{shopData.rating?.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.distance}>{shopData.distance} km</Text>
                    <View style={styles.statusBadge}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: shopData.is_open ? '#4ECDC4' : '#FF6B6B' }
                      ]} />
                      <Text style={styles.statusText}>
                        {shopData.is_open ? t.provider.orders.status.open : t.provider.orders.status.closed}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Ionicons 
                name="cube-outline" 
                size={20} 
                color={selectedCategory === 'all' ? '#fff' : '#86A8E7'} 
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.categoryButtonTextSelected
              ]}>
                {language === 'ar' ? 'الكل' : 'All'}
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonSelected
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons 
                  name={getIconName(category.icon)} 
                  size={20} 
                  color={selectedCategory === category.id ? '#fff' : '#86A8E7'} 
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.categoryButtonTextSelected
                ]}>
                  {language === 'ar' ? category.name_ar : category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortContainer}>
            <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
              <Ionicons name="search" size={20} color="#86A8E7" />
              <TextInput
                style={[styles.searchInput, isRTL && styles.rtlText]}
                placeholder={t.products.searchPlaceholder || "Search products..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.productRow}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              return hasMore && !isLoading ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#86A8E7" />
                </View>
              ) : null;
            }}
            ListEmptyComponent={
              isLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color="#86A8E7" />
                </View>
              ) : error ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
                  <Text style={styles.emptyStateText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    {t.products.noProducts || "No products found"}
                  </Text>
                </View>
              )
            }
          />
        </View>

        {/* Cart Button - Always show, badge only when items exist */}
        {shopData && (
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => router.push({
              pathname: '/cart',
              params: { cartId: shopData.id }
            })}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              style={styles.cartGradient}
            >
              <Ionicons name="cart" size={24} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  shopLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  shopStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  distance: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A363B',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContainer: {
    padding: 16,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: '#86A8E7',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  sortContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2A363B',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  productsGrid: {
    padding: 16,
    gap: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '47%',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  cartButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cartGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginHorizontal: 16,
  },
  errorText: {
    color: '#FF6B6B',
    marginHorizontal: 16,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}); 