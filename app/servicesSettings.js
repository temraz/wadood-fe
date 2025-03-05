import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API_BASE_URL, getHeaders } from './constants/api';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function ServicesSettingsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [providerServices, setProviderServices] = useState([]);
  const [initialProviderServices, setInitialProviderServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [serviceAtHomePrice, setServiceAtHomePrice] = useState('');
  const [serviceAtShopPrice, setServiceAtShopPrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchProviderServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: getHeaders(language)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      if (data.success) {
        setServices(data.services);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchProviderServices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      // Get provider ID from user data
      const userDataString = await AsyncStorage.getItem('user');
      if (!userDataString) {
        router.replace('/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      const providerId = userData.provider_id;

      if (!providerId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Provider ID not found',
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/services/provider/${providerId}`, {
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provider services');
      }

      const data = await response.json();
      if (data.success) {
        setProviderServices(data.services);
        setInitialProviderServices(data.services);
        setSelectedServices(data.services.map(s => s.service_id));
      }
    } catch (error) {
      console.error('Error fetching provider services:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch services',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkForChanges = (updatedServices) => {
    const initialServiceIds = new Set(initialProviderServices.map(s => s.service_id));
    const currentServiceIds = new Set(updatedServices.map(s => s.service_id));

    if (initialServiceIds.size !== currentServiceIds.size) {
      setHasChanges(true);
      return;
    }

    const hasServiceChanges = updatedServices.some(current => {
      const initial = initialProviderServices.find(s => s.service_id === current.service_id);
      return !initial || 
             initial.price_at_home !== current.price_at_home || 
             initial.price_at_shop !== current.price_at_shop || 
             initial.duration !== current.duration;
    });

    setHasChanges(hasServiceChanges);
  };

  const handleServiceToggle = (service) => {
    const isSelected = selectedServices.includes(service.id);
    
    if (isSelected) {
      setSelectedServices(prev => prev.filter(id => id !== service.id));
      const updatedProviderServices = providerServices.filter(
        ps => ps.service_id !== service.id
      );
      setProviderServices(updatedProviderServices);
      checkForChanges(updatedProviderServices);
      return;
    }

    setCurrentService(service);
    const existingService = getProviderServiceDetails(service.id);
    if (existingService) {
      setServiceAtHomePrice(existingService.price_at_home.toString());
      setServiceAtShopPrice(existingService.price_at_shop.toString());
      setServiceDuration(existingService.duration.toString());
    } else {
      setServiceAtHomePrice('');
      setServiceAtShopPrice('');
      setServiceDuration('');
    }
    setShowServiceModal(true);
  };

  const handleSaveService = async () => {
    if (!serviceAtHomePrice || !serviceAtShopPrice || !serviceDuration) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newService = {
      service_id: currentService.id,
      price_at_home: parseFloat(serviceAtHomePrice),
      price_at_shop: parseFloat(serviceAtShopPrice),
      duration: parseInt(serviceDuration),
      is_active: true
    };

    const existingIndex = providerServices.findIndex(
      ps => ps.service_id === currentService.id
    );

    let updatedServices;
    if (existingIndex >= 0) {
      updatedServices = [...providerServices];
      updatedServices[existingIndex] = newService;
    } else {
      updatedServices = [...providerServices, newService];
      setSelectedServices(prev => [...prev, currentService.id]);
    }

    setProviderServices(updatedServices);
    checkForChanges(updatedServices);
    setShowServiceModal(false);
  };

  const handleSaveAllServices = async () => {
    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      // Get provider ID from user data
      const userDataString = await AsyncStorage.getItem('user');
      if (!token || !userDataString) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication required. Please login again.',
        });
        router.replace('/login');
        return;
      }

      const userData = JSON.parse(userDataString);
      const providerId = userData.provider_id;
      console.log('providerId', providerId);
      if (!providerId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Provider ID not found',
        });
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/providers/services`, {
        method: 'POST',
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider_id: parseInt(providerId),
          services: providerServices
        })
      });

      const data = await response.json();
      if (data.success) {
        setInitialProviderServices(providerServices);
        setHasChanges(false);
        Toast.show({
          type: 'success',
          text1: 'Services updated successfully',
        });
      } else {
        throw new Error(data.message || 'Failed to update services');
      }
    } catch (error) {
      console.error('Save services error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to update services',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getProviderServiceDetails = (serviceId) => {
    return providerServices.find(ps => ps.service_id === serviceId);
  };

  const getIconBackground = (icon) => {
    switch (icon) {
      case 'cut': return '#E8F5F3';
      case 'paw': return '#FFF4E6';
      case 'school': return '#FFE8E8';
      case 'home': return '#E8F4FF';
      case 'medical': return '#F0FFE9';
      case 'bed': return '#F5E6FF';
      case 'sunny': return '#FFF9E6';
      case 'car': return '#E6F9FF';
      case 'camera': return '#FFE6F6';
      default: return '#F5F5F5';
    }
  };

  const getIconColor = (icon) => {
    switch (icon) {
      case 'cut': return '#20B2AA';
      case 'paw': return '#FFA500';
      case 'school': return '#FF6B6B';
      case 'home': return '#4A90E2';
      case 'medical': return '#7ED321';
      case 'bed': return '#9B51E0';
      case 'sunny': return '#F5A623';
      case 'car': return '#50E3C2';
      case 'camera': return '#FF69B4';
      default: return '#666666';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.mainContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#86A8E7" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2A363B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Services Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Services that you will support</Text>
          {services.map(service => {
            const isSelected = selectedServices.includes(service.id);
            const serviceName = language === 'ar' ? service.name_ar : service.name;
            const providerService = getProviderServiceDetails(service.id);
            
            return (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, isSelected && styles.selectedServiceCard]}
                onPress={() => handleServiceToggle(service)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: getIconBackground(service.icon) }]}>
                  <Ionicons 
                    name={`${service.icon}-outline`} 
                    size={20} 
                    color={getIconColor(service.icon)} 
                  />
                </View>
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{serviceName}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color="#86A8E7" />
                    )}
                  </View>
                  {isSelected && providerService && (
                    <View style={styles.serviceDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="home-outline" size={16} color="#86A8E7" />
                        <Text style={styles.detailText}>{providerService.price_at_home} SAR</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="business-outline" size={16} color="#86A8E7" />
                        <Text style={styles.detailText}>{providerService.price_at_shop} SAR</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={16} color="#86A8E7" />
                        <Text style={styles.detailText}>{providerService.duration} min</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Modal
          visible={showServiceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowServiceModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Service Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price at Home (SAR)</Text>
                <TextInput
                  style={styles.input}
                  value={serviceAtHomePrice}
                  onChangeText={setServiceAtHomePrice}
                  keyboardType="decimal-pad"
                  placeholder="Enter price for home service"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price at Shop (SAR)</Text>
                <TextInput
                  style={styles.input}
                  value={serviceAtShopPrice}
                  onChangeText={setServiceAtShopPrice}
                  keyboardType="decimal-pad"
                  placeholder="Enter price for shop service"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={serviceDuration}
                  onChangeText={setServiceDuration}
                  keyboardType="number-pad"
                  placeholder="Enter service duration"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveService}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {hasChanges && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveAllButton, isSaving && styles.saveAllButtonDisabled]}
              onPress={handleSaveAllServices}
              disabled={isSaving}
            >
              <Text style={styles.saveAllButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedServiceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#86A8E7',
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 8,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    flex: 1,
    marginRight: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A363B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2A363B',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#86A8E7',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
  },
  cancelButtonText: {
    color: '#2A363B',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#86A8E7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveAllButton: {
    backgroundColor: '#86A8E7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveAllButtonDisabled: {
    opacity: 0.7,
  },
  saveAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 