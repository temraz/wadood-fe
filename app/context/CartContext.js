import React, { createContext, useContext, useState } from 'react';
import { API_BASE_URL, ensureValidToken } from '../constants/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cartId, setCartId] = useState(null);

  const fetchCartData = async (providerId, language) => {
    if (!providerId) {
      console.error('fetchCartData: No provider ID provided');
      return null;
    }

    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      console.log('Fetching cart data for provider:', providerId);
      
      const response = await fetch(`${API_BASE_URL}/api/cart?provider_id=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      const data = await response.json();
      console.log('Cart API Response:', data);
      
      if (data.success && data.cart) {
        const items = data.cart.items || [];
        const itemCount = items.length;
        console.log('Setting cart items:', items.length, 'items');
        setCartItems(items);
        setCartCount(itemCount);
        setCartId(data.cart.id);
        return data.cart;
      } else {
        console.log('No cart data found, resetting cart');
        setCartItems([]);
        setCartCount(0);
        return null;
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setCartCount(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product, providerId, language) => {
    if (!providerId || !product) {
      console.error('addToCart: Missing required parameters', { providerId, product });
      return { success: false, error: 'Missing required parameters' };
    }

    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      console.log('Adding to cart:', { productId: product.id, providerId });
      
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          provider_id: providerId,
          product_id: product.id,
          price: product.price,
          quantity: 1,
          order_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
      });

      const data = await response.json();
      console.log('Add to cart response:', data);

      if (data.success) {
        // After adding to cart, fetch the latest cart data
        const cartData = await fetchCartData(providerId, language);
        return { success: true, cart: cartData };
      }
      return { success: false, error: data.message };
    } catch (error) {
      console.error('Add to cart error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (itemId, providerId, language) => {
    if (!itemId || !providerId || !cartId) {
      console.error('removeFromCart: Missing required parameters', { itemId, providerId, cartId });
      return false;
    }

    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/cart/${cartId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Accept': 'application/json'
        }
      });

      const text = await response.text();
      console.log('Remove from cart response:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (error) {
        console.error('Remove from cart parse error:', error);
        // Even if parsing fails, update the local state
        setCartItems(prevItems => {
          const newItems = prevItems.filter(item => item.id !== itemId);
          setCartCount(newItems.length);
          return newItems;
        });
        return true;
      }
      
      if (data.success) {
        // Update local state and fetch latest data
        setCartItems(prevItems => {
          const newItems = prevItems.filter(item => item.id !== itemId);
          setCartCount(newItems.length);
          return newItems;
        });
        await fetchCartData(providerId, language);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Remove from cart error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity, providerId, language) => {
    if (!itemId || !providerId || !cartId) {
      console.error('updateQuantity: Missing required parameters', { itemId, providerId, cartId });
      return false;
    }

    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      // Get current item to compare quantities
      const currentItem = cartItems.find(item => item.id === itemId);
      if (!currentItem) return false;

      const isIncreasing = newQuantity > currentItem.quantity;
      
      // If quantity would become 0 or less, remove the item
      if (newQuantity <= 0) {
        return await removeFromCart(itemId, providerId, language);
      }

      const endpoint = `${API_BASE_URL}/api/cart/items/${isIncreasing ? 'increase' : 'reduce'}`;
      const requestConfig = {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_id: parseInt(cartId),
          item_id: parseInt(itemId)
        })
      };

      // Log curl equivalent for debugging
      console.log(`
=== Cart Update Request ===
Operation: ${isIncreasing ? 'Increase' : 'Reduce'}
curl --location --request PUT '${endpoint}' \\
--header 'Authorization: Bearer ${token}' \\
--header 'Accept-Language: ${language}' \\
--header 'Content-Type: application/json' \\
--data '${JSON.stringify({cart_id: parseInt(cartId), item_id: parseInt(itemId)})}'
=========================
      `);

      // Make API call to update quantity
      const response = await fetch(endpoint, requestConfig);

      const text = await response.text();
      console.log('Response:', text);

      try {
        // For reduce operation, we might get an empty response
        if (!isIncreasing && text.trim() === '') {
          // Consider empty response as success for reduce
          if (currentItem.quantity === 1) {
            setCartItems(prevItems => {
              const newItems = prevItems.filter(item => item.id !== itemId);
              setCartCount(newItems.length);
              return newItems;
            });
          } else {
            setCartItems(prevItems => {
              const newItems = prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
              );
              setCartCount(newItems.length);
              return newItems;
            });
          }
          await fetchCartData(providerId, language);
          return true;
        }

        const data = JSON.parse(text);
        if (data.success) {
          // For reduction, if it's the last item (quantity will be 0), remove it from cart
          if (!isIncreasing && currentItem.quantity === 1) {
            setCartItems(prevItems => {
              const newItems = prevItems.filter(item => item.id !== itemId);
              setCartCount(newItems.length);
              return newItems;
            });
          } else {
            // Update local state first for immediate feedback
            setCartItems(prevItems => {
              const newItems = prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
              );
              setCartCount(newItems.length);
              return newItems;
            });
          }
          // Then fetch latest data to ensure sync with server
          await fetchCartData(providerId, language);
          return true;
        } else {
          console.error('Update quantity failed:', data.message);
          return false;
        }
      } catch (error) {
        console.error('Update quantity parse error:', error);
        // If reduce operation and parse error, might be due to empty response
        if (!isIncreasing) {
          await fetchCartData(providerId, language);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const increaseQuantity = async (itemId, providerId, language) => {
    try {
      const currentItem = cartItems.find(item => item.id === itemId);
      if (!currentItem) return false;
      
      return await updateQuantity(itemId, currentItem.quantity + 1, providerId, language);
    } catch (error) {
      console.error('Increase quantity error:', error);
      return false;
    }
  };

  const decreaseQuantity = async (itemId, providerId, language) => {
    try {
      const currentItem = cartItems.find(item => item.id === itemId);
      if (!currentItem) return false;
      
      return await updateQuantity(itemId, currentItem.quantity - 1, providerId, language);
    } catch (error) {
      console.error('Decrease quantity error:', error);
      return false;
    }
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCartItems([]);
    setCartCount(0);
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      isLoading,
      addToCart,
      fetchCartData,
      removeFromCart,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      getTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
} 