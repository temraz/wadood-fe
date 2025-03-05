import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL, getHeaders } from './constants/api';
import { useLanguage } from './context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function providersSettings() {
  const router = useRouter();
  const { language } = useLanguage();
  const [providers, setProviders] = useState([]);
  const [allProviders, setAllProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: '',
    name_ar: '',
    email: '',
    phone: '',
    latitude: '',
    longitude: '',
    open_time: '09:00:00',
    close_time: '22:00:00',
    has_products: false,
    has_services: false,
    status_id: 1,
    city_id: 1,
    start_time: '09:00:00',
    end_time: '22:00:00',
    commission_rate: '10',
    min_order_amount: '50'
  });
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [selectedCover, setSelectedCover] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, [showDeleted]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = allProviders.filter(provider => 
        provider.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProviders(filtered);
    } else {
      setProviders(allProviders);
    }
  }, [searchQuery, allProviders]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: '1',
        limit: '10',
        deleted: showDeleted ? 'true' : 'false'
      }).toString();

      const response = await fetch(`${API_BASE_URL}/api/providers?${queryParams}`, {
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
        setAllProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في تحميل مقدمي الخدمات' : 'Failed to load providers'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'خطأ في الإذن' : 'Permission Denied',
          language === 'ar' ? 'يرجى السماح بالوصول إلى مكتبة الصور' : 'Please allow access to your photo library'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedLogo(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في اختيار الصورة' : 'Failed to pick image'
      );
    }
  };

  const pickCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'ar' ? 'خطأ في الإذن' : 'Permission Denied',
          language === 'ar' ? 'يرجى السماح بالوصول إلى مكتبة الصور' : 'Please allow access to your photo library'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedCover(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في اختيار الصورة' : 'Failed to pick image'
      );
    }
  };

  const handleAddProvider = async () => {
    if (!newProvider.name || !newProvider.name_ar || !newProvider.email || !newProvider.phone || !selectedLogo || !selectedCover) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة وتحميل الصور' : 'Please fill in all required fields and upload images'
      );
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      
      // Add all provider details
      Object.keys(newProvider).forEach(key => {
        formData.append(key, newProvider[key].toString());
      });

      // Add logo image
      if (selectedLogo) {
        const logoUri = selectedLogo;
        const logoUriParts = logoUri.split('.');
        const logoFileType = logoUriParts[logoUriParts.length - 1];

        formData.append('logo', {
          uri: logoUri,
          name: `provider-logo.${logoFileType}`,
          type: `image/${logoFileType}`
        });
      }

      // Add cover image
      if (selectedCover) {
        const coverUri = selectedCover;
        const coverUriParts = coverUri.split('.');
        const coverFileType = coverUriParts[coverUriParts.length - 1];

        formData.append('cover', {
          uri: coverUri,
          name: `provider-cover.${coverFileType}`,
          type: `image/${coverFileType}`
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/providers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
          'Accept-Language': language
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setProviders(prevProviders => [data.provider, ...prevProviders]);
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : 'Success',
          language === 'ar' ? 'تم إضافة مقدم الخدمة بنجاح' : 'Provider added successfully'
        );
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to add provider');
      }
    } catch (error) {
      console.error('Add provider error:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في إضافة مقدم الخدمة' : 'Failed to add provider'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProvider = async () => {
    if (!newProvider.name || !newProvider.email) {
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields'
      );
      return;
    }

    try {
      setIsSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', newProvider.name);
      formData.append('email', newProvider.email);
      formData.append('phone', newProvider.phone);
      formData.append('address', newProvider.address);
      if (newProvider.password) {
        formData.append('password', newProvider.password);
      }

      if (selectedImage && selectedImage !== newProvider.logo) {
        const imageUri = selectedImage;
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('logo', {
          uri: imageUri,
          name: `provider-logo.${fileType}`,
          type: `image/${fileType}`
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/providers/${selectedProvider.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setProviders(prevProviders => 
          prevProviders.map(p => p.id === selectedProvider.id ? data.provider : p)
        );
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : 'Success',
          language === 'ar' ? 'تم تحديث مقدم الخدمة بنجاح' : 'Provider updated successfully'
        );
        resetForm();
      } else {
        throw new Error(data.message || 'Failed to update provider');
      }
    } catch (error) {
      console.error('Update provider error:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في تحديث مقدم الخدمة' : 'Failed to update provider'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProvider = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/providers/${selectedProvider.id}`, {
        method: 'DELETE',
        headers: {
          ...getHeaders(language),
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setProviders(providers.filter(p => p.id !== selectedProvider.id));
        Alert.alert(
          language === 'ar' ? 'تم بنجاح' : 'Success',
          language === 'ar' ? 'تم حذف مقدم الخدمة بنجاح' : 'Provider deleted successfully'
        );
      } else {
        throw new Error(data.message || 'Failed to delete provider');
      }
    } catch (error) {
      console.error('Delete provider error:', error);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل في حذف مقدم الخدمة' : 'Failed to delete provider'
      );
    } finally {
      setShowDeleteConfirm(false);
      setSelectedProvider(null);
    }
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setNewProvider({
      ...provider,
      password: '' // Clear password when editing
    });
    setSelectedImage(provider.logo);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setNewProvider({
      name: '',
      name_ar: '',
      email: '',
      phone: '',
      latitude: '',
      longitude: '',
      open_time: '09:00:00',
      close_time: '22:00:00',
      has_products: false,
      has_services: false,
      status_id: 1,
      city_id: 1,
      start_time: '09:00:00',
      end_time: '22:00:00',
      commission_rate: '10',
      min_order_amount: '50'
    });
    setSelectedLogo(null);
    setSelectedCover(null);
    setIsEditing(false);
    setSelectedProvider(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'مقدمي الخدمات' : 'Providers'}
        </Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#86A8E7" />
          <TextInput
            style={styles.searchInput}
            placeholder={language === 'ar' ? 'البحث عن مقدمي الخدمات...' : 'Search providers...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, showDeleted && styles.filterButtonActive]}
          onPress={() => setShowDeleted(!showDeleted)}
        >
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color={showDeleted ? "#fff" : "#86A8E7"} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#86A8E7" />
          </View>
        ) : providers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>
              {language === 'ar' ? 'لا يوجد مقدمي خدمات' : 'No Providers Found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {language === 'ar' 
                ? 'ابدأ بإضافة مقدمي خدمات جدد'
                : 'Start adding new service providers'}
            </Text>
          </View>
        ) : (
          providers.map(provider => (
            <View key={provider.id} style={styles.providerCard}>
              <Image 
                source={{ uri: provider.logo_url || 'https://via.placeholder.com/60' }} 
                style={styles.providerLogo}
              />
              <View style={styles.providerContent}>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>
                    {language === 'ar' ? provider.name_ar : provider.name}
                  </Text>
                  <Text style={styles.providerEmail}>{provider.email}</Text>
                  {provider.phone && (
                    <Text style={styles.providerPhone}>{provider.phone}</Text>
                  )}
                  <View style={styles.providerStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FFB347" />
                      <Text style={styles.statText}>{provider.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.statText}>{provider.completed_bookings}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time" size={14} color="#86A8E7" />
                      <Text style={styles.statText}>
                        {provider.open_time.slice(0, 5)} - {provider.close_time.slice(0, 5)}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      setSelectedProvider(provider);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => {
          setIsEditing(false);
          setShowAddModal(true);
        }}
      >
        <LinearGradient
          colors={['#86A8E7', '#7F7FD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addButtonGradient}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing 
                  ? (language === 'ar' ? 'تعديل مقدم الخدمة' : 'Edit Provider')
                  : (language === 'ar' ? 'إضافة مقدم خدمة جديد' : 'Add New Provider')
                }
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={resetForm}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Logo Upload */}
              <Text style={styles.inputLabel}>
                {language === 'ar' ? 'شعار مقدم الخدمة (1:1)' : 'Provider Logo (1:1)'}
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickLogo}
                activeOpacity={0.8}
              >
                {selectedLogo ? (
                  <>
                    <Image 
                      source={{ uri: selectedLogo }} 
                      style={styles.uploadedImage}
                    />
                    <View style={styles.uploadOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.uploadText}>
                        {language === 'ar' ? 'تغيير الشعار' : 'Change Logo'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#86A8E7" />
                    <Text style={styles.uploadText}>
                      {language === 'ar' ? 'رفع شعار' : 'Upload Logo'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Cover Upload */}
              <Text style={styles.inputLabel}>
                {language === 'ar' ? 'صورة الغلاف (16:9)' : 'Cover Image (16:9)'}
                <Text style={styles.requiredStar}> *</Text>
              </Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickCover}
                activeOpacity={0.8}
              >
                {selectedCover ? (
                  <>
                    <Image 
                      source={{ uri: selectedCover }} 
                      style={styles.uploadedImage}
                    />
                    <View style={styles.uploadOverlay}>
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.uploadText}>
                        {language === 'ar' ? 'تغيير الغلاف' : 'Change Cover'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#86A8E7" />
                    <Text style={styles.uploadText}>
                      {language === 'ar' ? 'رفع غلاف' : 'Upload Cover'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder={language === 'ar' ? 'اسم مقدم الخدمة (بالإنجليزية)' : 'Provider Name (English)'}
                value={newProvider.name}
                onChangeText={text => setNewProvider({ ...newProvider, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder={language === 'ar' ? 'اسم مقدم الخدمة (بالعربية)' : 'Provider Name (Arabic)'}
                value={newProvider.name_ar}
                onChangeText={text => setNewProvider({ ...newProvider, name_ar: text })}
              />

              <TextInput
                style={styles.input}
                placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                value={newProvider.email}
                onChangeText={text => setNewProvider({ ...newProvider, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                value={newProvider.phone}
                onChangeText={text => setNewProvider({ ...newProvider, phone: text })}
                keyboardType="phone-pad"
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'خط العرض' : 'Latitude'}
                  value={newProvider.latitude}
                  onChangeText={text => setNewProvider({ ...newProvider, latitude: text })}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'خط الطول' : 'Longitude'}
                  value={newProvider.longitude}
                  onChangeText={text => setNewProvider({ ...newProvider, longitude: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'وقت الفتح' : 'Open Time'}
                  value={newProvider.open_time}
                  onChangeText={text => setNewProvider({ ...newProvider, open_time: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'وقت الإغلاق' : 'Close Time'}
                  value={newProvider.close_time}
                  onChangeText={text => setNewProvider({ ...newProvider, close_time: text })}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {language === 'ar' ? 'لديه منتجات' : 'Has Products'}
                </Text>
                <Switch
                  value={newProvider.has_products}
                  onValueChange={value => setNewProvider({ ...newProvider, has_products: value })}
                />
              </View>

              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>
                  {language === 'ar' ? 'لديه خدمات' : 'Has Services'}
                </Text>
                <Switch
                  value={newProvider.has_services}
                  onValueChange={value => setNewProvider({ ...newProvider, has_services: value })}
                />
              </View>

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}
                  value={newProvider.commission_rate}
                  onChangeText={text => setNewProvider({ ...newProvider, commission_rate: text })}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder={language === 'ar' ? 'الحد الأدنى للطلب' : 'Min Order Amount'}
                  value={newProvider.min_order_amount}
                  onChangeText={text => setNewProvider({ ...newProvider, min_order_amount: text })}
                  keyboardType="decimal-pad"
                />
              </View>

            </ScrollView>

            <TouchableOpacity
              style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
              onPress={isEditing ? handleUpdateProvider : handleAddProvider}
              disabled={isSaving}
            >
              <LinearGradient
                colors={['#86A8E7', '#7F7FD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing
                      ? (language === 'ar' ? 'تحديث' : 'Update')
                      : (language === 'ar' ? 'إضافة' : 'Add')
                    }
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.deleteModal]}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="warning-outline" size={32} color="#fff" />
            </View>
            <Text style={styles.deleteTitle}>
              {language === 'ar' ? 'حذف مقدم الخدمة' : 'Delete Provider'}
            </Text>
            <Text style={styles.deleteMessage}>
              {language === 'ar'
                ? 'هل أنت متأكد من حذف مقدم الخدمة هذا؟'
                : 'Are you sure you want to delete this provider?'}
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteButton, styles.cancelButton]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setSelectedProvider(null);
                }}
              >
                <Text style={styles.cancelButtonText}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, styles.confirmButton]}
                onPress={handleDeleteProvider}
              >
                <Text style={styles.confirmButtonText}>
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A363B',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  providerContent: {
    flex: 1,
    marginLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  providerPhone: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 5,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  uploadButton: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitButton: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  deleteModal: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: '40%',
  },
  deleteIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  deleteMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  providerStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A363B',
    marginBottom: 8,
    textAlign: 'left',
  },
  requiredStar: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2A363B',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
}); 