import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import UserStackNavigator from './UserStackNavigator';
import ProductStackNavigator from './ProductStackNavigator';
import OrderStackNavigator from './OrderStackNavigator';
import MapScreen from '../screens/MapScreen';

const Tab = createBottomTabNavigator();

const ManagerTabNavigator = ({ onLogout }) => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Users') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'Products') {
                        iconName = focused ? 'cube' : 'cube-outline';
                    } else if (route.name === 'Orders') {
                        iconName = focused ? 'receipt' : 'receipt-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'tomato',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Dashboard">
                {props => <DashboardScreen {...props} onLogout={onLogout} />}
            </Tab.Screen>
            <Tab.Screen
                name="Users"
                component={UserStackNavigator}
                options={{ headerShown: false }} // Hide the tab navigator's header for this stack
            />
            <Tab.Screen
                name="Products"
                component={ProductStackNavigator}
                options={{ headerShown: false }}
            />
            <Tab.Screen
                name="Orders"
                component={OrderStackNavigator}
                options={{ headerShown: false }}
            />
            <Tab.Screen name="Map" component={MapScreen} />
        </Tab.Navigator>
    );
};

export default ManagerTabNavigator;
