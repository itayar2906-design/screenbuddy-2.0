import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { tasks as tasksService } from '../../services/tasks';
import { storage } from '../../utils/storage';
import TBucksCoin from '../../components/TBucksCoin';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [childId, setChildId] = useState(null);

    useEffect(() => {
        loadChildIdAndTasks();
    }, []);

    const loadChildIdAndTasks = async () => {
        setLoading(true);
        const id = await storage.getChildSession();
        if (id && id.childId) {
            setChildId(id.childId);
            await loadTasks(id.childId);
        }
        setLoading(false);
    };

    const loadTasks = async (cid) => {
        const tasksData = await tasksService.getTasksForChild(cid);
        setTasks(tasksData);
    };

    const handleCompleteTask = async (taskId) => {
        try {
            await tasksService.submitTaskCompletion(taskId, childId);
            Alert.alert('Nice work!', 'Task submitted for approval. Keep it up!');
            loadTasks(childId);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit task: ' + error.message);
        }
    };

    const getTaskStatus = (task) => {
        // Check most recent completion status
        if (task.task_completions && task.task_completions.length > 0) {
            // Sort to get latest
            const latest = task.task_completions.sort((a, b) =>
                new Date(b.submitted_at) - new Date(a.submitted_at)
            )[0];

            if (latest.status === 'pending') return 'pending';
            // If rejected, allow resubmission (return null or 'active')
            // If approved, depends on frequency. Assuming daily tasks can be done again next day.
            // For now, simplify: if pending, show "Waiting..."
        }
        return 'active';
    };

    const renderTaskItem = ({ item }) => {
        const status = getTaskStatus(item);
        const isPending = status === 'pending';

        return (
            <View style={[styles.card, isPending && styles.pendingCard]}>
                <View style={styles.cardInfo}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
                    <View style={styles.rewardBadge}>
                        <View style={styles.rewardRow}>
                            <TBucksCoin size={12} style={{ marginRight: 4 }} />
                            <Text style={styles.rewardText}>+{item.time_bucks_reward}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.actionButton,
                        isPending ? styles.pendingButton : styles.completeButton
                    ]}
                    onPress={() => !isPending && handleCompleteTask(item.id)}
                    disabled={isPending}
                >
                    <Text style={[
                        styles.actionButtonText,
                        isPending ? styles.pendingButtonText : styles.completeButtonText
                    ]}>
                        {isPending ? 'Waiting...' : 'Done!'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No tasks right now. Check back later!</Text>
                }
                refreshing={loading}
                onRefresh={() => loadTasks(childId)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 20,
    },
    card: {
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
    pendingCard: {
        opacity: 0.8,
        backgroundColor: '#F9FAFB',
    },
    cardInfo: {
        flex: 1,
        marginRight: 10,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    taskDesc: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    rewardBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    rewardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rewardText: {
        color: '#10B981',
        fontWeight: 'bold',
        fontSize: 12,
    },
    actionButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        minWidth: 100,
        alignItems: 'center',
    },
    completeButton: {
        backgroundColor: '#10B981',
    },
    pendingButton: {
        backgroundColor: '#E5E7EB',
    },
    actionButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    completeButtonText: {
        color: '#fff',
    },
    pendingButtonText: {
        color: '#9CA3AF',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 50,
        fontSize: 16,
    },
});

export default TaskList;
