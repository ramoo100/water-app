import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OrderListScreen from '../screens/OrderListScreen';
import DeliveryOrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createStackNavigator();

const DeliveryNavigator = ({ onLogout }) => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="OrderList" options={{ title: 'My Assigned Orders' }}>
                {props => <OrderListScreen {...props} onLogout={onLogout} />}
            </Stack.Screen>
            <Stack.Screen
                name="OrderDetail"
                component={DeliveryOrderDetailScreen}
                options={{ title: 'Order Details' }}
            />
        </Stack.Navigator>
    );
};

export default DeliveryNavigator;
