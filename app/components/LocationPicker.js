import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const SAVED_LOCATIONS = [
  {
    id: '1',
    name: 'home',
    address: 'King Fahd Road, Al Woroud, Riyadh',
    icon: 'home-outline',
    latitude: 24.7136,
    longitude: 46.6753,
  },
  {
    id: '2',
    name: 'work',
    address: 'Olaya Street, Al Olaya, Riyadh',
    icon: 'business-outline',
    latitude: 24.7117,
    longitude: 46.6746,
  },
  {
    id: '3',
    name: 'gym',
    address: 'Takhassusi Street, Al Mohammadiyyah, Riyadh',
    icon: 'fitness-outline',
    latitude: 24.7147,
    longitude: 46.6778,
  },
];

const SavedLocationItem = ({ location, onSelect, isRTL, t }) => (
  <TouchableOpacity 
    style={styles.savedLocationItem}
    onPress={() => onSelect(location)}
  >
    <View style={styles.savedLocationIcon}>
      <LinearGradient
        colors={['#86A8E7', '#7F7FD5']}
        style={styles.iconGradient}
      >
        <Ionicons name={location.icon} size={20} color="#fff" />
      </LinearGradient>
    </View>
    <View style={styles.savedLocationInfo}>
      <Text style={[styles.savedLocationName, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
        {t.home.location.savedAddresses[location.name]}
      </Text>
      <Text style={[styles.savedLocationAddress, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]} numberOfLines={1}>
        {location.address}
      </Text>
    </View>
  </TouchableOpacity>
);

const LocationPicker = ({ isScreen = false, onClose, onLocationSelect }) => {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [addressName, setAddressName] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(newStatus);
      }
    } catch (error) {
      console.log('Permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (locationPermission !== 'granted') {
        alert('Location permission is required');
        return;
      }

      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setSelectedLocation(region);
      mapRef.current?.animateToRegion(region, 1000);
    } catch (error) {
      console.log('Location error:', error);
      alert('Could not get your location. Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChange = (region) => {
    setSelectedLocation(region);
    reverseGeocode(region.latitude, region.longitude);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        const formattedAddress = [
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        
        setCurrentAddress(formattedAddress);
      }
    } catch (error) {
      console.log('Error getting address:', error);
    }
  };

  const handleConfirmLocation = () => {
    if (!selectedLocation) return;
    
    if (!showAddressInput) {
      setShowAddressInput(true);
      return;
    }

    if (addressName.trim()) {
      const locationData = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        addressName: addressName.trim(),
        formattedAddress: currentAddress,
      };
      
      console.log('Sending location data:', locationData);
      onLocationSelect(locationData);
    } else {
      Alert.alert('Name Required', 'Please give this location a name');
    }
  };

  const handleSavedLocationSelect = (location) => {
    const locationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      addressName: location.name,
      formattedAddress: location.address,
    };
    
    onLocationSelect(locationData);
  };

  const content = (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          {!isScreen && (
            <View style={styles.handle} />
          )}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons 
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={24} 
              color="#2A363B" 
            />
          </TouchableOpacity>
          <Text style={[styles.title, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
            {t.home.location.setLocation}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={selectedLocation}
            onRegionChangeComplete={handleRegionChange}
          />
          
          <View style={styles.markerFixed}>
            <View style={styles.markerContainer}>
              <View style={styles.markerShadow}>
                <LinearGradient
                  colors={['#86A8E7', '#7F7FD5']}
                  style={styles.markerBubble}
                >
                  <Ionicons name="location" size={24} color="#fff" />
                </LinearGradient>
              </View>
              <View style={styles.markerPulse} />
              <View style={styles.markerDot} />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              style={styles.locationButtonGradient}
            >
              <Ionicons name="locate" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!showAddressInput && (
          <View style={styles.savedLocationsContainer}>
            <Text style={[styles.savedLocationsTitle, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
              {t.home.location.savedLocations}
            </Text>
            <View style={styles.savedLocationsList}>
              {SAVED_LOCATIONS.map((location) => (
                <SavedLocationItem
                  key={location.id}
                  location={location}
                  onSelect={handleSavedLocationSelect}
                  isRTL={isRTL}
                  t={t}
                />
              ))}
            </View>
          </View>
        )}

        {showAddressInput && (
          <View style={styles.addressInputContainer}>
            <Text style={[styles.currentAddress, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>
              {currentAddress}
            </Text>
            <View style={[styles.inputContainer, isRTL && styles.rtlRow]}>
              <Ionicons name="home-outline" size={24} color="#666" />
              <TextInput
                style={[styles.addressInput, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
                placeholder={t.home.location.nameAddress}
                value={addressName}
                onChangeText={setAddressName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirmLocation}
              />
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.confirmButtonText}>
                {showAddressInput ? t.home.location.saveLocation : t.home.location.confirmLocation}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (isScreen) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {content}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -48 }],
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerShadow: {
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  markerBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7F7FD5',
    marginTop: -8,
    opacity: 0.3,
  },
  markerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7F7FD5',
    position: 'absolute',
    bottom: 0,
  },
  currentLocationButton: {
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
  locationButtonGradient: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7F7FD5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addressInputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  currentAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2A363B',
    paddingVertical: 8,
  },
  savedLocationsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  savedLocationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  savedLocationsList: {
    gap: 8,
    paddingHorizontal: 16,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  savedLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 2,
  },
  savedLocationAddress: {
    fontSize: 13,
    color: '#666',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
});

export default LocationPicker; 