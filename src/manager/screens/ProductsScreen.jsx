import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Button, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const ProductsScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button onPress={() => navigation.navigate('ProductCreate')} title="Add New" />
            ),
        });
    }, [navigation]);

    useEffect(() => {
        // Use a focus listener to refetch data when the screen comes into view
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProducts();
        });

        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data);
            }
            setLoading(false);
        };

        fetchProducts();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('ProductEdit', { product: item })}>
            <View style={styles.productItem}>
                <Image
                    source={{ uri: item.image_url || 'https://placehold.co/100x100' }}
                    style={styles.productImage}
                />
                <View style={styles.productDetails}>
                    <Text style={styles.productName}>{item.name_en}</Text>
                    <Text style={styles.productNameAr}>{item.name_ar}</Text>
                    <Text style={styles.productStock}>Stock: {item.quantity_in_stock}</Text>
                </View>
                <View style={styles.productPricing}>
                    <Text style={styles.productPrice}>{item.price_syp} SYP</Text>
                    <Text style={styles.productPrice}>${item.price_usd} USD</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.title}>Product Management</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    productItem: {
        flexDirection: 'row',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        alignItems: 'center',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 5,
        marginRight: 10,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    productNameAr: {
        fontSize: 14,
        color: 'gray',
    },
    productStock: {
        fontSize: 12,
        color: 'blue',
    },
    productPricing: {
        alignItems: 'flex-end',
    },
    productPrice: {
        fontSize: 14,
    }
});

export default ProductsScreen;
