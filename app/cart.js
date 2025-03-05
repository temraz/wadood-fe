import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from './context/LanguageContext';
import { useCart } from './context/CartContext';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const CartItem = React.memo(({ item, onUpdateQuantity, isUpdating }) => {
  return (
    <View key={item.id} style={styles.cartItem}>
      {item.product_image && (
        <Image 
          source={{ uri: item.product_image }}
          style={styles.itemImage}
        />
      )}
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>
          {item.product_name || `Item #${item.id}`}
        </Text>
        <Text style={styles.itemPrice}>
          {item.price} SAR
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isUpdating}
          >
            <Ionicons name="remove" size={20} color="#86A8E7" />
          </TouchableOpacity>
          
          <View style={styles.quantityDisplay}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="#86A8E7" />
            ) : (
              <Text style={styles.quantity}>{item.quantity}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isUpdating}
          >
            <Ionicons name="add" size={20} color="#86A8E7" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const CartItemsList = React.memo(({ items, onUpdateQuantity, updatingItems }) => {
  return (
    <ScrollView style={styles.content}>
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          isUpdating={updatingItems[item.id]}
        />
      ))}
    </ScrollView>
  );
});

const CartTotal = React.memo(({ total, onCheckout, t }) => {
  return (
    <View style={styles.footer}>
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>{t.cart.total}</Text>
        <Text style={styles.totalPrice}>{total} SAR</Text>
      </View>
      <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
        <LinearGradient
          colors={['#86A8E7', '#7F7FD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.checkoutGradient}
        >
          <Text style={styles.checkoutButtonText}>
            {t.cart.checkout}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

export default function CartScreen() {
  const { cartId: providerId } = useLocalSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const { fetchCartData, updateQuantity, removeFromCart } = useCart();
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState({});

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await ensureValidToken(language);
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart?provider_id=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setCart(data.cart);
      } else {
        setCart(null);
      }
    } catch (error) {
      // console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [providerId, language]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const updateItemQuantity = async (itemId, newQuantity) => {
    try {
      setUpdatingItems(prev => ({ ...prev, [itemId]: true }));
      
      // Update local state immediately for better UX
      const currentItem = cart.items.find(item => item.id === itemId);
      if (!currentItem) return;

      // Update local state optimistically
      setCart(prevCart => ({
        ...prevCart,
        items: prevCart.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      }));
      
      if (newQuantity <= 0) {
        const success = await removeFromCart(itemId, providerId, language);
        if (success) {
          // Remove item from local state
          setCart(prevCart => ({
            ...prevCart,
            items: prevCart.items.filter(item => item.id !== itemId)
          }));
        } else {
          // Revert local state if operation failed
          setCart(prevCart => ({
            ...prevCart,
            items: prevCart.items.map(item =>
              item.id === itemId ? { ...item, quantity: currentItem.quantity } : item
            )
          }));
        }
      } else {
        const success = await updateQuantity(itemId, newQuantity, providerId, language);
        if (!success) {
          // Revert local state if operation failed
          setCart(prevCart => ({
            ...prevCart,
            items: prevCart.items.map(item =>
              item.id === itemId ? { ...item, quantity: currentItem.quantity } : item
            )
          }));
        }
      }
      
      // Refresh cart data to ensure consistency
      await fetchCart();
    } catch (error) {
      // console.error('Error updating quantity:', error);
      Toast.show({
        type: 'error',
        text1: t.common.error,
        text2: error.message || t.cart.updateError,
      });
      // Refresh cart to ensure consistent state
      await fetchCart();
    } finally {
      setUpdatingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleCheckout = () => {
    if (!cart) {
      setError('Cart is empty');
      return;
    }

    console.log('Navigating to checkout with cart_id:', cart.id, 'provider_id:', providerId);
    router.push(`/checkout?cart_id=${cart.id}&provider_id=${providerId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#86A8E7" />
      </View>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
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
          <Text style={styles.headerTitle}>{t?.cart?.title || 'Cart'}</Text>
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
        <Text style={styles.headerTitle}>{t?.cart?.title || 'Cart'}</Text>
        <View style={styles.placeholder} />
      </View>

      {(!cart.items || cart.items.length === 0) ? (
        <View style={styles.emptyCartContainer}>
          <Ionicons name="cart-outline" size={64} color="#86A8E7" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => router.back()}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueShoppingGradient}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CartItemsList
            items={cart.items}
            onUpdateQuantity={updateItemQuantity}
            updatingItems={updatingItems}
          />
          <CartTotal
            total={cart.price}
            onCheckout={handleCheckout}
            t={t}
          />
        </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  placeholder: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A363B',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86A8E7',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityDisplay: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
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
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#86A8E7',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  continueShoppingButton: {
    width: '100%',
    maxWidth: 250,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueShoppingGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueShoppingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 