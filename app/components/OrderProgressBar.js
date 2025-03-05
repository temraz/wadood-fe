import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const OrderProgressBar = ({ status, order_type }) => {
  const getStatusIndex = (currentStatus) => {
    const statuses = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    return statuses.indexOf(currentStatus);
  };

  const renderIcon = (iconName, isActive, isCompleted) => {
    return (
      <View style={[styles.iconContainer, { backgroundColor: isCompleted || isActive ? '#E3F2FD' : '#F5F5F5' }]}>
        {isCompleted || isActive ? (
          <LinearGradient
            colors={['#86A8E7', '#7F7FD5']}
            style={styles.iconGradient}
          >
            <Ionicons name={iconName} size={20} color="#fff" />
          </LinearGradient>
        ) : (
          <Ionicons name={iconName} size={20} color="#9E9E9E" />
        )}
      </View>
    );
  };

  const currentIndex = getStatusIndex(status);
  const isProduct = order_type === 'product';

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {/* Pending */}
        <View style={styles.step}>
          {renderIcon('time-outline', currentIndex === 0, currentIndex > 0)}
          <Text style={[styles.stepText, 
            { color: currentIndex >= 0 ? '#2A363B' : '#9E9E9E' }]}>
            Pending
          </Text>
        </View>

        <View style={styles.lineContainer}>
          <View style={[styles.line, { backgroundColor: currentIndex > 0 ? '#86A8E7' : '#E0E0E0' }]} />
        </View>

        {/* Accepted */}
        <View style={styles.step}>
          {renderIcon('checkmark-circle-outline', currentIndex === 1, currentIndex > 1)}
          <Text style={[styles.stepText, 
            { color: currentIndex >= 1 ? '#2A363B' : '#9E9E9E' }]}>
            Accepted
          </Text>
        </View>

        <View style={styles.lineContainer}>
          <View style={[styles.line, { backgroundColor: currentIndex > 1 ? '#86A8E7' : '#E0E0E0' }]} />
        </View>

        {/* In Progress/Out for Delivery */}
        <View style={styles.step}>
          {renderIcon(isProduct ? 'bicycle-outline' : 'time-outline', currentIndex === 2, currentIndex > 2)}
          <Text style={[styles.stepText, 
            { color: currentIndex >= 2 ? '#2A363B' : '#9E9E9E' }]}>
            {isProduct ? 'Out for Delivery' : 'In Progress'}
          </Text>
        </View>

        <View style={styles.lineContainer}>
          <View style={[styles.line, { backgroundColor: currentIndex > 2 ? '#86A8E7' : '#E0E0E0' }]} />
        </View>

        {/* Done/Delivered */}
        <View style={styles.step}>
          {renderIcon(isProduct ? 'checkmark-done-circle-outline' : 'flag-outline', currentIndex === 3, currentIndex > 3)}
          <Text style={[styles.stepText, 
            { color: currentIndex >= 3 ? '#2A363B' : '#9E9E9E' }]}>
            {isProduct ? 'Delivered' : 'Done'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(134,168,231,0.12)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    width: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  lineContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  line: {
    height: 2,
    width: '100%',
    marginTop:-15
  },
});

export default OrderProgressBar; 