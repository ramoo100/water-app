import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Button } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { Picker } from '@react-native-picker/picker';

const OrderDetailScreen = ({ route }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [deliveryWorkers, setDeliveryWorkers] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for the pickers
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedWorker, setSelectedWorker] = useState(null);

    const orderStatuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);

            // Fetch main order details, joining with user table
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*, client:users(*)')
                .eq('id', orderId)
                .single();

            // Fetch items associated with the order, joining with products table
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*, product:products(*)')
                .eq('order_id', orderId);

            // Fetch all available delivery workers
            const { data: workersData, error: workersError } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'delivery_worker');

            if (orderError || itemsError || workersError) {
                Alert.alert('Error', 'Failed to fetch order details.');
            } else {
                setOrder(orderData);
                setOrderItems(itemsData);
                setDeliveryWorkers(workersData);
                setSelectedStatus(orderData.status);
                setSelectedWorker(orderData.delivery_worker_id);
            }
            setLoading(false);
        };

        fetchOrderDetails();
    }, [orderId]);

    const handleUpdateOrder = async () => {
        const { error } = await supabase
            .from('orders')
            .update({
                status: selectedStatus,
                delivery_worker_id: selectedWorker
            })
            .eq('id', orderId);

        if (error) {
            Alert.alert('Error', 'Failed to update order.');
        } else {
            Alert.alert('Success', 'Order updated successfully.');
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
            <Text style={styles.title}>Order #{order.id.substring(0, 8)}</Text>
            <Text>Client: {order.client.full_name}</Text>
            <Text>Address: {order.delivery_address}</Text>
            <Text>Total: {order.total_amount_syp} SYP</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Update Status</Text>
                <Picker selectedValue={selectedStatus} onValueChange={setSelectedStatus}>
                    {orderStatuses.map(status => <Picker.Item key={status} label={status} value={status} />)}
                </Picker>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Assign Delivery Worker</Text>
                <Picker selectedValue={selectedWorker} onValueChange={setSelectedWorker}>
                    <Picker.Item label="-- Unassigned --" value={null} />
                    {deliveryWorkers.map(worker => <Picker.Item key={worker.id} label={worker.full_name} value={worker.id} />)}
                </Picker>
            </View>

            <Button title="Save Changes" onPress={handleUpdateOrder} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Items in Order</Text>
                {orderItems.map(item => (
                    <View key={item.id} style={styles.item}>
                        <Text>{item.product.name_en}</Text>
                        <Text>Qty: {item.quantity}</Text>
                        <Text>{item.price_per_unit_syp} SYP</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    title: { fontSize: 24, fontWeight: 'bold' },
    section: { marginVertical: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' }
});

export default OrderDetailScreen;
