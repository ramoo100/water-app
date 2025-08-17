import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const OrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchOrders();
        });

        const fetchOrders = async () => {
            // We join with the users table to get the client's name
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    created_at,
                    status,
                    total_amount_syp,
                    users ( full_name )
                `)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
            } else {
                setOrders(data);
            }
            setLoading(false);
        };

        fetchOrders();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <View style={styles.orderItem}>
                <View style={styles.orderDetails}>
                    <Text style={styles.clientName}>{item.users.full_name}</Text>
                    <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.orderStatus}>
                    <Text style={[styles.statusText, { backgroundColor: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                    <Text style={styles.orderTotal}>{item.total_amount_syp.toFixed(2)} SYP</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.title}>Order Management</Text>}
            />
        </View>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pending': return '#f1c40f';
        case 'confirmed': return '#2ecc71';
        case 'out_for_delivery': return '#3498db';
        case 'delivered': return '#95a5a6';
        case 'cancelled':
        case 'rejected':
            return '#e74c3c';
        default: return 'gray';
    }
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
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        alignItems: 'center',
    },
    orderDetails: {},
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    orderDate: {
        fontSize: 12,
        color: 'gray',
    },
    orderStatus: {
        alignItems: 'flex-end',
    },
    statusText: {
        color: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        overflow: 'hidden', // Ensures the background color respects the border radius
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    orderTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
    },
});

export default OrdersScreen;
