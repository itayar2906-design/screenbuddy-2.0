import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { tasks as tasksService } from '../../services/tasks';
import TBucksCoin from '../../components/TBucksCoin';

const ApprovalQueue = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadApprovals();
    }, []);

    const loadApprovals = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const pending = await tasksService.getPendingApprovals(user.id);
            setApprovals(pending);
        } catch (error) {
            console.error('Error loading approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (completionId) => {
        try {
            await tasksService.approveTask(completionId);
            Alert.alert('Success', 'Task approved! T BUCKS have been added.');
            loadApprovals();
        } catch (error) {
            Alert.alert('Error', 'Failed to approve task: ' + error.message);
        }
    };

    const handleReject = async (completionId) => {
        Alert.alert(
            "Reject Task",
            "Are you sure you want to reject this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reject",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('task_completions')
                                .update({ status: 'rejected' })
                                .eq('id', completionId);

                            if (error) throw error;
                            loadApprovals();
                        } catch (err) {
                            Alert.alert('Error', err.message);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderApprovalItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.childBadge}>
                    <Text style={styles.childName}>{item.children.name}</Text>
                </View>
                <Text style={styles.date}>{formatDate(item.submitted_at)}</Text>
            </View>

            <Text style={styles.taskTitle}>{item.tasks.title}</Text>
            <View style={styles.rewardContainer}>
                <Text style={styles.rewardLabel}>Reward:</Text>
                <TBucksCoin size={16} style={{ marginHorizontal: 5 }} />
                <Text style={styles.rewardValue}>+{item.tasks.time_bucks_reward}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                >
                    <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                >
                    <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={approvals}
                renderItem={renderApprovalItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
                        <Text style={styles.emptyText}>No pending tasks to review.</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={loadApprovals}
            />
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
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    childBadge: {
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    childName: {
        color: '#6366F1',
        fontWeight: 'bold',
        fontSize: 14,
    },
    date: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    rewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    rewardLabel: {
        color: '#6B7280',
        marginRight: 5,
    },
    rewardValue: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#F3F4F6',
        marginRight: 10,
    },
    approveButton: {
        backgroundColor: '#10B981',
    },
    rejectText: {
        color: '#EF4444',
        fontWeight: '600',
    },
    approveText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
    },
});

export default ApprovalQueue;
