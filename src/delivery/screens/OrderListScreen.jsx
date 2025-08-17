import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Button } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import { startTracking, stopTracking } from '../services/trackingService';

const OrderListScreen = ({ navigation, onLogout }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        const fetchUserAndOrders = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`*, client:users(full_name)`)
                    .eq('delivery_worker_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error fetching orders:', error);
                } else {
                    setOrders(data);
                }
            }
            setLoading(false);
        };

        const unsubscribe = navigation.addListener('focus', () => {
            fetchUserAndOrders();
        });

        return unsubscribe;
    }, [navigation]);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <View style={styles.orderItem}>
                <View>
                    <Text style={styles.clientName}>Client: {item.client.full_name}</Text>
                    <Text style={styles.address}>Address: {item.delivery_address}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, { backgroundColor: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const handleStartShift = () => {
        startTracking();
        setIsTracking(true);
    };

    const handleEndShift = () => {
        stopTracking();
        setIsTracking(false);
    };

    return (
        <View style={styles.container}>
             <View style={styles.shiftControls}>
                <Button title="Start Shift" onPress={handleStartShift} disabled={isTracking} color="#2ecc71" />
                <Button title="End Shift" onPress={handleEndShift} disabled={!isTracking} color="#e74c3c" />
             </View>
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.title}>My Assigned Orders</Text>}
                ListEmptyComponent={<Text style={styles.emptyText}>You have no assigned orders.</Text>}
            />
            <View style={styles.logoutButton}>
                <Button title="Log Out" onPress={onLogout} />
            </View>
        </View>
    );
};

// Re-using the getStatusColor function from manager app
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
    container: { flex: 1, padding: 10 },
    loader: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    shiftControls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    orderItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
    },
    clientName: { fontSize: 16, fontWeight: 'bold' },
    address: { fontSize: 14, color: 'gray' },
    statusContainer: {},
    statusText: {
        color: 'white',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        overflow: 'hidden',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: 'gray' },
    logoutButton: {
        margin: 20,
    }
});

export default OrderListScreen;
