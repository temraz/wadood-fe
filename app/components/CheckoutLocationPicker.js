import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  I18nManager,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import * as Location from 'expo-location';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

const INITIAL_REGION = {
  latitude: 24.7136,
  longitude: 46.6753,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function CheckoutLocationPicker({ visible, onClose, onSelectLocation }) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_REGION);
  const [addressName, setAddressName] = useState('');

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      mapRef.current?.animateToRegion(region, 1000);
      setSelectedLocation(region);
    } catch (error) {
      Alert.alert('Error', 'Could not get your current location');
    }
  };

  const handleRegionChange = (region) => {
    setSelectedLocation(region);
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;
    
    if (!addressName.trim()) {
      Alert.alert('Error', 'Please enter a name for this address');
      return;
    }

    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });

      const formattedAddress = [
        address?.street,
        address?.city,
        address?.region,
        address?.country || 'Saudi Arabia'
      ].filter(Boolean).join(', ');

      const finalAddress = {
        name: addressName.trim(),
        address: formattedAddress,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        is_default: false
      };

      onSelectLocation(finalAddress);
      setAddressName('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Could not get address for selected location');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <SafeAreaView style={styles.container} edges={['top']}>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={onClose}
                >
                  <Ionicons 
                    name={isRTL ? "chevron-forward" : "chevron-back"}
                    size={24} 
                    color="#000" 
                  />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Location</Text>
                <View style={styles.headerSpacer} />
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={INITIAL_REGION}
                  onRegionChangeComplete={handleRegionChange}
                />
                
                <View style={styles.markerFixed}>
                  <View style={styles.markerContainer}>
                    <Ionicons name="location" size={40} color="#7F7FD5" />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.currentLocationButton}
                  onPress={getCurrentLocation}
                >
                  <View style={styles.locationButtonContainer}>
                    <Ionicons name="locate" size={24} color="#7F7FD5" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter address name (e.g., Home, Office, Gym)"
                  value={addressName}
                  onChangeText={setAddressName}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity 
                  style={[styles.confirmButton, !addressName.trim() && styles.confirmButtonDisabled]}
                  onPress={handleConfirmLocation}
                  disabled={!addressName.trim()}
                >
                  <Text style={styles.confirmButtonText}>
                    Confirm Location
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: MODAL_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40, // Offset the back button width to center the title
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixed: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
  },
  markerContainer: {
    alignItems: 'center',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  locationButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#000',
  },
  confirmButton: {
    height: 50,
    backgroundColor: '#7F7FD5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});