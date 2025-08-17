import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ProductForm from '../components/ProductForm';
import { supabase } from '../../lib/supabaseClient';

const ProductEditScreen = ({ route, navigation }) => {
    const { product } = route.params;
    const [loading, setLoading] = useState(false);

    const handleUpdateProduct = async (formData) => {
        setLoading(true);
        const { error } = await supabase
            .from('products')
            .update({
                ...formData,
                // Ensure numeric fields are correctly formatted
                price_syp: parseFloat(formData.price_syp) || 0,
                price_usd: parseFloat(formData.price_usd) || 0,
                quantity_in_stock: parseInt(formData.quantity_in_stock, 10) || 0,
            })
            .eq('id', product.id);

        setLoading(false);

        if (error) {
            Alert.alert('Error', 'Failed to update product: ' + error.message);
        } else {
            Alert.alert('Success', 'Product updated successfully.');
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <ProductForm
                initialData={product}
                onSubmit={handleUpdateProduct}
                submitButtonText={loading ? 'Updating...' : 'Update Product'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ProductEditScreen;
