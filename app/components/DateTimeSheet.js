import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  I18nManager 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useLanguage } from '../context/LanguageContext';

const { height } = Dimensions.get('window');

export default function DateTimeSheet({ visible, onClose, onConfirm }) {
  const { language, t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', 
    '17:00', '18:00', '19:00', '20:00'
  ];

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    if (selectedDate && selectedTime) {
      onConfirm({ date: selectedDate, time: selectedTime });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t.dateTimeSheet.selectDateTime}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Calendar
            style={styles.calendar}
            theme={{
              todayTextColor: '#86A8E7',
              selectedDayBackgroundColor: '#86A8E7',
              selectedDayTextColor: '#fff',
              arrowColor: '#86A8E7',
            }}
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={day => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true }
            }}
          />

          <Text style={styles.subtitle}>{t.dateTimeSheet.availableTimeSlots}</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeContainer}
          >
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!selectedDate || !selectedTime) && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={!selectedDate || !selectedTime}
          >
            <Text style={styles.confirmButtonText}>{t.dateTimeSheet.confirm}</Text>
          </TouchableOpacity>
        </Animated.View>
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
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A363B',
  },
  closeButton: {
    padding: 4,
  },
  calendar: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  timeContainer: {
    paddingBottom: 20,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: I18nManager.isRTL ? 0 : 8,
    marginLeft: I18nManager.isRTL ? 8 : 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTimeSlot: {
    backgroundColor: '#86A8E7',
    borderColor: '#86A8E7',
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  selectedTimeText: {
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#86A8E7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 