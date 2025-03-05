import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Layout() {
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        const user = JSON.parse(userData);
        // Redirect based on user role
        if (user.role === 'superadmin') {
          router.replace('/providersSettings');
        } else if (user.role === 'user') {
          router.replace('/home');
        } else if (user.role === 'staff' || user.role === 'admin') {
          router.replace('/partnerHome');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaProvider>
        <CartProvider>
          <LanguageProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#fff' }
              }}
            >
              <Stack.Screen 
                name="home"
                options={{
                  headerShown: false,
                  navigationKey: useLocalSearchParams()?.reset ? Date.now().toString() : undefined,
                  animation: 'none'
                }}
              />
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="addStaff" />
              <Stack.Screen 
                name="orderRequests"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen 
                name="product/[id]"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="products"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen 
                name="petshops"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen 
                name="cart"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="(checkout)"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen 
                name="search"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen 
                name="providers"
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen 
                name="location"
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
            </Stack>
            <Toast />
          </LanguageProvider>
        </CartProvider>
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 