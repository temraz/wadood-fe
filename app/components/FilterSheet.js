import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  I18nManager,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL, ensureValidToken } from '../constants/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

// Beautiful curated color palette
const SERVICE_COLORS = [
  '#FF6B6B',  // Coral Red
  '#4ECDC4',  // Turquoise
  '#7F7FD5',  // Lavender
  '#86A8E7',  // Periwinkle
  '#91EAE4',  // Aqua
  '#FFB347',  // Pastel Orange
  '#6C5CE7',  // Royal Purple
  '#45B7D1',  // Ocean Blue
  '#98DDCA',  // Mint Green
  '#FFA07A'   // Light Salmon
];

let usedColorIndexes = [];

const getRandomColor = () => {
  // Reset used colors if all colors have been used
  if (usedColorIndexes.length === SERVICE_COLORS.length) {
    usedColorIndexes = [];
  }

  // Get available color indexes
  const availableIndexes = SERVICE_COLORS.map((_, index) => index)
    .filter(index => !usedColorIndexes.includes(index));

  // Get random index from available colors
  const randomIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];
  
  // Add to used colors
  usedColorIndexes.push(randomIndex);
  
  return SERVICE_COLORS[randomIndex];
};

export default function FilterSheet({ visible, onClose, onApply }) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const [distance, setDistance] = useState(10);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const slideAnim = React.useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      fetchServices();
    } else {
      Animated.spring(slideAnim, {
        toValue: SHEET_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure we have a valid token
      await ensureValidToken();
      
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        headers: {
          'Accept-Language': language,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      if (data.success) {
        // Add random colors to services
        const servicesWithColors = data.services.map(service => ({
          ...service,
          color: getRandomColor()
        }));
        setServices(servicesWithColors);
      } else {
        throw new Error('Failed to fetch services');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  const handleApply = () => {
    onApply({
      distance: distance,
      services: selectedServices.join(','),
      has_products: true
    });
    onClose();
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
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {language === 'ar' ? 'الفلاتر' : 'Filters'}
              </Text>
              <Text style={styles.subtitle}>
                {language === 'ar' ? 'تخصيص البحث' : 'Customize your search'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'ar' ? 'نطاق المسافة' : 'Distance Range'}
              </Text>
              <View style={styles.distanceOptions}>
                {[5, 10, 15, 20, 25, 30].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.distanceOption,
                      distance === value && styles.distanceOptionSelected
                    ]}
                    onPress={() => setDistance(value)}
                  >
                    <Text style={[
                      styles.distanceOptionText,
                      distance === value && styles.distanceOptionTextSelected
                    ]}>
                      {value} KM
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.servicesSection]}>
              <Text style={styles.sectionTitle}>
                {language === 'ar' ? 'خدمات الحيوانات الأليفة' : 'Pet Services'}
              </Text>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#86A8E7" />
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={fetchServices}
                  >
                    <Text style={styles.retryText}>
                      {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.servicesGrid}>
                  {services.map(service => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceCard,
                        selectedServices.includes(service.id) && styles.serviceCardSelected,
                        { borderColor: service.color }
                      ]}
                      onPress={() => toggleService(service.id)}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: service.color }]}>
                        <Ionicons name={`${service.icon}-outline`} size={24} color="#fff" />
                      </View>
                      <Text style={styles.serviceName}>
                        {language === 'ar' ? service.name_ar : service.name}
                      </Text>
                      {selectedServices.includes(service.id) && (
                        <View style={[styles.checkmark, { backgroundColor: service.color }]}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <BlurView intensity={90} style={styles.footer}>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApply}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FFA07A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Text style={styles.applyButtonText}>
                  {language === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </BlurView>
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
    paddingTop: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A363B',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  servicesSection: {
    paddingBottom: 100, // Space for footer
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 8,
  },
  distanceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  distanceOptionSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  distanceOptionTextSelected: {
    color: '#fff',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  serviceCardSelected: {
    backgroundColor: '#F8F9FF',
    borderWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A363B',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  applyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#86A8E7',
  },
}); 