import React from 'react';
import { Image, View, StyleSheet, Text, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const ProductCard = ({ product, categories = [], style }) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return isRTL ? category?.name_ar : category?.name;
  };

  // Add debug logging to check provider status
  console.log('Product provider status:', {
    productId: product.id,
    providerStatus: product.provider?.is_open,
    provider: product.provider
  });

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        style,
        product.provider?.is_open === false && styles.disabledCard
      ]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: product.image_url,
            cache: 'force-cache'
          }}
          style={[
            styles.image,
            product.provider?.is_open === false && styles.disabledImage
          ]}
          resizeMode="cover"
        />
        {product.provider?.is_open === false && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>
              {t.provider.orders.status.closed || 'Closed'}
            </Text>
          </View>
        )}
        {product.badge && (
          <View style={[styles.badgeContainer, isRTL && styles.badgeContainerRTL]}>
            <LinearGradient
              colors={['#FF6B6B', '#FFA07A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.badge}
            >
              <Text style={styles.badgeText}>{product.badge}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.details}>
          <Text style={styles.category}>
            {getCategoryName(product.category_id)}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {isRTL ? product.name_ar : product.name}
          </Text>
          <View style={[styles.rating]}>
            <Ionicons name="star" size={14} color="#FFB347" />
            <Text style={[styles.ratingText, isRTL && styles.rtlText]}>
              {product.rating} ({product.total_ratings} {t.products.rating.reviews})
            </Text>
          </View>
        </View>
        <Text style={[styles.price, isRTL && styles.rtlText]}>
          {isRTL ? `${product.price} ريال` : `${product.price} SAR`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// A simple blurhash placeholder
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    padding: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  details: {
    gap: 1,
  },
  category: {
    fontSize: 10,
    color: '#86A8E7',
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 1,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingRTL: {
    flexDirection: 'row-reverse',
  },
  ratingText: {
    fontSize: 10,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#86A8E7',
    marginTop: 'auto',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badgeContainerRTL: {
    left: undefined,
    right: 12,
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
  rtlText: {
    textAlign: 'right',
  },
  disabledCard: {
    opacity: 0.7,
  },
  disabledImage: {
    opacity: 0.5,
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

export default ProductCard; 