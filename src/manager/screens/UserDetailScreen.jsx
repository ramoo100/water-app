import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

const UserDetailScreen = ({ route }) => {
    const { userId } = route.params;
    const [user, setUser] = useState(null);
    const [allPermissions, setAllPermissions] = useState([]);
    const [userPermissions, setUserPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            // Fetch user details
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) {
                Alert.alert('Error', 'Failed to fetch user details.');
                setLoading(false);
                return;
            }
            setUser(userData);

            // If user is an assistant, fetch permissions
            if (userData.role === 'assistant') {
                // Fetch all possible permissions
                const { data: allPermsData, error: allPermsError } = await supabase
                    .from('permissions')
                    .select('*');

                // Fetch the assistant's current permissions
                const { data: userPermsData, error: userPermsError } = await supabase
                    .from('assistant_permissions')
                    .select('permission_id')
                    .eq('assistant_id', userId);

                if (allPermsError || userPermsError) {
                    Alert.alert('Error', 'Failed to fetch permissions.');
                } else {
                    setAllPermissions(allPermsData);
                    setUserPermissions(new Set(userPermsData.map(p => p.permission_id)));
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [userId]);

    const handlePermissionToggle = async (permissionId, hasPermission) => {
        const optimisticUserPerms = new Set(userPermissions);
        if (hasPermission) {
            optimisticUserPerms.delete(permissionId);
        } else {
            optimisticUserPerms.add(permissionId);
        }
        setUserPermissions(optimisticUserPerms);

        if (hasPermission) {
            // Delete the permission
            const { error } = await supabase
                .from('assistant_permissions')
                .delete()
                .match({ assistant_id: userId, permission_id: permissionId });
            if (error) {
                Alert.alert('Error', 'Failed to update permission.');
                // Revert optimistic update
                setUserPermissions(userPermissions);
            }
        } else {
            // Add the permission
            const { error } = await supabase
                .from('assistant_permissions')
                .insert({ assistant_id: userId, permission_id: permissionId });
            if (error) {
                Alert.alert('Error', 'Failed to update permission.');
                // Revert optimistic update
                setUserPermissions(userPermissions);
            }
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    if (!user) {
        return <Text>User not found.</Text>;
    }

    const renderPermissionItem = ({ item }) => {
        const hasPermission = userPermissions.has(item.id);
        return (
            <View style={styles.permissionItem}>
                <Text>{item.name}</Text>
                <Switch
                    value={hasPermission}
                    onValueChange={() => handlePermissionToggle(item.id, hasPermission)}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{user.full_name}</Text>
            <Text style={styles.detail}>Role: {user.role}</Text>
            <Text style={styles.detail}>Email: {user.email || 'Not available'}</Text>

            {user.role === 'assistant' && (
                <>
                    <Text style={styles.permissionTitle}>Permissions</Text>
                    <FlatList
                        data={allPermissions}
                        renderItem={renderPermissionItem}
                        keyExtractor={(item) => item.id.toString()}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    detail: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 5,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 20,
    },
    permissionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
});

export default UserDetailScreen;
