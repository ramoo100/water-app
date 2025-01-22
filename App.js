import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

// Import screens here later
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/customer/HomeScreen';
import OrderScreen from './src/screens/customer/OrderScreen';
import OrderConfirmationScreen from './src/screens/customer/OrderConfirmationScreen';
import OrderTrackingScreen from './src/screens/customer/OrderTrackingScreen';
import WorkerHomeScreen from './src/screens/worker/WorkerHomeScreen';
import WorkerOrderDetailsScreen from './src/screens/worker/WorkerOrderDetailsScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import OrderManagementScreen from './src/screens/admin/OrderManagementScreen';
import WorkerManagementScreen from './src/screens/admin/WorkerManagementScreen';

const Stack = createStackNavigator();

export default function App() {
  const [userType, setUserType] = useState('customer'); // 'customer', 'worker', or 'admin'

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={
          userType === 'worker' ? 'WorkerHome' : 
          userType === 'admin' ? 'AdminDashboard' : 
          'Login'
        }>
          {userType === 'customer' ? (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Register" 
                component={RegisterScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ 
                  title: 'الرئيسية',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="Order" 
                component={OrderScreen}
                options={{ 
                  title: 'تفاصيل الطلب',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="OrderConfirmation" 
                component={OrderConfirmationScreen}
                options={{ 
                  title: 'تأكيد الطلب',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="OrderTracking" 
                component={OrderTrackingScreen}
                options={{ 
                  title: 'تتبع الطلب',
                  headerTitleAlign: 'center',
                }}
              />
            </>
          ) : userType === 'worker' ? (
            <>
              <Stack.Screen 
                name="WorkerHome" 
                component={WorkerHomeScreen}
                options={{ 
                  title: 'الطلبات',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="WorkerOrderDetails" 
                component={WorkerOrderDetailsScreen}
                options={{ 
                  title: 'تفاصيل الطلب',
                  headerTitleAlign: 'center',
                }}
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardScreen}
                options={{ 
                  title: 'لوحة التحكم',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="OrderManagement" 
                component={OrderManagementScreen}
                options={{ 
                  title: 'إدارة الطلبات',
                  headerTitleAlign: 'center',
                }}
              />
              <Stack.Screen 
                name="WorkerManagement" 
                component={WorkerManagementScreen}
                options={{ 
                  title: 'إدارة العمال',
                  headerTitleAlign: 'center',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
