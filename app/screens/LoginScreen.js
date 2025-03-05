import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import VerificationInput from '../components/VerificationInput';

const LoginScreen = () => {
  const [showVerification, setShowVerification] = useState(false);

  const handleVerificationComplete = (code) => {
    console.log('Verification code:', code);
    // Add your verification logic here
  };

  return (
    <View>
      {/* Rest of the component code */}
      {showVerification && (
        <View style={styles.verificationContainer}>
          <Text style={styles.verificationTitle}>Enter Verification Code</Text>
          <Text style={styles.verificationSubtitle}>
            We've sent a code to your phone number
          </Text>
          <VerificationInput onCodeComplete={handleVerificationComplete} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  verificationContainer: {
    marginTop: 24,
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

export default LoginScreen; 