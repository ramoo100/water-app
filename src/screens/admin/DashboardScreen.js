import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Icon,
  Badge,
  Divider,
  ListItem,
  Avatar
} from 'react-native-elements';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart
} from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import DashboardService from '../../services/dashboard.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import AlertsList from '../../components/dashboard/AlertsList';
import QuickActions from '../../components/dashboard/QuickActions';
import { formatCurrency } from '../../utils/currency';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await DashboardService.getDashboardData(selectedPeriod);
      setDashboardData(response.data);
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text h4>مرحباً، {user.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <Icon name="notifications" type="material" size={28} />
          {dashboardData?.alerts?.unread > 0 && (
            <Badge
              value={dashboardData.alerts.unread}
              status="error"
              containerStyle={styles.badge}
            />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.periodSelector}>
        <Button
          title="اليوم"
          type={selectedPeriod === 'today' ? 'solid' : 'outline'}
          onPress={() => setSelectedPeriod('today')}
          containerStyle={styles.periodButton}
        />
        <Button
          title="الأسبوع"
          type={selectedPeriod === 'week' ? 'solid' : 'outline'}
          onPress={() => setSelectedPeriod('week')}
          containerStyle={styles.periodButton}
        />
        <Button
          title="الشهر"
          type={selectedPeriod === 'month' ? 'solid' : 'outline'}
          onPress={() => setSelectedPeriod('month')}
          containerStyle={styles.periodButton}
        />
      </View>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.quickStats}>
      <Card containerStyle={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
        <Icon name="attach-money" type="material" color="white" size={30} />
        <Text style={styles.statValue}>
          {formatCurrency(dashboardData?.stats?.revenue || 0)}
        </Text>
        <Text style={styles.statLabel}>الإيرادات</Text>
      </Card>

      <Card containerStyle={[styles.statCard, { backgroundColor: '#2196F3' }]}>
        <Icon name="shopping-cart" type="material" color="white" size={30} />
        <Text style={styles.statValue}>
          {dashboardData?.stats?.orders || 0}
        </Text>
        <Text style={styles.statLabel}>الطلبات</Text>
      </Card>

      <Card containerStyle={[styles.statCard, { backgroundColor: '#FF9800' }]}>
        <Icon name="local-shipping" type="material" color="white" size={30} />
        <Text style={styles.statValue}>
          {dashboardData?.stats?.deliveries || 0}
        </Text>
        <Text style={styles.statLabel}>التوصيلات</Text>
      </Card>

      <Card containerStyle={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
        <Icon name="group" type="material" color="white" size={30} />
        <Text style={styles.statValue}>
          {dashboardData?.stats?.customers || 0}
        </Text>
        <Text style={styles.statLabel}>العملاء</Text>
      </Card>
    </View>
  );

  const renderPerformanceChart = () => {
    if (!dashboardData?.performance) return null;

    const data = {
      labels: dashboardData.performance.map(p => p.label),
      datasets: [{
        data: dashboardData.performance.map(p => p.value)
      }]
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>أداء المبيعات</Card.Title>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
        />
      </Card>
    );
  };

  const renderInventoryStatus = () => {
    if (!dashboardData?.inventory) return null;

    const data = {
      labels: ['مياه', 'ثلج'],
      data: [
        dashboardData.inventory.water / 100,
        dashboardData.inventory.ice / 100
      ]
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>حالة المخزون</Card.Title>
        <ProgressChart
          data={data}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
        />
        <View style={styles.inventoryLabels}>
          <Text>مياه: {dashboardData.inventory.water}%</Text>
          <Text>ثلج: {dashboardData.inventory.ice}%</Text>
        </View>
      </Card>
    );
  };

  const renderActiveWorkers = () => {
    if (!dashboardData?.workers) return null;

    return (
      <Card containerStyle={styles.workersCard}>
        <Card.Title>العمال النشطون</Card.Title>
        {dashboardData.workers.map((worker, index) => (
          <ListItem key={worker.id} bottomDivider={index !== dashboardData.workers.length - 1}>
            <Avatar
              rounded
              source={{ uri: worker.avatar }}
              title={worker.name[0]}
            />
            <ListItem.Content>
              <ListItem.Title>{worker.name}</ListItem.Title>
              <ListItem.Subtitle>{worker.status}</ListItem.Subtitle>
            </ListItem.Content>
            <Badge
              value={worker.deliveries}
              status={worker.deliveries > 5 ? 'success' : 'warning'}
            />
          </ListItem>
        ))}
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboardData} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderQuickStats()}
      <QuickActions />
      <AlertsList alerts={dashboardData?.alerts?.recent || []} />
      {renderPerformanceChart()}
      {renderInventoryStatus()}
      {renderActiveWorkers()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 15,
    backgroundColor: '#fff'
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15
  },
  periodButton: {
    width: '30%'
  },
  quickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 5
  },
  statCard: {
    width: '48%',
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5
  },
  statLabel: {
    color: 'white',
    fontSize: 14
  },
  chartCard: {
    borderRadius: 10,
    marginBottom: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  inventoryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  workersCard: {
    borderRadius: 10,
    marginBottom: 10
  }
});

export default DashboardScreen;
