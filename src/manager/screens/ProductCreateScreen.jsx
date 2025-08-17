import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ProductForm from '../components/ProductForm';
import { supabase } from '../../lib/supabaseClient';

const ProductCreateScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const handleCreateProduct = async (formData) => {
        setLoading(true);
        const { error } = await supabase.from('products').insert([
            {
                ...formData,
                // Ensure numeric fields are correctly formatted
                price_syp: parseFloat(formData.price_syp) || 0,
                price_usd: parseFloat(formData.price_usd) || 0,
                quantity_in_stock: parseInt(formData.quantity_in_stock, 10) || 0,
            },
        ]);

        setLoading(false);

        if (error) {
            Alert.alert('Error', 'Failed to create product: ' + error.message);
        } else {
            Alert.alert('Success', 'Product created successfully.');
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <ProductForm
                onSubmit={handleCreateProduct}
                submitButtonText={loading ? 'Creating...' : 'Create Product'}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ProductCreateScreen;
