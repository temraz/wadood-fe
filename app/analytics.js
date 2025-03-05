import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Mock data
const ANALYTICS_DATA = {
  revenue: {
    total: 12580,
    growth: 15.8,
    lastMonth: 10860
  },
  orders: {
    total: 156,
    completed: 142,
    cancelled: 14,
    growth: 8.5
  },
  services: {
    mostPopular: [
      { name: 'Pet Grooming', count: 78, revenue: 3900 },
      { name: 'Nail Trimming', count: 45, revenue: 900 },
      { name: 'Full Service', count: 35, revenue: 4200 }
    ]
  },
  products: {
    mostSold: [
      { name: 'Royal Canin Food', count: 124, revenue: 5580 },
      { name: 'Pet Shampoo', count: 89, revenue: 1780 },
      { name: 'Pet Brush', count: 67, revenue: 1005 }
    ]
  },
  customers: {
    total: 98,
    new: 12,
    returning: 86,
    satisfaction: 4.8
  },
  timeSlots: {
    mostBooked: ['10:00 AM', '2:00 PM', '4:00 PM'],
    leastBooked: ['9:00 AM', '6:00 PM']
  }
};

// Add chart data
const CHART_DATA = {
  revenue: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [8500, 9200, 10400, 11200, 10860, 12580],
    }]
  },
  ordersBreakdown: {
    data: [
      {
        name: 'Services',
        population: 142,
        color: '#86A8E7',
        legendFontColor: '#666',
      },
      {
        name: 'Products',
        population: 98,
        color: '#7F7FD5',
        legendFontColor: '#666',
      }
    ]
  },
  weeklyOrders: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [18, 25, 30, 22, 28, 32, 24],
    }]
  },
  customerGrowth: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      data: [45, 52, 61, 70, 85, 98],
    }]
  }
};

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(134, 168, 231, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#7F7FD5'
  }
};

export default function AnalyticsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const renderMetricCard = (title, value, growth, icon) => (
    <View style={styles.metricCard}>
      <LinearGradient
        colors={['#86A8E7', '#7F7FD5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.metricGradient}
      >
        <View style={styles.metricIcon}>
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {growth && (
          <View style={[
            styles.growthBadge,
            { backgroundColor: growth >= 0 ? '#96C93D20' : '#FF6B6B20' }
          ]}>
            <Ionicons 
              name={growth >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={growth >= 0 ? '#96C93D' : '#FF6B6B'} 
            />
            <Text style={[
              styles.growthText,
              { color: growth >= 0 ? '#96C93D' : '#FF6B6B' }
            ]}>
              {Math.abs(growth)}%
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderServiceCard = (service, index) => (
    <View key={index} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceCount}>{service.count} orders</Text>
      </View>
      <Text style={styles.serviceRevenue}>{formatCurrency(service.revenue)}</Text>
    </View>
  );

  const renderCustomerStats = () => (
    <View style={styles.customerStats}>
      <View style={styles.customerRow}>
        <View style={styles.customerStat}>
          <Text style={styles.customerLabel}>Total Customers</Text>
          <Text style={styles.customerValue}>{ANALYTICS_DATA.customers.total}</Text>
        </View>
        <View style={styles.customerStat}>
          <Text style={styles.customerLabel}>New Customers</Text>
          <Text style={styles.customerValue}>{ANALYTICS_DATA.customers.new}</Text>
        </View>
      </View>
      <View style={styles.customerRow}>
        <View style={styles.customerStat}>
          <Text style={styles.customerLabel}>Returning</Text>
          <Text style={styles.customerValue}>{ANALYTICS_DATA.customers.returning}</Text>
        </View>
        <View style={styles.customerStat}>
          <Text style={styles.customerLabel}>Satisfaction</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.customerValue}>{ANALYTICS_DATA.customers.satisfaction}</Text>
            <Ionicons name="star" size={16} color="#FFD700" />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#2A363B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <View style={styles.timeRangeSelector}>
        <TouchableOpacity 
          style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
          onPress={() => setTimeRange('week')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
          onPress={() => setTimeRange('month')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.timeRangeButton, timeRange === 'year' && styles.activeTimeRange]}
          onPress={() => setTimeRange('year')}
        >
          <Text style={[styles.timeRangeText, timeRange === 'year' && styles.activeTimeRangeText]}>
            Year
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Revenue',
            formatCurrency(ANALYTICS_DATA.revenue.total),
            ANALYTICS_DATA.revenue.growth,
            'cash-outline'
          )}
          {renderMetricCard(
            'Orders',
            ANALYTICS_DATA.orders.total,
            ANALYTICS_DATA.orders.growth,
            'document-text-outline'
          )}
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="trending-up" size={20} color="#86A8E7" /> Revenue Trend
          </Text>
          <View style={styles.chartCard}>
            <LineChart
              data={CHART_DATA.revenue}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Orders Breakdown */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pie-chart" size={20} color="#86A8E7" /> Orders Distribution
          </Text>
          <View style={styles.chartCard}>
            <PieChart
              data={CHART_DATA.ordersBreakdown.data}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        </View>

        {/* Weekly Orders */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bar-chart" size={20} color="#86A8E7" /> Weekly Performance
          </Text>
          <View style={styles.chartCard}>
            <BarChart
              data={CHART_DATA.weeklyOrders}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Customer Growth */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={20} color="#86A8E7" /> Customer Growth
          </Text>
          <View style={styles.chartCard}>
            <LineChart
              data={CHART_DATA.customerGrowth}
              width={screenWidth - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cut" size={20} color="#86A8E7" /> Popular Services
          </Text>
          <View style={styles.servicesGrid}>
            {ANALYTICS_DATA.services.mostPopular.map((service, index) => 
              renderServiceCard(service, index)
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bag" size={20} color="#86A8E7" /> Top Products
          </Text>
          <View style={styles.servicesGrid}>
            {ANALYTICS_DATA.products.mostSold.map((product, index) => 
              renderServiceCard(product, index)
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={20} color="#86A8E7" /> Customer Insights
          </Text>
          {renderCustomerStats()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={20} color="#86A8E7" /> Time Slot Analysis
          </Text>
          <View style={styles.timeAnalysis}>
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotTitle}>Most Booked Times</Text>
              {ANALYTICS_DATA.timeSlots.mostBooked.map((time, index) => (
                <View key={index} style={styles.timeSlotRow}>
                  <Ionicons name="trending-up" size={16} color="#96C93D" />
                  <Text style={styles.timeSlotText}>{time}</Text>
                </View>
              ))}
            </View>
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotTitle}>Least Booked Times</Text>
              {ANALYTICS_DATA.timeSlots.leastBooked.map((time, index) => (
                <View key={index} style={styles.timeSlotRow}>
                  <Ionicons name="trending-down" size={16} color="#FF6B6B" />
                  <Text style={styles.timeSlotText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A363B',
  },
  timeRangeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  activeTimeRange: {
    backgroundColor: '#86A8E7',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTimeRangeText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  metricGradient: {
    padding: 16,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 16,
  },
  servicesGrid: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A363B',
  },
  serviceCount: {
    fontSize: 13,
    color: '#666',
  },
  serviceRevenue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#86A8E7',
  },
  customerStats: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  customerStat: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  customerValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A363B',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeAnalysis: {
    flexDirection: 'row',
    gap: 16,
  },
  timeSlotSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A363B',
    marginBottom: 12,
  },
  timeSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#666',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#7F7FD5',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 