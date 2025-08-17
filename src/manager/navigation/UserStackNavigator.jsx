import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UsersScreen from '../screens/UsersScreen';
import CreateUserScreen from '../screens/CreateUserScreen';
import UserDetailScreen from '../screens/UserDetailScreen';

const Stack = createStackNavigator();

const UserStackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="UserList"
                component={UsersScreen}
                options={{ title: 'User Management' }}
            />
            <Stack.Screen
                name="CreateUser"
                component={CreateUserScreen}
                options={{ title: 'Create New User' }}
            />
            <Stack.Screen
                name="UserDetail"
                component={UserDetailScreen}
                options={{ title: 'User Details' }}
            />
        </Stack.Navigator>
    );
};

export default UserStackNavigator;
