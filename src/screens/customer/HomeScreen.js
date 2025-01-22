import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  const products = [
    {
      id: 1,
      name: 'عبوة مياه كبيرة',
      size: '19 لتر',
      price: '10 ريال',
      description: 'عبوة مياه نقية صالحة للشرب',
    },
    {
      id: 2,
      name: 'عبوة مياه متوسطة',
      size: '10 لتر',
      price: '6 ريال',
      description: 'عبوة مياه نقية صالحة للشرب',
    },
  ];

  const handleOrder = (product) => {
    navigation.navigate('Order', { product });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.productsContainer}>
        {products.map((product) => (
          <Card key={product.id} style={styles.card}>
            <Card.Content>
              <Title>{product.name}</Title>
              <Paragraph>الحجم: {product.size}</Paragraph>
              <Paragraph>السعر: {product.price}</Paragraph>
              <Paragraph>{product.description}</Paragraph>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleOrder(product)}>طلب</Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productsContainer: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
  },
});
