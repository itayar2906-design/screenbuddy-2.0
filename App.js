import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';

import { StripeProvider } from '@stripe/stripe-react-native';

export default function App() {
    return (
        <StripeProvider
            publishableKey="pk_test_your_publishable_key"
            merchantIdentifier="merchant.com.screenbuddy"
        >
            <View style={styles.container}>
                <StatusBar style="auto" />
                <RootNavigator />
            </View>
        </StripeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
