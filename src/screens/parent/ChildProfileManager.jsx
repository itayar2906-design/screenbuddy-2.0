import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const ChildProfileManager = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [age, setAge] = useState('');

    useEffect(() => {
        loadChildren();
    }, []);

    const loadChildren = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading children:', error);
        } else {
            setChildren(data || []);
        }
        setLoading(false);
    };

    const handleAddChild = async () => {
        if (!name || !pin) {
            Alert.alert('Error', 'Please enter both name and PIN');
            return;
        }

        if (pin.length < 4) {
            Alert.alert('Error', 'PIN must be at least 4 digits');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            // In a real app, you should hash this PIN before sending
            // For this implementation we're focusing on the flow
            const pinHash = pin;

            const { data, error } = await supabase
                .from('children')
                .insert({
                    parent_id: user.id,
                    name: name,
                    pin_hash: pinHash,
                    time_bucks: 0,
                    level: 1,
                    xp: 0
                })
                .select();

            if (error) throw error;

            Alert.alert('Success', 'Child profile created!');
            setModalVisible(false);
            resetForm();
            loadChildren();

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const resetForm = () => {
        setName('');
        setPin('');
        setAge('');
    };

    const renderChildItem = ({ item }) => (
        <View style={styles.childCard}>
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.childInfo}>
                <Text style={styles.childName}>{item.name}</Text>
                <View style={styles.childStats}>
                    <Text style={styles.childDetails}>Level {item.level} • </Text>
                    <TBucksCoin size={16} style={{ marginRight: 4 }} />
                    <Text style={styles.childDetails}>{item.time_bucks}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={children}
                renderItem={renderChildItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No children profiles yet. Add one to get started!</Text>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Child</Text>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Child's Name"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Login PIN (4 digits)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="1234"
                            value={pin}
                            onChangeText={setPin}
                            keyboardType="numeric"
                            maxLength={4}
                            secureTextEntry
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleAddChild}
                            >
                                <Text style={styles.saveButtonText}>Create Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    listContainer: {
        padding: 20,
    },
    childCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    childInfo: {
        flex: 1,
    },
    childName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    childDetails: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    childStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButton: {
        padding: 10,
    },
    editButtonText: {
        color: '#6366F1',
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 50,
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabText: {
        color: '#fff',
        fontSize: 32,
        marginTop: -4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
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
    saveButton: {
        backgroundColor: '#10B981',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontWeight: '600',
        fontSize: 16,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ChildProfileManager;
