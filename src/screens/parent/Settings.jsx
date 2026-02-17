import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import ReAuthModal from '../../components/Auth/ReAuthModal';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reAuthVisible, setReAuthVisible] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState('free');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        // In a real app, fetch subscription status here
    };

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await supabase.auth.signOut();
                    }
                }
            ]
        );
    };

    const handleManageSubscription = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('create-customer-portal', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: {
                    return_url: 'screenbuddy://settings'
                }
            });

            if (error) throw error;

            if (data?.url) {
                Linking.openURL(data.url);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open subscription management: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        setReAuthVisible(true);
    };

    const onReAuthSuccess = async (token) => {
        setReAuthVisible(false);
        Alert.alert('Account Deletion', 'This feature is coming soon. Please contact support.');
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email}</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subscription</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Plan</Text>
                    <Text style={styles.value}>{subscriptionStatus === 'premium' ? 'Premium 🌟' : 'Free'}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleManageSubscription}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Manage Subscription</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <TouchableOpacity style={styles.cardLink} onPress={() => Linking.openURL('mailto:support@screenbuddy.app')}>
                    <Text style={styles.linkText}>Contact Support</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cardLink} onPress={() => Linking.openURL('https://screenbuddy.app/privacy')}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                    <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Danger Zone</Text>
                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleDeleteAccount}>
                    <Text style={styles.dangerButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>

            <ReAuthModal
                visible={reAuthVisible}
                onClose={() => setReAuthVisible(false)}
                onSuccess={onReAuthSuccess}
                actionTitle="delete your account"
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6B7280',
        marginBottom: 10,
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    button: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 5,
    },
    buttonText: {
        color: '#333',
        fontWeight: '600',
        fontSize: 16,
    },
    primaryButton: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dangerButton: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },
    dangerButtonText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cardLink: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    linkText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    arrow: {
        fontSize: 20,
        color: '#9CA3AF',
    },
});

export default Settings;
