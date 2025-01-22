import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Icon, Card } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    {
      title: 'طلب جديد',
      icon: 'add-shopping-cart',
      screen: 'NewOrder',
      color: '#4CAF50'
    },
    {
      title: 'إدارة المخزون',
      icon: 'inventory',
      screen: 'Inventory',
      color: '#2196F3'
    },
    {
      title: 'التوصيلات',
      icon: 'local-shipping',
      screen: 'Deliveries',
      color: '#FF9800'
    },
    {
      title: 'التقارير',
      icon: 'assessment',
      screen: 'Reports',
      color: '#9C27B0'
    },
    {
      title: 'العمال',
      icon: 'group',
      screen: 'Workers',
      color: '#795548'
    },
    {
      title: 'الإعدادات',
      icon: 'settings',
      screen: 'Settings',
      color: '#607D8B'
    }
  ];

  return (
    <Card containerStyle={styles.container}>
      <Card.Title>الإجراءات السريعة</Card.Title>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <Button
            key={index}
            title={action.title}
            icon={
              <Icon
                name={action.icon}
                type="material"
                color="white"
                size={24}
                containerStyle={styles.iconContainer}
              />
            }
            buttonStyle={[styles.button, { backgroundColor: action.color }]}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            onPress={() => navigation.navigate(action.screen)}
          />
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    marginBottom: 10
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 5
  },
  buttonContainer: {
    width: '48%',
    marginBottom: 10
  },
  button: {
    padding: 15,
    borderRadius: 10
  },
  iconContainer: {
    marginBottom: 5
  },
  buttonTitle: {
    fontSize: 14,
    textAlign: 'center'
  }
});

export default QuickActions;
