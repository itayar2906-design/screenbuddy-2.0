import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { storage } from '../utils/storage';
import ParentStack from './ParentStack';
import ChildStack from './ChildStack';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createStackNavigator();

const prefix = Linking.createURL('/');

const linking = {
    prefixes: [prefix, 'screenbuddy://'],
    config: {
        screens: {
            Parent: {
                screens: {
                    Settings: 'settings',
                }
            },
        },
    },
};

const RootNavigator = () => {
    const [session, setSession] = useState(null);
    const [childSession, setChildSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSessions();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSessions = async () => {
        try {
            // Check for parent session
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            // Check for child session
            const childSess = await storage.getChildSession();
            setChildSession(childSess);
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {childSession ? (
                    <Stack.Screen name="Child" component={ChildStack} />
                ) : session ? (
                    <Stack.Screen name="Parent" component={ParentStack} />
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
