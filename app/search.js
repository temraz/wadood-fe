import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Keyboard,
  ScrollView,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';

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

export default function SearchScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchAnimation = new Animated.Value(0);
  const inputRef = useRef(null);

  useEffect(() => {
    // Animate search bar on mount
    Animated.spring(searchAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    // Focus input automatically
    inputRef.current?.focus();
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      // Implement your search logic here
      // For now, we'll just filter the products
      const filtered = PRODUCTS.filter(product => 
        product.name.toLowerCase().includes(text.toLowerCase()) ||
        product.category.toLowerCase().includes(text.toLowerCase())
      );
      setResults(filtered);
    } else {
      setIsSearching(false);
      setResults([]);
    }
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchItem}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.searchHeader,
          {
            transform: [{
              translateY: searchAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              })
            }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons 
            name={isRTL ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color="#86A8E7" 
          />
        </TouchableOpacity>
        <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
          <Ionicons name="search" size={20} color="#86A8E7" />
          <TextInput
            style={[styles.searchInput]}
            placeholder={t.search.searchPlaceholder}
            value={query}
            onChangeText={handleSearch}
            autoFocus
            textAlign={isRTL ? 'right' : 'left'}
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
      </Animated.View>

      {!isSearching ? (
        <ScrollView style={styles.suggestionsContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle]}>
              {t.search.recentSearches}
            </Text>
            {RECENT_SEARCHES.map((text, index) => renderSuggestion(text))}
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle]}>
              {t.search.popularSearches}
            </Text>
            {POPULAR_SEARCHES.map((text, index) => renderSuggestion(text))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          renderItem={renderSearchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#ccc" />
              <Text style={[styles.emptyStateText]}>
                {t.search.noResults}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
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
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  suggestionItem: {
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
  resultsList: {
    padding: 16,
  },
  searchItem: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: I18nManager.isRTL ? 0 : 12,
    marginRight: I18nManager.isRTL ? 12 : 0,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  itemCategory: {
    fontSize: 14,
    color: '#86A8E7',
    marginTop: 2,
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
}); 