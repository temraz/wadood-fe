import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  PanResponder,
  I18nManager,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function RatingSheet({ visible, onClose, order, onSubmit }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pan = React.useRef(new Animated.ValueXY()).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          y: pan.y._value,
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          pan.y.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(pan.y, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      pan.setValue({ x: 0, y: 0 });
    } else {
      Animated.spring(slideAnim, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSubmit = () => {
    onSubmit(rating, comment);
  };

  const getRatingText = () => {
    if (rating === 0) return t.search.rating.tapToRate;
    if (rating === 5) return t.search.rating.excellent;
    if (rating === 4) return t.search.rating.veryGood;
    if (rating === 3) return t.search.rating.good;
    if (rating === 2) return t.search.rating.fair;
    return t.search.rating.poor;
  };

  if (!visible || !order) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalAmount = order.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;

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
            transform: [
              { translateY: slideAnim },
              { translateY: pan.y },
            ],
          },
        ]}
      >
        <BlurView intensity={80} style={styles.content}>
          {/* Fixed Header */}
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={[styles.title]}>{t.search.rating.title || 'Rate Your Experience'}</Text>
                <Text style={[styles.subtitle]}>{t.search.rating.subtitle || 'How was your service?'}</Text>
              </View>
            </View>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.orderSummary}>
              <Text style={[styles.providerName]}>
                {order.provider_name}
              </Text>
              <Text style={[styles.orderDate]}>
                {formatDate(order.created_at)}
              </Text>
              <View style={styles.servicesList}>
                {order.items?.map((item, index) => (
                  <View key={index} style={[styles.serviceItem]}>
                    <View style={styles.serviceNameContainer}>
                      <Text style={[styles.serviceName]}>
                        {item.name}
                      </Text>
                      {item.duration && (
                        <Text style={[styles.duration]}>
                          {item.duration} min
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.servicePrice]}>
                      {item.price} SAR
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[styles.totalRow]}>
                <Text style={[styles.totalLabel]}>{t.search.rating.totalAmount || 'Total Amount'}</Text>
                <Text style={[styles.totalAmount]}>{totalAmount} SAR</Text>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <View style={[styles.starsContainer, isRTL && styles.rtlRow]}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <Ionicons
                      name={rating >= star ? "star" : "star-outline"}
                      size={36}
                      color={rating >= star ? "#FFD93D" : "#e0e0e0"}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.ratingText]}>
                {getRatingText()}
              </Text>
            </View>

            <View style={styles.commentContainer}>
              <TextInput
                style={[styles.commentInput]}
                placeholder={t.search.rating.commentPlaceholder || 'Share your experience (optional)'}
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                textAlign={isRTL ? 'right' : 'left'}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Fixed Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                rating === 0 && styles.submitButtonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <LinearGradient
                colors={['#86A8E7', '#7F7FD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Text style={[styles.submitButtonText]}>
                  {t.search.rating.submitButton || 'Submit Rating'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    marginBottom: 8,
  },
  header: {
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    alignItems: 'center',
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
  scrollContent: {
    flex: 1,
  },
  orderSummary: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 16,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  servicesList: {
    gap: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  duration: {
    fontSize: 12,
    color: '#86A8E7',
    marginLeft: 8,
  },
  servicePrice: {
    fontSize: 14,
    color: '#86A8E7',
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#86A8E7',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  ratingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  star: {
    marginHorizontal: 4,
  },
  ratingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  commentContainer: {
    padding: 16,
    paddingTop: 0,
  },
  commentInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: '#2A363B',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  gradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
}); 