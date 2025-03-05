import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Keyboard,
  Animated,
  I18nManager,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import VerificationInput from './components/VerificationInput';
import { API_BASE_URL, ENDPOINTS, getHeaders } from './constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const FLAG_SAUDI = "🇸🇦"; // Saudi Arabia flag emoji

export default function LoginScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const isRTL = language === 'ar';
  const [error, setError] = useState('');
  const errorAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');

      if (token && userData) {
        const user = JSON.parse(userData);
        // Redirect based on user role
        if (user.role === 'user') {
          router.replace('/home');
        } else if (user.role === 'staff' || user.role === 'admin' || user.role === 'provider') {
          router.replace('/partnerHome');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(errorAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => setError(''));
    }
  }, [error]);

  const formatPhoneNumber = (number) => {
    // Remove any non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // If number starts with 966, add the plus
    if (cleaned.startsWith('966')) {
      return '+' + cleaned;
    }
    
    // If number starts with 05, replace 0 with 966
    if (cleaned.startsWith('05')) {
      return '+966' + cleaned.substring(1);
    }
    
    // If number starts with 5, add 966 prefix
    if (cleaned.startsWith('5')) {
      return '+966' + cleaned;
    }
    
    // For any other format, just add 966 prefix
    return '+966' + cleaned;
  };

  const handleRequestOTP = async () => {
    const cleanedPhone = phone.replace(/\D/g, '');
    if (!cleanedPhone) {
      Toast.show({
        type: 'error',
        text1: t.login.phoneRequired || 'Please enter your phone number',
      });
      return;
    }

    if (cleanedPhone.length < 9) {
      Toast.show({
        type: 'error',
        text1: t.login.invalidPhone || 'Please enter a valid phone number',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log('Requesting OTP for:', formattedPhone);
      
      const response = await fetch(API_BASE_URL + ENDPOINTS.REQUEST_OTP, {
        method: 'POST',
        headers: getHeaders(language),
        body: JSON.stringify({
          phone: formattedPhone,
          type: 'login'
        }),
      });

      console.log('OTP Request Response:', response.status);
      const data = await response.json();
      console.log('OTP Request Data:', data);
      
      if (data.success) {
        Toast.show({
          type: 'success',
          text1: t.login.otpSent || 'Verification code sent successfully',
          text2: `Code: ${data.code}`,
          visibilityTime: 4000,
          position: 'top',
        });
        setStep(2);
      } else {
        Toast.show({
          type: 'error',
          text1: data.message || t.login.generalError || 'Something went wrong. Please try again.',
        });
      }
    } catch (error) {
      console.error('Request OTP Error:', error);
      Toast.show({
        type: 'error',
        text1: t.login.networkError || 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      Toast.show({
        type: 'error',
        text1: t.login.otpRequired || 'Please enter the verification code',
      });
      return;
    }

    if (otpCode.length !== 4) {
      Toast.show({
        type: 'error',
        text1: t.login.invalidOTP || 'Please enter a valid 4-digit verification code',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      console.log('Verifying OTP for:', formattedPhone, 'Code:', otpCode);
      
      const response = await fetch(API_BASE_URL + ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: getHeaders(language),
        body: JSON.stringify({
          phone: formattedPhone,
          code: otpCode,
          type: 'login'
        }),
      });

      console.log('OTP Verification Response:', response.status);
      const data = await response.json();
      console.log('OTP Verification Data:', data);
      
      if (data.success) {
        // Save auth tokens
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        
        // Save user data
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        Toast.show({
          type: 'success',
          text1: t.login.loginSuccess || 'Login successful',
          visibilityTime: 2000,
        });
        
        if (data.requires_registration) {
          router.replace('/signup');
        } else {
          // Redirect based on user role
          const userRole = data.user.role;
          if (userRole === 'user') {
            router.replace('/home');
          } else if (userRole === 'staff' || userRole === 'admin' || userRole === 'provider') {
            router.replace('/partnerHome');
          }
        }
      } else {
        Toast.show({
          type: 'error',
          text1: data.message || t.login.invalidOTP || 'Invalid verification code',
        });
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      Toast.show({
        type: 'error',
        text1: t.login.networkError || 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>{t.login.welcome}</Text>
            <Text style={styles.welcomeText}>
              {t.login.welcomeDescription || 'Enter your phone number to continue. We will send you a verification code.'}
            </Text>
            <View style={styles.phoneInput}>
              <View style={styles.countryCode}>
                <Text style={styles.flag}>🇸🇦</Text>
                <Text style={styles.code}>+966</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'left', writingDirection: 'ltr' }
                ]}
                placeholder="5X XXX XXXX"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError('');
                }}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isLoading}
              />
            </View>
            {error ? (
              <Animated.View 
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorAnim,
                    transform: [{
                      translateY: errorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRequestOTP}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FFA07A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>{t.login.sendCode}</Text>
                    <Ionicons 
                      name={isRTL ? "arrow-back" : "arrow-forward"}
                      size={20} 
                      color="#fff" 
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>{t.login.verifyPhone}</Text>
            <Text style={styles.welcomeText}>
              {t.login.verificationDescription || 'Enter the 4-digit code we sent to your phone number.'}
            </Text>
            <VerificationInput
              onCodeComplete={setOtpCode}
              disabled={isLoading}
            />
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FFA07A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>{t.login.verifyButton}</Text>
                    <Ionicons 
                      name={isRTL ? "arrow-back" : "arrow-forward"}
                      size={20} 
                      color="#fff" 
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(1)}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>{t.login.back}</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Image 
            source={require('../assets/images/loginScreen/login-header-bg.png')}
            style={styles.backgroundImage}
          />
          <LinearGradient
            colors={['transparent', '#fff']}
            style={styles.gradient}
          />
        </View>
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}
        >
          <View style={styles.welcomeContainer}>
            {renderStep()}
          </View>

          {!isLoading && (
            <Animated.View 
              style={[
                styles.footerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }]
                }
              ]}
            >
              <View style={[styles.signupContainer, isRTL && styles.rtlRow]}>
                <Text style={[styles.signupText, isRTL && styles.rtlText]}>{t.login.noAccount}</Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.signupLink}>{t.login.signupLink}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.termsText, isRTL && styles.rtlText]}>
                {t.login.termsText}{' '}
                <Text style={styles.linkText}>{t.login.termsLink}</Text>
                {' '}{t.login.and}{' '}
                <Text style={styles.linkText}>{t.login.privacyLink}</Text>
              </Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    height: 300,
    width: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  welcomeContainer: {
    marginTop: -20,
    marginBottom: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A363B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    marginRight: 12,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2A363B',
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    backgroundColor: '#fff',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
  },
  linkText: {
    color: '#FF6B6B',
    textDecorationLine: 'underline',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  countryCodeRTL: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    marginRight: 0,
    marginLeft: 12,
    paddingRight: 0,
    paddingLeft: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8E8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: -8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
}); 