import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../lib/supabaseClient';

const MapScreen = () => {
    const [workerLocations, setWorkerLocations] = useState(new Map());

    useEffect(() => {
        // Set up the real-time subscription
        const channel = supabase.channel('public:tracking');

        channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tracking' },
                (payload) => {
                    const newLocation = payload.new;
                    console.log('New location received:', newLocation);

                    setWorkerLocations(prevLocations => {
                        const newLocations = new Map(prevLocations);
                        newLocations.set(newLocation.delivery_worker_id, {
                            latitude: newLocation.latitude,
                            longitude: newLocation.longitude,
                            // You could join with users table to get worker name here
                            title: `Worker ${newLocation.delivery_worker_id.substring(0, 5)}`
                        });
                        return newLocations;
                    });
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Subscribed to tracking channel!');
                }
                if (status === 'CHANNEL_ERROR') {
                    Alert.alert('Error', `Subscription error: ${err.message}`);
                }
            });

        // Cleanup function to remove the channel subscription on component unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 33.5138, // Centered on Damascus
                    longitude: 36.2765,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {Array.from(workerLocations.entries()).map(([workerId, location]) => (
                    <Marker
                        key={workerId}
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        title={location.title}
                        description={`Last update: ${new Date().toLocaleTimeString()}`}
                    />
                ))}
            </MapView>
            <View style={styles.overlay}>
                <Text style={styles.title}>Live Delivery Tracking</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        position: 'absolute',
        top: 10,
        width: '90%',
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default MapScreen;
