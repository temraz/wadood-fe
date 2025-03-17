import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.85;

export default function ProfileMenu({ visible, onClose, onLanguageChange }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-MENU_WIDTH)).current;
  const { language, toggleLanguage, t } = useLanguage();
  const isRTL = language === 'ar';
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    role: '',
    avatar: 'https://ui-avatars.com/api/?background=random'
  });

  useEffect(() => {
    if (visible) {
      loadUserData();
    }
  }, [visible]);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData({
          name: user.name || '',
          phone: user.phone || '',
          role: user.role || '',
          avatar: user.avatar || 'https://ui-avatars.com/api/?background=random'
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -MENU_WIDTH,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLanguageChange = async (newLang) => {
    if (newLang !== language) {
      await toggleLanguage();
      onClose();
      // Reload the app to apply RTL changes
      try {
        await Updates.reloadAsync();
      } catch (error) {
        console.log('Error reloading app:', error);
      }
    }
  };

  const handleNavigation = (route) => {
    onClose();
    router.push(route);
  };

  const handleLogout = async () => {
    try {
      // Clear all authentication data
      await AsyncStorage.multiRemove([
        'token',
        'refresh_token',
        'user',
        'providerToken'
      ]);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: t.common.menu.logoutSuccess || 'Logged out successfully',
        visibilityTime: 2000,
      });
      
      // Close the menu
      onClose();
      
      // Redirect to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: t.common.menu.logoutError || 'Error logging out. Please try again.',
      });
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            left: 0,
          }
        ]}
        {...panResponder.panHandlers}
      >
        <LinearGradient
          colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
            <Text style={styles.name}>{userData.name}</Text>
            <Text style={[styles.phone, isRTL && styles.rtlText]}>
              <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.8)" />
              {' '}{userData.phone}
            </Text>
            {userData.role && (
              <View style={styles.roleTag}>
                <Text style={styles.roleText}>{userData.role}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.menuContainer}>
          <ScrollView 
            style={styles.menuItems}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <TouchableOpacity 
              style={[styles.menuItem, isRTL && styles.rtlRow]}
              onPress={() => {
                onClose();
                router.push('/profile');
              }}
            >
              <Ionicons name="person-outline" size={24} color="#86A8E7" />
              <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>Profile</Text>
            </TouchableOpacity>

            {userData.role === 'driver' && (
              <TouchableOpacity 
                style={[styles.menuItem, isRTL && styles.rtlRow]}
                onPress={() => {
                  onClose();
                  router.push('/orders');
                }}
              >
                <Ionicons name="bicycle-outline" size={24} color="#86A8E7" />
                <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>
                  {t.common.menu.myDeliveries || 'My Deliveries'}
                </Text>
              </TouchableOpacity>
            )}

            {userData.role === 'user' && (
              <>
                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/orders');
                  }}
                >
                  <Ionicons name="receipt-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>
                    {t.common.menu.myOrders || 'My Orders'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/servicesHome');
                  }}
                >
                  <Ionicons name="paw-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>
                    {t.common.menu.services || 'Services'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {userData.role === 'admin' && (
              <>
                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/staff');
                  }}
                >
                  <Ionicons name="people-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>Manage Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/servicesSettings');
                  }}
                >
                  <Ionicons name="construct-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>Services Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/productsSettings');
                  }}
                >
                  <Ionicons name="cube-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>Products Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, isRTL && styles.rtlRow]}
                  onPress={() => {
                    onClose();
                    router.push('/analytics');
                  }}
                >
                  <Ionicons name="bar-chart-outline" size={24} color="#86A8E7" />
                  <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>Analytics</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={[styles.menuItem, isRTL && styles.rtlRow]}
              onPress={() => {
                onClose();
                router.push('/privacy-policy');
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color="#86A8E7" />
              <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>
                {t.common.menu.privacyPolicy || 'Privacy Policy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, isRTL && styles.rtlRow]} onPress={toggleLanguage}>
              <Ionicons name="language-outline" size={24} color="#86A8E7" />
              <View style={[styles.languageSelector, isRTL && styles.rtlLanguageSelector]}>
                <Text style={[styles.menuText, isRTL && styles.rtlMenuText]}>{t.common.menu.language}</Text>
                <View style={styles.languageOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.langOption,
                      language === 'en' && styles.langOptionSelected
                    ]}
                    onPress={() => handleLanguageChange('en')}
                  >
                    <Text style={[
                      styles.langText,
                      language === 'en' && styles.langTextSelected
                    ]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.langOption,
                      language === 'ar' && styles.langOptionSelected
                    ]}
                    onPress={() => handleLanguageChange('ar')}
                  >
                    <Text style={[
                      styles.langText,
                      language === 'ar' && styles.langTextSelected
                    ]}>عربي</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem, isRTL && styles.rtlRow]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.menuText, styles.logoutText, isRTL && styles.rtlMenuText]}>
                {t.common.menu.logout}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <Text style={[styles.version, isRTL && styles.rtlText]}>{t.common.menu.version} 1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    backgroundColor: '#fff',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 24,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
    paddingBottom: 30,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  menuContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuItems: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  menuText: {
    fontSize: 16,
    color: '#2A363B',
    marginLeft: 12,
    fontWeight: '500',
  },
  languageSelector: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 12,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  langOptionSelected: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
  langText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  langTextSelected: {
    color: '#fff',
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#FF6B6B',
  },
  version: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
    fontSize: 12,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlMenuText: {
    marginLeft: 0,
    marginRight: 12,
    textAlign: 'right',
  },
  rtlLanguageSelector: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: 12,
  },
  roleTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
}); 