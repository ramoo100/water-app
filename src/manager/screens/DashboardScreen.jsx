import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const DashboardScreen = ({ onLogout }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Manager Dashboard</Text>
            <Text>Welcome to the manager control panel.</Text>
            <View style={styles.logoutButton}>
                <Button title="Log Out" onPress={onLogout} color="#c0392b" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    logoutButton: {
        marginTop: 30,
        width: '80%',
    }
});

export default DashboardScreen;
