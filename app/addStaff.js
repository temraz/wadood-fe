import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getHeaders } from '../app/constants/api';
import { useLanguage } from './context/LanguageContext';

export default function AddStaffScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('+966 ');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffGender, setNewStaffGender] = useState('');

  const formatPhoneNumber = (number) => {
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Check if the number starts with '966' and remove it to avoid duplication
    const withoutPrefix = cleaned.startsWith('966') ? cleaned.slice(3) : cleaned;
    
    // Format the remaining digits
    const match = withoutPrefix.match(/^(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `+966 ${match[1]} ${match[2]} ${match[3]}`;
    }
    
    // If not enough digits for full formatting, just return with prefix
    return `+966 ${withoutPrefix}`;
  };

  const handlePhoneChange = (text) => {
    // Ensure the number always starts with +966
    if (!text.startsWith('+966')) {
      text = '+966' + text;
    }
    setNewStaffPhone(formatPhoneNumber(text));
  };

  const handleAddStaff = async () => {
    if (newStaffName.trim() && newStaffPhone.trim() && newStaffPhone.length >= 12) {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Authentication Error',
            text2: 'Please login again',
          });
          router.replace('/login');
          return;
        }

        console.log('Making API call to add staff with data:', {
          name: newStaffName.trim(),
          phone: newStaffPhone.trim().replace(/\s+/g, ''),
          password: newStaffPassword.trim(),
          gender: newStaffGender,
          city_id: 1 // Adding required city_id field
        });

        const response = await fetch(`${API_BASE_URL}/api/auth/staff`, {
          method: 'POST',
          headers: {
            ...getHeaders(language),
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newStaffName.trim(),
            phone: newStaffPhone.trim().replace(/\s+/g, ''),
            password: newStaffPassword.trim(),
            gender: newStaffGender,
            city_id: 1 // Adding required city_id field
          })
        });

        console.log('API Response status:', response.status);
        const responseText = await response.text();
        console.log('API Response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('JSON Parse error:', e);
          if (response.status === 404) {
            throw new Error('API endpoint not found. Please check the server configuration.');
          }
          throw new Error('Invalid JSON response from server');
        }

        console.log('Parsed API Response:', data);

        if (data.success) {
          Toast.show({
            type: 'success',
            text1: 'Staff Added Successfully',
            text2: data.message || `${newStaffName} has been added to your staff list`,
          });
          router.back();
        } else {
          throw new Error(data.message || 'Failed to add staff member');
        }
      } catch (error) {
        console.error('Add staff error:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message || 'Failed to add staff member',
        });
      }
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please fill in all required fields correctly',
      });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#2A363B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Staff</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Staff Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter staff name"
              value={newStaffName}
              onChangeText={setNewStaffName}
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>🇸🇦</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="5X XXX XXXX"
                value={newStaffPhone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                placeholderTextColor="#666"
                maxLength={17} // +966 XX XXX XXXX format
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={newStaffPassword}
              onChangeText={setNewStaffPassword}
              secureTextEntry
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  newStaffGender === 'male' && styles.genderButtonSelected
                ]}
                onPress={() => setNewStaffGender('male')}
              >
                <Text style={[
                  styles.genderButtonText,
                  newStaffGender === 'male' && styles.genderButtonTextSelected
                ]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  newStaffGender === 'female' && styles.genderButtonSelected
                ]}
                onPress={() => setNewStaffGender('female')}
              >
                <Text style={[
                  styles.genderButtonText,
                  newStaffGender === 'female' && styles.genderButtonTextSelected
                ]}>Female</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.addButton,
              (!newStaffName.trim() || !newStaffPhone.trim() || !newStaffPassword.trim() || !newStaffGender) && styles.addButtonDisabled
            ]}
            onPress={handleAddStaff}
            disabled={!newStaffName.trim() || !newStaffPhone.trim() || !newStaffPassword.trim() || !newStaffGender}
          >
            <LinearGradient
              colors={['#86A8E7', '#7F7FD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.addButtonText}>Add Staff</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2A363B',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  countryCode: {
    fontSize: 20,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2A363B',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  genderButtonSelected: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2A363B',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 