import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPicker from './components/LocationPicker';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function LocationScreen() {
  const router = useRouter();

  const handleLocationSelect = (location) => {
    try {
      console.log('Location selected:', location);
      
      if (!location || !location.addressName) {
        console.error('Invalid location data');
        return;
      }

      // First go back
      router.back();
      
      // Then update the params with a slight delay to ensure navigation completes
      setTimeout(() => {
        router.setParams({
          selectedLocation: {
            addressName: location.addressName,
            formattedAddress: location.formattedAddress,
            latitude: location.latitude,
            longitude: location.longitude
          }
        });
      }, 100);

    } catch (error) {
      console.error('Error handling location select:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LocationPicker
        isScreen={true}
        onClose={() => router.back()}
        onLocationSelect={handleLocationSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 