import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderDetails } = route.params;
  const [orderStatus, setOrderStatus] = useState('pending');
  const [workerLocation, setWorkerLocation] = useState(null);

  // Simulated worker location for demo
  useEffect(() => {
    if (orderStatus === 'in_progress') {
      // Simulate worker movement
      const interval = setInterval(() => {
        setWorkerLocation(prev => ({
          latitude: prev ? prev.latitude + 0.0001 : orderDetails.location.latitude + 0.001,
          longitude: prev ? prev.longitude + 0.0001 : orderDetails.location.longitude + 0.001,
        }));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [orderStatus]);

  const getStatusText = () => {
    switch (orderStatus) {
      case 'pending':
        return 'في انتظار تأكيد الطلب';
      case 'confirmed':
        return 'تم تأكيد الطلب';
      case 'in_progress':
        return 'جاري التوصيل';
      case 'completed':
        return 'تم التوصيل';
      default:
        return 'حالة غير معروفة';
    }
  };

  // Simulate order progress
  useEffect(() => {
    const statuses = ['pending', 'confirmed', 'in_progress', 'completed'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setOrderStatus(statuses[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>تتبع الطلب</Title>
          <Paragraph>رقم الطلب: #{Math.floor(Math.random() * 10000)}</Paragraph>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>حالة الطلب: {getStatusText()}</Text>
            {orderStatus !== 'completed' && <ActivityIndicator style={styles.loader} />}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>تفاصيل الطلب</Title>
          <Paragraph>المنتج: {orderDetails.product.name}</Paragraph>
          <Paragraph>الكمية: {orderDetails.quantity}</Paragraph>
          <Paragraph>العنوان: {orderDetails.address}</Paragraph>
        </Card.Content>
      </Card>

      {orderDetails.location && (
        <Card style={styles.mapCard}>
          <Card.Content>
            <Title>موقع التوصيل</Title>
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                  latitude: orderDetails.location.latitude,
                  longitude: orderDetails.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: orderDetails.location.latitude,
                    longitude: orderDetails.location.longitude,
                  }}
                  title="موقع التوصيل"
                />
                {workerLocation && (
                  <Marker
                    coordinate={workerLocation}
                    title="موقع المندوب"
                    pinColor="blue"
                  />
                )}
              </MapView>
            </View>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        onPress={() => navigation.navigate('Support')}
        style={styles.supportButton}
      >
        تواصل مع الدعم
      </Button>
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
  mapCard: {
    margin: 10,
    height: 400,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  loader: {
    marginLeft: 10,
  },
  mapContainer: {
    height: 300,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  supportButton: {
    margin: 10,
  },
});
