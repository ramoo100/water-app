import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Icon,
  Overlay,
  Divider
} from 'react-native-elements';
import {
  LineChart,
  BarChart,
  PieChart,
  ContributionGraph
} from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import AnalyticsService from '../../services/analytics.service';
import ForecastService from '../../services/advancedForecast.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import { formatCurrency } from '../../utils/currency';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState('start');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, startDate, endDate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analytics, forecast] = await Promise.all([
        AnalyticsService.getAnalytics({
          timeRange,
          startDate,
          endDate,
          productId: selectedProduct?._id
        }),
        selectedProduct ? ForecastService.generateDemandForecast(
          selectedProduct._id,
          null,
          { historyMonths: 12, forecastMonths: 3 }
        ) : null
      ]);

      setAnalyticsData(analytics.data);
      setForecastData(forecast?.data);
    } catch (err) {
      setError('حدث خطأ في تحميل البيانات التحليلية');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (dateType === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const renderSalesChart = () => {
    if (!analyticsData?.sales) return null;

    const data = {
      labels: analyticsData.sales.map(s => s.date),
      datasets: [{
        data: analyticsData.sales.map(s => s.amount)
      }]
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>المبيعات</Card.Title>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
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

  const renderProductDistribution = () => {
    if (!analyticsData?.products) return null;

    const data = analyticsData.products.map(p => ({
      name: p.name,
      population: p.quantity,
      color: `rgba(0, 122, 255, ${Math.random() * 0.5 + 0.5})`,
      legendFontColor: '#7F7F7F'
    }));

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>توزيع المنتجات</Card.Title>
        <PieChart
          data={data}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </Card>
    );
  };

  const renderForecastChart = () => {
    if (!forecastData) return null;

    const data = {
      labels: forecastData.forecast.map(f => f.date),
      datasets: [{
        data: forecastData.forecast.map(f => f.quantity)
      }]
    };

    return (
      <Card containerStyle={styles.chartCard}>
        <Card.Title>التنبؤ بالطلب</Card.Title>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
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
          bezier
          style={styles.chart}
        />
        <View style={styles.forecastStats}>
          <Text>الثقة: {forecastData.confidence}%</Text>
          <Text>الدقة التاريخية: {forecastData.accuracy}%</Text>
        </View>
      </Card>
    );
  };

  const renderMetricsCards = () => {
    if (!analyticsData?.metrics) return null;

    return (
      <View style={styles.metricsContainer}>
        <Card containerStyle={styles.metricCard}>
          <Icon name="trending-up" type="material" color="#4CAF50" size={30} />
          <Text style={styles.metricValue}>
            {formatCurrency(analyticsData.metrics.totalRevenue)}
          </Text>
          <Text style={styles.metricLabel}>الإيرادات</Text>
        </Card>

        <Card containerStyle={styles.metricCard}>
          <Icon name="shopping-cart" type="material" color="#2196F3" size={30} />
          <Text style={styles.metricValue}>
            {analyticsData.metrics.totalOrders}
          </Text>
          <Text style={styles.metricLabel}>الطلبات</Text>
        </Card>

        <Card containerStyle={styles.metricCard}>
          <Icon name="people" type="material" color="#FF9800" size={30} />
          <Text style={styles.metricValue}>
            {analyticsData.metrics.activeCustomers}
          </Text>
          <Text style={styles.metricLabel}>العملاء النشطون</Text>
        </Card>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadAnalytics} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h4>التحليلات</Text>
        <View style={styles.timeRangeButtons}>
          <Button
            title="شهر"
            type={timeRange === 'month' ? 'solid' : 'outline'}
            onPress={() => setTimeRange('month')}
          />
          <Button
            title="ربع سنة"
            type={timeRange === 'quarter' ? 'solid' : 'outline'}
            onPress={() => setTimeRange('quarter')}
          />
          <Button
            title="سنة"
            type={timeRange === 'year' ? 'solid' : 'outline'}
            onPress={() => setTimeRange('year')}
          />
        </View>
      </View>

      {renderMetricsCards()}
      {renderSalesChart()}
      {renderProductDistribution()}
      {renderForecastChart()}

      <Overlay
        isVisible={showDatePicker}
        onBackdropPress={() => setShowDatePicker(false)}
      >
        <DateTimePicker
          value={dateType === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      </Overlay>
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
  timeRangeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  },
  chartCard: {
    borderRadius: 10,
    marginBottom: 10
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10
  },
  metricCard: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    alignItems: 'center'
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 5
  },
  metricLabel: {
    fontSize: 12,
    color: '#666'
  },
  forecastStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10
  }
});

export default AnalyticsScreen;
