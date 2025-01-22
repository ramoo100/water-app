import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Surface, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function AdminDashboardScreen({ navigation }) {
  const theme = useTheme();
  const [stats] = useState({
    totalOrders: 156,
    activeOrders: 12,
    totalWorkers: 8,
    activeWorkers: 6,
    revenue: 15600,
  });

  const chartData = {
    labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43, 50],
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>لوحة التحكم</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('ar-SA')}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Surface style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>إجمالي الطلبات</Text>
        </Surface>

        <Surface style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeOrders}</Text>
          <Text style={styles.statLabel}>الطلبات النشطة</Text>
        </Surface>

        <Surface style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalWorkers}</Text>
          <Text style={styles.statLabel}>العمال</Text>
        </Surface>

        <Surface style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.revenue} ر.س</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </Surface>
      </View>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Title>إحصائيات الطلبات الأسبوعية</Title>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.surface,
              backgroundGradientFrom: theme.colors.surface,
              backgroundGradientTo: theme.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => theme.colors.text,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('OrderManagement')}
          style={styles.button}
        >
          إدارة الطلبات
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('WorkerManagement')}
          style={styles.button}
        >
          إدارة العمال
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Reports')}
          style={styles.button}
        >
          التقارير
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Settings')}
          style={styles.button}
        >
          الإعدادات
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2196F3',
  },
  headerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartCard: {
    margin: 10,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionButtons: {
    padding: 10,
  },
  button: {
    marginVertical: 5,
  },
});
