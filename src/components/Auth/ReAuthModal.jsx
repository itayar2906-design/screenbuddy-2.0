import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

const ReAuthModal = ({ visible, onClose, onSuccess, actionTitle }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReAuth = async () => {
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !user.email) throw new Error('No user found');

            // Re-authenticate by signing in again
            const { data, error } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: password
            });

            if (error) throw error;

            // Reset and callback
            setPassword('');
            onSuccess(data.session.access_token);

        } catch (error) {
            Alert.alert('Authentication Failed', 'Incorrect password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <Text style={styles.title}>Security Check</Text>
                    <Text style={styles.subtitle}>
                        Please verify your password to {actionTitle || 'continue'}.
                    </Text>

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleReAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.confirmText}>Verify</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 25,
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#6366F1',
    },
    cancelText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    confirmText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ReAuthModal;
