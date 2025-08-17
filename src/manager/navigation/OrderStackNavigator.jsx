import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createStackNavigator();

const OrderStackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="OrderList"
                component={OrdersScreen}
                options={{ title: 'Order Management' }}
            />
            <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{ title: 'Order Details' }}
            />
        </Stack.Navigator>
    );
};

export default OrderStackNavigator;
