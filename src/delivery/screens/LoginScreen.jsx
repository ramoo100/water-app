import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const DeliveryLoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Login Error', error.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                Alert.alert('Error', 'Could not fetch user profile.');
                await supabase.auth.signOut();
                setLoading(false);
                return;
            }

            if (profile.role === 'delivery_worker') {
                // Success, the main App component will handle navigation
            } else {
                Alert.alert('Access Denied', 'You must be a delivery worker to use this app.');
                await supabase.auth.signOut();
            }
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Delivery Worker Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button
                title={loading ? 'Logging in...' : 'Log In'}
                onPress={handleLogin}
                disabled={loading}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
});

export default DeliveryLoginScreen;
