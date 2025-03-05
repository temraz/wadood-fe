import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from './context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from './constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [cityId, setCityId] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user data from AsyncStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setName(userData.name || '');
          setEmail(userData.email || '');
          setGender(userData.gender || '');
          setCityId(userData.city_id);
          
          // Fetch cities first if not available
          if (cities.length === 0) {
            const response = await fetch(`${API_BASE_URL}/api/cities`, {
              headers: {
                'Accept-Language': language
              }
            });
            const data = await response.json();
            if (data.success) {
              setCities(data.data);
              // Find and set selected city
              const userCity = data.data.find(city => city.id === userData.city_id);
              if (userCity) {
                setSelectedCity(userCity);
              }
            }
          } else {
            // Find and set selected city from existing cities
            const userCity = cities.find(city => city.id === userData.city_id);
            if (userCity) {
              setSelectedCity(userCity);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [cities, language]);

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cities`, {
        headers: {
          'Accept-Language': language
        }
      });
      const data = await response.json();
      if (data.success) {
        setCities(data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert('Error', 'Failed to fetch cities');
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        }
      });
      const data = await response.json();
      if (data.success) {
        const profile = data.data;
        setName(profile.name);
        setEmail(profile.email);
        setGender(profile.gender);
        setCityId(profile.city_id);
        const city = cities.find(c => c.id === profile.city_id);
        setSelectedCity(city);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !gender || !cityId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      setIsSaving(true);
      const token = await ensureValidToken(language);
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept-Language': language
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          gender,
          city_id: cityId
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update local storage with new user data
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const updatedUserData = {
            ...userData,
            name: name.trim(),
            email: email.trim(),
            gender,
            city_id: cityId
          };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        }

        Alert.alert(
          'Success',
          'Your profile has been updated successfully.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Get the token and user data
              const token = await ensureValidToken(language);
              const userDataString = await AsyncStorage.getItem('user');
              
              if (!userDataString || !token) {
                Alert.alert('Error', 'Authentication required. Please login again.');
                router.replace('/login');
                return;
              }

              const userData = JSON.parse(userDataString);
              
              // Delete the user account
              const response = await fetch(`${API_BASE_URL}/api/users/${userData.id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept-Language': language
                }
              });

              const data = await response.json();
              
              if (data.success) {
                // Clear all stored data
                await AsyncStorage.multiRemove([
                  'token',
                  'refresh_token',
                  'user',
                  'providerToken'
                ]);
                
                Alert.alert(
                  'Success',
                  'Your account has been deleted successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.replace('/login')
                    }
                  ]
                );
              } else {
                throw new Error(data.message || 'Failed to delete account');
              }
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to delete account. Please try again.'
              );
            }
          }
        }
      ]
    );
  };

  const renderGenderPicker = () => (
    <Modal
      visible={showGenderPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowGenderPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowGenderPicker(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.cityList}>
            {['male', 'female'].map((genderOption) => (
              <TouchableOpacity
                key={genderOption}
                style={[
                  styles.cityItem,
                  gender === genderOption && styles.cityItemSelected
                ]}
                onPress={() => {
                  setGender(genderOption);
                  setShowGenderPicker(false);
                }}
              >
                <Text style={[
                  styles.cityItemText,
                  gender === genderOption && styles.cityItemTextSelected
                ]}>
                  {genderOption.charAt(0).toUpperCase() + genderOption.slice(1)}
                </Text>
                {gender === genderOption && (
                  <Ionicons name="checkmark" size={24} color="#86A8E7" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCityPicker = () => (
    <Modal
      visible={showCityPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCityPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select City</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCityPicker(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.cityList}>
            {cities.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={[
                  styles.cityItem,
                  selectedCity?.id === city.id && styles.cityItemSelected
                ]}
                onPress={() => {
                  setSelectedCity(city);
                  setCityId(city.id);
                  setShowCityPicker(false);
                }}
              >
                <Text style={[
                  styles.cityItemText,
                  selectedCity?.id === city.id && styles.cityItemTextSelected
                ]}>
                  {city.name}
                </Text>
                {selectedCity?.id === city.id && (
                  <Ionicons name="checkmark" size={24} color="#86A8E7" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderGenderField = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Gender</Text>
      <TouchableOpacity
        style={styles.citySelector}
        onPress={() => setShowGenderPicker(true)}
      >
        <Text style={styles.citySelectorText}>
          {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Select your gender"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderCityField = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>City</Text>
      <TouchableOpacity
        style={styles.citySelector}
        onPress={() => setShowCityPicker(true)}
      >
        <Text style={[
          styles.citySelectorText,
          !selectedCity && { color: '#999' }
        ]}>
          {selectedCity?.name || "Select your city"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#86A8E7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#86A8E7" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 40 }} /> {/* Spacer for alignment */}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter your email"
              placeholderTextColor="#999"
            />
          </View>

          {renderGenderField()}
          {renderCityField()}
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderCityPicker()}
      {renderGenderPicker()}

      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isSaving}
      >
        <LinearGradient
          colors={['#86A8E7', '#7F7FD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 160,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backButton: {
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
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2A363B',
  },
  citySelector: {
    height: 48,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  citySelectorText: {
    fontSize: 16,
    color: '#2A363B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  closeButton: {
    padding: 4,
  },
  cityList: {
    padding: 12,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cityItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  cityItemText: {
    fontSize: 16,
    color: '#2A363B',
  },
  cityItemTextSelected: {
    color: '#86A8E7',
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  saveButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 