import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';

export default function OrderConfirmationScreen({ route, navigation }) {
  const { orderDetails } = route.params;

  const handlePayment = () => {
    // TODO: Implement payment gateway integration
    navigation.navigate('PaymentScreen', { orderDetails });
  };

  const handleCashOnDelivery = () => {
    // TODO: Implement cash on delivery logic
    navigation.navigate('OrderTracking', { orderDetails });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>تأكيد الطلب</Title>
          <Paragraph>المنتج: {orderDetails.product.name}</Paragraph>
          <Paragraph>الكمية: {orderDetails.quantity}</Paragraph>
          <Paragraph>السعر الإجمالي: {orderDetails.quantity * parseInt(orderDetails.product.price)} ريال</Paragraph>
          <Paragraph>العنوان: {orderDetails.address}</Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.paymentOptions}>
        <Text style={styles.sectionTitle}>اختر طريقة الدفع</Text>
        
        <Button
          mode="contained"
          onPress={handlePayment}
          style={styles.button}
        >
          الدفع الإلكتروني
        </Button>

        <Button
          mode="outlined"
          onPress={handleCashOnDelivery}
          style={styles.button}
        >
          الدفع عند الاستلام
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
  paymentOptions: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    marginVertical: 5,
  },
});
