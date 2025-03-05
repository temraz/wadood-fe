import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from '../constants/api';
import Toast from 'react-native-toast-message';

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, []);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        headers: {
          'Accept-Language': language,
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.product) {
        setProduct(data.product);
      } else {
        setError('Failed to fetch product details');
      }
    } catch (error) {
      // console.error('Error fetching product:', error);
      setError('An error occurred while fetching product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      const result = await addToCart(product, product.provider_id, language);
      
      if (result.success) {
        // Toast.show({
        //   type: 'success',
        //   text1: t.products.addToCartSuccess,
        //   visibilityTime: 2000,
        // });
        router.back();
      } else {
        throw new Error(result.error || t.products.addToCartError);
      }
    } catch (error) {
      // console.error('Add to cart error:', error);
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: error.message || t.products.addToCartError,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#86A8E7" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error || 'Product not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchProductDetails}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={() => router.back({
              params: {
                shouldRefreshCart: true,
                timestamp: new Date().getTime()
              }
            })}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward-circle" : "arrow-back-circle"} 
              size={28} 
              color="#86A8E7" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          {/* Category */}
          <View style={[styles.categoryRow, isRTL && styles.rtlRow]}>
            <Ionicons name="pricetag" size={16} color="#86A8E7" />
            <Text style={[styles.category, isRTL && styles.rtlText]}>
              {isRTL ? product.category?.name_ar : product.category?.name}
            </Text>
          </View>

          {/* Product Name */}
          <Text style={[styles.name, isRTL && styles.rtlText]}>
            {isRTL ? product.name_ar : product.name}
          </Text>

          {/* Rating */}
          <View style={[styles.ratingRow, isRTL && styles.rtlRow]}>
            <View style={[styles.ratingStars, isRTL && styles.rtlRow]}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(product.rating) ? "star-sharp" : "star-outline"}
                  size={16}
                  color="#FFB347"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {product.rating?.toFixed(1)} ({product.total_ratings} {t.products.rating.reviews})
            </Text>
          </View>

          {/* Description */}
          <View style={[styles.descriptionContainer, isRTL && styles.rtlRow]}>
            <Ionicons name="information-circle" size={20} color="#86A8E7" style={styles.descriptionIcon} />
            <Text style={[styles.description, isRTL && styles.rtlText]}>
              {isRTL ? product.description_ar : product.description}
            </Text>
          </View>

          {/* Stock Status */}
          <View style={[styles.stockStatus, isRTL && styles.rtlRow]}>
            <Ionicons 
              name={product.stock > 0 ? "cube" : "cube-outline"} 
              size={20} 
              color={product.stock > 0 ? "#4ECDC4" : "#FF6B6B"} 
            />
            <Text style={[
              styles.stockText,
              { color: product.stock > 0 ? "#4ECDC4" : "#FF6B6B" }
            ]}>
              {product.stock > 0 ? t.products.inStock : t.products.outOfStock}
            </Text>
          </View>

          {/* Features/Specifications */}
          {product.specifications && (
            <View style={styles.specifications}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t.products.specifications}
              </Text>
              {Object.entries(product.specifications).map(([key, value]) => (
                <View key={key} style={[styles.specItem, isRTL && styles.rtlRow]}>
                  <Text style={[styles.specLabel, isRTL && styles.rtlText]}>{key}:</Text>
                  <Text style={[styles.specValue, isRTL && styles.rtlText]}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Provider Info */}
          {product.provider && (
            <View style={styles.providerSection}>
              <View style={[styles.sectionTitleRow, isRTL && styles.rtlRow]}>
                <Ionicons name="business" size={20} color="#86A8E7" />
                <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                  {t.products.soldBy}
                </Text>
              </View>
              <View style={[styles.providerInfo, isRTL && styles.rtlRow]}>
                <Image 
                  source={{ uri: product.provider.logo_url }} 
                  style={styles.providerLogo}
                />
                <View style={styles.providerDetails}>
                  <Text style={[styles.providerName, isRTL && styles.rtlText]}>
                    {isRTL ? product.provider.name_ar : product.provider.name}
                  </Text>
                  <View style={[styles.providerStats, isRTL && styles.rtlRow]}>
                    <View style={[styles.ratingContainer, isRTL && styles.rtlRow]}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.rating}>{product.provider.rating?.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.distance}>
                      {(product.provider.distance / 1000).toFixed(1)} km
                    </Text>
                  </View>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: product.provider.is_open ? '#4ECDC420' : '#FF6B6B20' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: product.provider.is_open ? '#4ECDC4' : '#FF6B6B' }
                  ]}>
                    {product.provider.is_open ? t.provider.orders.status.open : t.provider.orders.status.closed}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer with Price and Add to Cart */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, isRTL && styles.rtlText]}>
            {t.products.price}
          </Text>
          <Text style={[styles.price, isRTL && styles.rtlText]}>
            {product.price} SAR
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.addButton, !product.stock && styles.addButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!product.stock || isAddingToCart}
        >
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>
                {product.stock ? t.products.addToCart : t.products.outOfStock}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#86A8E7',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonRTL: {
    left: undefined,
    right: 16,
  },
  details: {
    padding: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  descriptionIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  specifications: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  specValue: {
    flex: 2,
    fontSize: 14,
    color: '#2A363B',
  },
  providerSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  providerStats: {
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
  },
  distance: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#86A8E7',
  },
  addButton: {
    flex: 2,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
}); 