import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

const ProductForm = ({ initialData = {}, onSubmit, submitButtonText = 'Save' }) => {
    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        price_syp: '',
        price_usd: '',
        quantity_in_stock: '',
        image_url: '',
        ...initialData,
    });

    useEffect(() => {
        // If initialData changes, update the form.
        // This is useful when the same form instance is used for different items.
        setFormData({ ...initialData });
    }, [initialData]);

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Name (English)</Text>
            <TextInput style={styles.input} value={formData.name_en} onChangeText={v => handleChange('name_en', v)} />

            <Text style={styles.label}>Name (Arabic)</Text>
            <TextInput style={styles.input} value={formData.name_ar} onChangeText={v => handleChange('name_ar', v)} />

            <Text style={styles.label}>Description (English)</Text>
            <TextInput style={styles.inputMulti} multiline value={formData.description_en} onChangeText={v => handleChange('description_en', v)} />

            <Text style={styles.label}>Description (Arabic)</Text>
            <TextInput style={styles.inputMulti} multiline value={formData.description_ar} onChangeText={v => handleChange('description_ar', v)} />

            <Text style={styles.label}>Price (SYP)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={String(formData.price_syp)} onChangeText={v => handleChange('price_syp', v)} />

            <Text style={styles.label}>Price (USD)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={String(formData.price_usd)} onChangeText={v => handleChange('price_usd', v)} />

            <Text style={styles.label}>Quantity in Stock</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={String(formData.quantity_in_stock)} onChangeText={v => handleChange('quantity_in_stock', v)} />

            <Text style={styles.label}>Image URL</Text>
            <TextInput style={styles.input} value={formData.image_url} onChangeText={v => handleChange('image_url', v)} />

            <Button title={submitButtonText} onPress={() => onSubmit(formData)} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 8,
        borderRadius: 5,
    },
    inputMulti: {
        minHeight: 80,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 8,
        paddingTop: 8,
        borderRadius: 5,
        textAlignVertical: 'top',
    },
});

export default ProductForm;
