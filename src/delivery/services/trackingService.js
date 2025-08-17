import * as Location from 'expo-location';
import { supabase } from '../../lib/supabaseClient';

let locationSubscription = null;

export const startTracking = async () => {
    // 1. Check for and request permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.error('Permission to access location was denied');
        alert('Permission to access location was denied. Tracking cannot start.');
        return;
    }

    // 2. Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.error('User not found, cannot start tracking.');
        return;
    }

    // 3. Start watching the position
    locationSubscription = await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 30000, // 30 seconds
            distanceInterval: 50, // 50 meters
        },
        (location) => {
            console.log('New location:', location);
            // 4. Insert new location into the database
            const newTrackingRecord = {
                delivery_worker_id: user.id,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            supabase
                .from('tracking')
                .insert([newTrackingRecord])
                .then(({ error }) => {
                    if (error) {
                        console.error('Error saving location:', error);
                    }
                });
        }
    );

    console.log('Location tracking started.');
};

export const stopTracking = () => {
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
        console.log('Location tracking stopped.');
    }
};
