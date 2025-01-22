import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function WorkerOrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;
  const [orderStatus, setOrderStatus] = useState(order.status);

  const handleUpdateStatus = (newStatus) => {
    Alert.alert(
      'تأكيد تحديث الحالة',
      'هل أنت متأكد من تحديث حالة الطلب؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: () => {
            setOrderStatus(newStatus);
            // TODO: Update status in backend
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>تفاصيل الطلب #{order.id}</Title>
          <Paragraph>العميل: {order.customerName}</Paragraph>
          <Paragraph>المنتج: {order.product}</Paragraph>
          <Paragraph>الكمية: {order.quantity}</Paragraph>
          <Paragraph>العنوان: {order.address}</Paragraph>
          <Paragraph>الحالة: {orderStatus}</Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 24.7136,
            longitude: 46.6753,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: 24.7136,
              longitude: 46.6753,
            }}
            title={order.customerName}
            description={order.address}
          />
        </MapView>
      </View>

      <View style={styles.actions}>
        {orderStatus === 'pending' && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus('in_progress')}
            style={styles.button}
          >
            بدء التوصيل
          </Button>
        )}

        {orderStatus === 'in_progress' && (
          <Button
            mode="contained"
            onPress={() => handleUpdateStatus('completed')}
            style={styles.button}
          >
            تأكيد التوصيل
          </Button>
        )}

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('CustomerContact', { order })}
          style={styles.button}
        >
          الاتصال بالعميل
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Support')}
          style={styles.button}
        >
          طلب المساعدة
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
  card: {
    margin: 10,
  },
  mapContainer: {
    height: 300,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  actions: {
    padding: 10,
  },
  button: {
    marginVertical: 5,
  },
});
