import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const TaskManager = () => {
    const [tasks, setTasks] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [reward, setReward] = useState('10');
    const [selectedChild, setSelectedChild] = useState(null);
    const [frequency, setFrequency] = useState('daily');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // Load children first
        const { data: childrenData } = await supabase
            .from('children')
            .select('id, name')
            .eq('parent_id', user.id);

        setChildren(childrenData || []);
        if (childrenData && childrenData.length > 0) {
            setSelectedChild(childrenData[0].id);
        }

        // Load tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*, children(name)')
            .eq('parent_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        setTasks(tasksData || []);
        setLoading(false);
    };

    const handleAddTask = async () => {
        if (!title || !reward || !selectedChild) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('tasks')
                .insert({
                    parent_id: user.id,
                    child_id: selectedChild,
                    title: title,
                    description: description,
                    time_bucks_reward: parseInt(reward),
                    frequency: frequency,
                    status: 'active'
                });

            if (error) throw error;

            Alert.alert('Success', 'Task created!');
            setModalVisible(false);
            resetForm();
            loadData();

        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleDeleteTask = async (taskId) => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('tasks')
                                .update({ status: 'archived' })
                                .eq('id', taskId);

                            if (error) throw error;
                            loadData();
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setReward('10');
        setFrequency('daily');
        if (children.length > 0) setSelectedChild(children[0].id);
    };

    const renderTaskItem = ({ item }) => (
        <View style={styles.taskCard}>
            <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    <View style={styles.rewardBadge}>
                        <TBucksCoin size={14} style={{ marginRight: 4 }} />
                        <Text style={styles.rewardText}>+{item.time_bucks_reward}</Text>
                    </View>
                </View>
                <Text style={styles.taskChild}>For: {item.children?.name}</Text>
                {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
                <Text style={styles.taskFrequency}>Repeat: {item.frequency}</Text>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteTask(item.id)}
            >
                <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No active tasks. Create one to help your child earn T BUCKS!</Text>
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
                        <Text style={styles.modalTitle}>Create New Task</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Task Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Clean Room"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <Text style={styles.label}>Description (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Details..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />

                            <Text style={styles.label}>Reward (T BUCKS)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="10"
                                value={reward}
                                onChangeText={setReward}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Assign To</Text>
                            <View style={styles.chipContainer}>
                                {children.map(child => (
                                    <TouchableOpacity
                                        key={child.id}
                                        style={[
                                            styles.chip,
                                            selectedChild === child.id && styles.chipSelected
                                        ]}
                                        onPress={() => setSelectedChild(child.id)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            selectedChild === child.id && styles.chipTextSelected
                                        ]}>{child.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Frequency</Text>
                            <View style={styles.chipContainer}>
                                {['daily', 'weekly', 'custom'].map(freq => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[
                                            styles.chip,
                                            frequency === freq && styles.chipSelected
                                        ]}
                                        onPress={() => setFrequency(freq)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            frequency === freq && styles.chipTextSelected
                                        ]}>{freq.charAt(0).toUpperCase() + freq.slice(1)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

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
                                    onPress={handleAddTask}
                                >
                                    <Text style={styles.saveButtonText}>Create Task</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
        paddingBottom: 80,
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    taskContent: {
        flex: 1,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 10,
    },
    rewardBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rewardText: {
        color: '#6366F1',
        fontWeight: 'bold',
        fontSize: 12,
    },
    taskChild: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
        marginBottom: 2,
    },
    taskDesc: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 5,
    },
    taskFrequency: {
        fontSize: 12,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 10,
    },
    deleteText: {
        fontSize: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 50,
        fontSize: 16,
        paddingHorizontal: 20,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6366F1',
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
        maxHeight: '80%',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    chipSelected: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    chipText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
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
        backgroundColor: '#6366F1',
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

export default TaskManager;
