import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/lib/supabaseClient';

// Navigators
import ManagerTabNavigator from './src/manager/navigation/ManagerTabNavigator';
import DeliveryNavigator from './src/delivery/navigation/DeliveryNavigator';
// Placeholder for the client app navigator
// import ClientNavigator from './src/client/navigation/ClientNavigator';

// Unified Login Screen
import LoginScreen from './src/screens/LoginScreen';

const App = () => {
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchUserRole(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchUserRole(session.user.id);
            } else {
                setUserRole(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId) => {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error);
            // Log out if profile can't be fetched
            await supabase.auth.signOut();
        } else if (data) {
            setUserRole(data.role);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
    }

    const renderAppForRole = () => {
        switch (userRole) {
            case 'manager':
            case 'assistant':
                return <ManagerTabNavigator onLogout={handleLogout} />;
            case 'delivery_worker':
                return <DeliveryNavigator onLogout={handleLogout} />;
            // case 'client':
            //     return <ClientNavigator onLogout={handleLogout} />;
            default:
                // This could be a fallback for client or an error screen
                return <LoginScreen />;
        }
    };

    return (
        <NavigationContainer>
            {session && session.user ? renderAppForRole() : <LoginScreen />}
        </NavigationContainer>
    );
};

export default App;
