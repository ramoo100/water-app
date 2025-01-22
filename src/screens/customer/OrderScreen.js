import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card, Title, Paragraph } from 'react-native-paper';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

export default function OrderScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const handlePlaceOrder = () => {
    // TODO: Implement order submission to backend
    const orderDetails = {
      product,
      quantity: parseInt(quantity),
      address,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : null,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    console.log('Order placed:', orderDetails);
    navigation.navigate('OrderConfirmation', { orderDetails });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>تفاصيل المنتج</Title>
          <Paragraph>المنتج: {product.name}</Paragraph>
          <Paragraph>السعر: {product.price}</Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.form}>
        <TextInput
          label="الكمية"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="العنوان التفصيلي"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          style={styles.input}
          mode="outlined"
        />

        {location && (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                draggable
                onDragEnd={(e) => {
                  setLocation({
                    coords: e.nativeEvent.coordinate
                  });
                }}
              />
            </MapView>
          </View>
        )}

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          style={styles.button}
        >
          تأكيد الطلب
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
  form: {
    padding: 10,
  },
  input: {
    marginBottom: 10,
  },
  mapContainer: {
    height: 300,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});
