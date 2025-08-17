import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Button } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const DeliveryOrderDetailScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*, client:users(full_name, phone_number)')
                .eq('id', orderId)
                .single();

            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*, product:products(name_en, name_ar)')
                .eq('order_id', orderId);

            if (orderError || itemsError) {
                Alert.alert('Error', 'Failed to fetch order details.');
            } else {
                setOrder(orderData);
                setOrderItems(itemsData);
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [orderId]);

    const updateStatus = async (newStatus) => {
        setLoading(true);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        setLoading(false);
        if (error) {
            Alert.alert('Error', 'Failed to update order status.');
        } else {
            Alert.alert('Success', `Order marked as ${newStatus}.`);
            navigation.goBack();
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1 }} />;
    }

    if (!order) {
        return <Text>Order not found.</Text>
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Client Details</Text>
                <Text>Name: {order.client.full_name}</Text>
                <Text>Phone: {order.client.phone_number || 'N/A'}</Text>
                <Text>Address: {order.delivery_address}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items</Text>
                {orderItems.map(item => (
                    <View key={item.id} style={styles.item}>
                        <Text style={styles.itemName}>{item.product.name_en}</Text>
                        <Text style={styles.itemQty}>x {item.quantity}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.actions}>
                <Button title="Mark as Delivered" onPress={() => updateStatus('delivered')} color="#2ecc71" />
                <View style={{marginTop: 10}}>
                    <Button title="Mark as Rejected" onPress={() => updateStatus('rejected')} color="#e74c3c" />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    itemName: { fontSize: 16 },
    itemQty: { fontSize: 16, fontWeight: 'bold' },
    actions: { marginTop: 20 },
});

export default DeliveryOrderDetailScreen;
