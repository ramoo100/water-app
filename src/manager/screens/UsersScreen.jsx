import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const UsersScreen = ({ navigation }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button onPress={() => navigation.navigate('CreateUser')} title="Add New" />
            ),
        });
    }, [navigation]);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, role, phone_number');

            if (error) {
                console.error('Error fetching users:', error);
            } else {
                setUsers(data);
            }
            setLoading(false);
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <ActivityIndicator size="large" style={styles.loader} />;
    }

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('UserDetail', { userId: item.id })}>
            <View style={styles.userItem}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={styles.userRole}>{item.role}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={users}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={<Text style={styles.title}>User Management</Text>}
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
    userItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    userName: {
        fontSize: 16,
    },
    userRole: {
        fontSize: 14,
        color: 'gray',
        textTransform: 'capitalize',
    },
});

export default UsersScreen;
