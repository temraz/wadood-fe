import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  I18nManager,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckoutLocationPicker from './CheckoutLocationPicker';
import { API_BASE_URL, ensureValidToken } from '../constants/api';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

const AddressItem = ({ address, onSelect, onDelete, onSetDefault, isRTL, t }) => (
  <TouchableOpacity 
    style={styles.addressItem}
    onPress={() => onSelect(address)}
  >
    <View style={styles.addressContent}>
      <View style={styles.addressHeader}>
        <Text style={styles.addressName}>{address.name}</Text>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>{t.home.location.defaultAddress}</Text>
          </View>
        )}
      </View>
      <Text style={styles.addressText}>{address.address}</Text>
      
      {!address.is_default && (
        <TouchableOpacity 
          style={styles.setDefaultButton}
          onPress={(e) => {
            e.stopPropagation();
            onSetDefault(address.id);
          }}
        >
          <Text style={styles.setDefaultText}>{t.home.location.setAsDefault}</Text>
        </TouchableOpacity>
      )}
    </View>
    
    <TouchableOpacity 
      style={styles.deleteButton}
      onPress={(e) => {
        e.stopPropagation();
        onDelete(address.id);
      }}
    >
      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
    </TouchableOpacity>
  </TouchableOpacity>
);

export default function AddressSheet({ visible, onClose, onSelectLocation, language }) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      fetchAddresses();
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        }
      });

      const data = await response.json();
      if (data.success) {
        setAddresses(data.addresses);
      } else {
        console.error('Failed to fetch addresses:', data.message);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewAddress = () => {
    setShowLocationPicker(true);
  };

  const handleLocationSelect = async (location) => {
    try {
      setShowLocationPicker(false);
      setIsLoading(true);
      
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          is_default: addresses.length === 0, // Make first address default
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses(); // Refresh the address list
        onSelectLocation(data.address);
        onClose();
      } else {
        Alert.alert('Error', data.message || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address) => {
    onSelectLocation(address);
    onClose();
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses(); // Refresh the list after deletion
      } else {
        Alert.alert('Error', data.message || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      Alert.alert('Error', 'Failed to delete address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      
      const response = await fetch(`${API_BASE_URL}/api/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchAddresses(); // Refresh the list to show updated default status
      } else {
        Alert.alert('Error', data.message || 'Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Error', 'Failed to set default address. Please try again.');
    } finally {
      setIsLoading(false);
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
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom,
          }
        ]}
      >
        <BlurView intensity={80} style={styles.content}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{t.home.location.deliveryAddress}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2A363B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.addressList}>
            <TouchableOpacity 
              style={styles.addNewButton}
              onPress={handleAddNewAddress}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#86A8E7', '#7F7FD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addNewGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addNewText}>{t.home.location.addNewAddress}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {addresses.map((address) => (
              <AddressItem
                key={address.id}
                address={address}
                onSelect={handleSelectAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefaultAddress}
                isRTL={I18nManager.isRTL}
                t={t}
              />
            ))}
          </ScrollView>
        </BlurView>
      </Animated.View>

      <CheckoutLocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleLocationSelect}
      />
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
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  addressList: {
    flex: 1,
    padding: 16,
  },
  addNewButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addNewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  addNewText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addressItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
  },
  addressContent: {
    flex: 1,
    marginRight: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  defaultBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  setDefaultButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    // position: 'absolute',
    // left: 0,
    // bottom: 0,
  },
  setDefaultText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
}); 