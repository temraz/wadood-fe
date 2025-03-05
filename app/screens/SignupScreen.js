import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import VerificationInput from '../components/VerificationInput';

const SignupScreen = () => {
  const [showVerification, setShowVerification] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendCode = () => {
    // Add your code sending logic here
    setShowVerification(true);
  };

  const handleVerificationComplete = (code) => {
    console.log('Verification code:', code);
    // Add your verification logic here
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        
        {!showVerification ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <TouchableOpacity 
              style={styles.button}
              onPress={handleSendCode}
            >
              <Text style={styles.buttonText}>Send Code</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationTitle}>Verify Your Number</Text>
            <Text style={styles.verificationSubtitle}>
              Please enter the code we've sent to your phone
            </Text>
            <VerificationInput onCodeComplete={handleVerificationComplete} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A363B',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#2A363B',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#86A8E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationContainer: {
    width: '100%',
    alignItems: 'center',
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default SignupScreen; 