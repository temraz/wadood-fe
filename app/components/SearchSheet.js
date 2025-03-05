import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  I18nManager,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const { height } = Dimensions.get('window');

const RECENT_SEARCHES = [
  'Pet food',
  'Dog toys',
  'Cat beds',
  'Grooming kit',
];

const POPULAR_SEARCHES = [
  'Royal Canin',
  'Pet carrier',
  'Training treats',
  'Pet shampoo',
];

export default function SearchSheet({ visible, onClose, providers, onSearch, language }) {
  const router = useRouter();
  const { t } = useLanguage();
  const isRTL = language === 'ar';
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      inputRef.current?.focus();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length >= 2) {
      setIsSearching(true);
      onSearch(text);
    } else {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setQuery('');
    setIsSearching(false);
    onClose();
  };

  const getRandomColor = () => {
    const colors = [
      '#86A8E7',  // Soft Blue
      '#7F7FD5',  // Purple
      '#FF6B6B',  // Coral Red
      '#4ECDC4',  // Turquoise
      '#FFD93D',  // Warm Yellow
      '#6C5CE7',  // Royal Purple
      '#FF8B94',  // Soft Pink
      '#98DDCA',  // Mint Green
      '#45B7D1',  // Sky Blue
      '#FFB347'   // Orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderSuggestion = (text) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSearch(text)}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons name="search-outline" size={20} color="#86A8E7" />
      </View>
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  const renderProvider = ({ item: provider }) => (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={() => {
        handleClose();
        router.push(`/provider/${provider.id}`);
      }}
    >
      <Image 
        source={{ uri: provider.logo_url || 'https://via.placeholder.com/60' }}
        style={styles.providerLogo}
      />
      
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>
          {language === 'ar' ? provider.name_ar : provider.name}
        </Text>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFB347" />
          <Text style={styles.rating}>{provider.rating.toFixed(1)}</Text>
          <Text style={styles.ratingCount}>({provider.total_ratings})</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: provider.is_open ? '#4ECDC420' : '#FF6B6B20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: provider.is_open ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {provider.is_open ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.servicesRow}>
          {provider.services.slice(0, 3).map((service) => {
            const color = getRandomColor();
            return (
              <View 
                key={service.id}
                style={[styles.serviceTag, { backgroundColor: `${color}15` }]}
              >
                <Ionicons 
                  name={`${service.service.icon}-outline`}
                  size={12} 
                  color={color}
                />
                <Text style={[styles.serviceText, { color }]}>
                  {language === 'ar' ? service.service.name_ar : service.service.name}
                </Text>
              </View>
            );
          })}
          {provider.services.length > 3 && (
            <Text style={styles.moreServices}>+{provider.services.length - 3}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={handleClose}
      />
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
            <Ionicons name="search" size={20} color="#86A8E7" />
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, isRTL && styles.rtlText]}
              placeholder={t?.search?.searchPlaceholder || "Search providers..."}
              value={query}
              onChangeText={handleSearch}
              placeholderTextColor="#999"
            />
            {query.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => handleSearch('')}
              >
                <Ionicons name="close-circle" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleClose}
          >
            <Text style={styles.cancelText}>{t?.search?.cancel || "Cancel"}</Text>
          </TouchableOpacity>
        </View>

        {!isSearching ? (
          <ScrollView style={styles.suggestionsContainer}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t?.search?.recentSearches || "Recent Searches"}
              </Text>
              {RECENT_SEARCHES.map((text, index) => (
                <React.Fragment key={index}>
                  {renderSuggestion(text)}
                </React.Fragment>
              ))}
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
                {t?.search?.popularSearches || "Popular Searches"}
              </Text>
              {POPULAR_SEARCHES.map((text, index) => (
                <React.Fragment key={index}>
                  {renderSuggestion(text)}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={providers}
            renderItem={renderProvider}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  {t?.search?.noResults || "No providers found"}
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
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
    marginRight: 8,
    fontSize: 16,
    color: '#2A363B',
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    color: '#86A8E7',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  providerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreServices: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 16,
    color: '#2A363B',
  },
}); 