import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Assuming picker is installed or will be
import { supabase } from '../../lib/supabaseClient';

const CreateUserScreen = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('delivery_worker'); // Default role
    const [loading, setLoading] = useState(false);

    const handleCreateUser = async () => {
        if (!fullName || !email || !password) {
            Alert.alert('Error', 'Please fill all fields.');
            return;
        }
        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: { fullName, email, password, role },
            });

            if (error) throw error;

            if (data.error) {
                throw new Error(data.error);
            }

            Alert.alert('Success', `User ${email} created successfully.`);
            navigation.goBack();

        } catch (error) {
            Alert.alert('Error creating user', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Create New User</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={fullName}
                onChangeText={setFullName}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter temporary password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                >
                    <Picker.Item label="Delivery Worker" value="delivery_worker" />
                    <Picker.Item label="Assistant" value="assistant" />
                    <Picker.Item label="Client" value="client" />
                </Picker>
            </View>

            <Button
                title={loading ? 'Creating...' : 'Create User'}
                onPress={handleCreateUser}
                disabled={loading}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: 'gray',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 8,
        borderRadius: 5,
    },
    pickerContainer: {
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
    }
});

export default CreateUserScreen;
