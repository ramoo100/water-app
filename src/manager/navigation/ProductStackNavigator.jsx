import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProductsScreen from '../screens/ProductsScreen';
import ProductCreateScreen from '../screens/ProductCreateScreen';
import ProductEditScreen from '../screens/ProductEditScreen';

const Stack = createStackNavigator();

const ProductStackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProductList"
                component={ProductsScreen}
                options={{ title: 'Product Management' }}
            />
            <Stack.Screen
                name="ProductCreate"
                component={ProductCreateScreen}
                options={{ title: 'Create New Product' }}
            />
            <Stack.Screen
                name="ProductEdit"
                component={ProductEditScreen}
                options={{ title: 'Edit Product' }}
            />
        </Stack.Navigator>
    );
};

export default ProductStackNavigator;
