import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import TopUpSheet from './components/TopUpSheet';

const transactions = [
  {
    id: '1',
    type: 'payment',
    title: 'Paws & Claws Grooming',
    service: 'Full Grooming + Nail Care',
    amount: -85.00,
    date: '20 Mar 2024',
    status: 'completed',
  },
  {
    id: '2',
    type: 'refund',
    title: 'Refund: Pawsome Adventures',
    service: 'Dog Walking Session',
    amount: 45.00,
    date: '18 Mar 2024',
    status: 'completed',
  },
  {
    id: '3',
    type: 'topup',
    title: 'Wallet Top-up',
    service: 'Via Apple Pay',
    amount: 100.00,
    date: '15 Mar 2024',
    status: 'completed',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Furry Friends Resort',
    service: 'Pet Boarding (2 nights)',
    amount: -120.00,
    date: '12 Mar 2024',
    status: 'completed',
  },
];

export default function WalletScreen() {
  const router = useRouter();
  const balance = 240.00;
  const [showTopUp, setShowTopUp] = useState(false);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'payment':
        return { name: 'cart-outline', color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' };
      case 'refund':
        return { name: 'return-down-back-outline', color: '#4ECDC4', bg: 'rgba(78,205,196,0.1)' };
      case 'topup':
        return { name: 'add-circle-outline', color: '#86A8E7', bg: 'rgba(134,168,231,0.1)' };
      default:
        return { name: 'ellipse-outline', color: '#666', bg: '#f8f9fa' };
    }
  };

  const handleTopUp = (details) => {
    console.log('Top up details:', details);
    // Handle the top up logic here
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7F7FD5', '#86A8E7', '#91EAE4']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#86A8E7" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Wallet</Text>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>{balance.toFixed(2)} SAR</Text>
            <TouchableOpacity 
              style={styles.topupButton}
              onPress={() => setShowTopUp(true)}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FFA07A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.topupGradient}
              >
                <Ionicons name="add-outline" size={24} color="#fff" />
                <Text style={styles.topupText}>Top Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {transactions.map(transaction => (
          <TouchableOpacity 
            key={transaction.id}
            style={styles.transactionCard}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: getTransactionIcon(transaction.type).bg }
            ]}>
              <Ionicons 
                name={getTransactionIcon(transaction.type).name}
                size={24}
                color={getTransactionIcon(transaction.type).color}
              />
            </View>
            
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionTitle}>{transaction.title}</Text>
              <Text style={styles.transactionService}>{transaction.service}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>

            <View style={styles.amountContainer}>
              <Text style={[
                styles.amount,
                { color: transaction.amount > 0 ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} SAR
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: transaction.status === 'completed' ? '#4ECDC415' : '#FF6B6B15' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: transaction.status === 'completed' ? '#4ECDC4' : '#FF6B6B' }
                ]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TopUpSheet
        visible={showTopUp}
        onClose={() => setShowTopUp(false)}
        onTopUp={handleTopUp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 370,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  topupButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  topupGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  topupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 4,
  },
  transactionService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
}); 