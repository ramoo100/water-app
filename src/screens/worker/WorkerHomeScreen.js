import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text, Badge } from 'react-native-paper';

export default function WorkerHomeScreen({ navigation }) {
  const [orders] = useState([
    {
      id: '1',
      customerName: 'أحمد محمد',
      address: 'شارع الملك فهد، الرياض',
      product: 'عبوة مياه كبيرة',
      quantity: 2,
      status: 'pending',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      customerName: 'خالد عبدالله',
      address: 'شارع العليا، الرياض',
      product: 'عبوة مياه متوسطة',
      quantity: 3,
      status: 'in_progress',
      timestamp: new Date().toISOString(),
    },
  ]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFA000';
      case 'in_progress':
        return '#1976D2';
      case 'completed':
        return '#388E3C';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'in_progress':
        return 'جاري التنفيذ';
      case 'completed':
        return 'مكتمل';
      default:
        return 'غير معروف';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>مرحباً، عبدالله</Text>
        <Text style={styles.statsText}>الطلبات النشطة: {orders.length}</Text>
      </View>

      <Title style={styles.sectionTitle}>الطلبات الحالية</Title>

      {orders.map((order) => (
        <Card
          key={order.id}
          style={styles.card}
          onPress={() => navigation.navigate('WorkerOrderDetails', { order })}
        >
          <Card.Content>
            <View style={styles.orderHeader}>
              <Title>طلب #{order.id}</Title>
              <Badge
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBadgeColor(order.status) },
                ]}
              >
                {getStatusText(order.status)}
              </Badge>
            </View>
            
            <Paragraph>العميل: {order.customerName}</Paragraph>
            <Paragraph>المنتج: {order.product}</Paragraph>
            <Paragraph>الكمية: {order.quantity}</Paragraph>
            <Paragraph>العنوان: {order.address}</Paragraph>
            
            <View style={styles.cardActions}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('WorkerOrderDetails', { order })}
              >
                عرض التفاصيل
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('WorkerProfile')}
        style={styles.profileButton}
      >
        الملف الشخصي
      </Button>
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
  welcomeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  statsText: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  sectionTitle: {
    margin: 10,
  },
  card: {
    margin: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
  },
  cardActions: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  profileButton: {
    margin: 10,
  },
});
