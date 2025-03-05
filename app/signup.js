import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from './context/LanguageContext';
import VerificationInput from './components/VerificationInput';

const FLAG_SAUDI = "🇸🇦";

const CITIES = [
  'Riyadh',
  'Jeddah',
  'Mecca',
  'Medina',
  'Dammam',
  'Khobar',
  // Add more Saudi cities as needed
];

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [formData, setFormData] = useState({
    phoneNumber: '',
    name: '',
    city: '',
    verificationCode: '',
  });

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,2})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]]
        .filter(Boolean)
        .join(' ');
    }
    return cleaned;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit form and navigate to home
      router.replace('/home');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            { backgroundColor: step >= index ? '#FF6B6B' : '#E1E1E1' }
          ]}
        />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={[styles.stepTitle, isRTL && styles.rtlText]}>{t.signup.phoneTitle}</Text>
            <Text style={[styles.stepDescription, isRTL && styles.rtlText]}>
              {t.signup.phoneDescription}
            </Text>
            <View style={[styles.phoneInput, { direction: 'ltr' }]}>
              <View style={[styles.countryCode]}>
                <Text style={styles.flag}>{FLAG_SAUDI}</Text>
                <Text style={styles.code}>+966</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.ltrInput
                ]}
                placeholder="5X XXX XXXX"
                value={formData.phoneNumber}
                onChangeText={(text) => 
                  setFormData({...formData, phoneNumber: formatPhoneNumber(text)})
                }
                keyboardType="phone-pad"
                maxLength={11}
                textAlign="left"
                writingDirection="ltr"
              />
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={[styles.stepTitle]}>{t.signup.nameTitle}</Text>
            <Text style={[styles.stepDescription]}>
              {t.signup.nameDescription}
            </Text>
            <View style={styles.textInput}>
              <TextInput
                style={[
                  styles.input,
                  isRTL && { textAlign: 'right' }
                ]}
                placeholder={t.signup.namePlaceholder}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                autoCapitalize="words"
                writingDirection={isRTL ? 'rtl' : 'ltr'}
              />
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={[styles.stepTitle]}>{t.signup.cityTitle}</Text>
            <Text style={[styles.stepDescription]}>
              {t.signup.cityDescription}
            </Text>
            <View style={styles.cityList}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityButton,
                    formData.city === city && styles.cityButtonSelected
                  ]}
                  onPress={() => setFormData({...formData, city: city})}
                >
                  <Text style={[
                    styles.cityButtonText,
                    formData.city === city && styles.cityButtonTextSelected,
                    isRTL && styles.rtlText
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={[styles.stepTitle]}>{t.signup.verifyTitle}</Text>
            <Text style={[styles.stepDescription]}>
              {t.signup.verifyDescription}
            </Text>
            <VerificationInput 
              onCodeComplete={(code) => {
                setFormData({...formData, verificationCode: code});
              }}
            />
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image 
          source={require('../assets/images/signupScreen/signup-header-bg.png')}
          style={styles.backgroundImage}
        />
        <LinearGradient
          colors={['transparent', '#fff']}
          style={styles.gradient}
        >
          <Text style={[styles.quote]}>{t.signup.quote}</Text>
        </LinearGradient>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity 
          style={[styles.backButton]}
          onPress={() => step > 1 ? setStep(step - 1) : router.back()}
        >
          <Ionicons 
            name={isRTL ? "arrow-forward" : "arrow-back"} 
            size={24} 
            color="#2A363B" 
          />
        </TouchableOpacity>

        {renderStepIndicator()}

        <View style={styles.formContainer}>
          {renderStep()}
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FFA07A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>
                {step === 4 ? t.signup.completeSignup : t.signup.next}
              </Text>
              <Ionicons 
                name={step === 4 ? 'paw' : (isRTL ? 'arrow-back' : 'arrow-forward')} 
                size={20} 
                color="#fff" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
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
    height: 200,
    justifyContent: 'flex-end',
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  quote: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -20,
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonRTL: {
    left: undefined,
    right: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    marginTop: 60,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A363B',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
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
  ltrInput: {
    textAlign: 'left',
    writingDirection: 'ltr',
    textDirection: 'ltr',
  },
  textInput: {
    backgroundColor: '#f2f2f7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
  },
  cityList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  cityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  cityButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  cityButtonText: {
    color: '#2A363B',
    fontSize: 14,
    fontWeight: '500',
  },
  cityButtonTextSelected: {
    color: '#fff',
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
  },
  gradientButton: {
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
  rtlText: {
    textAlign: 'right',
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
}); 