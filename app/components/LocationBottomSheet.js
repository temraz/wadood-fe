import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

export default function LocationBottomSheet({ 
  visible, 
  onClose, 
  onSelectLocation 
}) {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (text) => {
    setSearchText(text);
    // Mock search results
    if (text.trim()) {
      setSearchResults([
        { id: 1, name: 'Dubai Marina', address: 'Dubai Marina, Dubai', is_default: false },
        { id: 2, name: 'Downtown Dubai', address: 'Downtown Dubai, Dubai', is_default: true },
        { id: 3, name: 'Palm Jumeirah', address: 'Palm Jumeirah, Dubai', is_default: false },
      ]);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location) => {
    onSelectLocation(location);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.contentContainer}>
            <TouchableOpacity 
              style={styles.header}
              activeOpacity={1}
              onPress={() => Keyboard.dismiss()}
            >
              <View style={styles.headerContent}>
                <Text style={styles.title}>Select Location</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#2A363B" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for area, street name..."
                  value={searchText}
                  onChangeText={handleSearch}
                  placeholderTextColor="#666"
                />
              </View>
            </TouchableOpacity>

            <ScrollView 
              style={styles.resultsContainer}
              keyboardShouldPersistTaps="handled"
            >
              {searchResults.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.resultItem}
                  onPress={() => handleSelectLocation(location)}
                >
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={24} color="#86A8E7" />
                    <View style={styles.locationInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        {location.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.locationAddress}>{location.address}</Text>
                    </View>
                    {!location.is_default && (
                      <TouchableOpacity 
                        style={styles.setDefaultButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          // Handle set default logic here
                        }}
                      >
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: MODAL_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#2A363B',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A363B',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  setDefaultButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  setDefaultText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
}); 