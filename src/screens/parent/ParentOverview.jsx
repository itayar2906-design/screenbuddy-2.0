import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const ParentOverview = ({ navigation }) => {
    const [children, setChildren] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // Load children
        const { data: childrenData } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id);

        if (childrenData) {
            setChildren(childrenData);
        }

        // Load pending approvals
        const { data: approvals } = await supabase
            .from('task_completions')
            .select('*, tasks(*), children(*)')
            .eq('status', 'pending')
            .in('child_id', childrenData.map(c => c.id));

        if (approvals) {
            setPendingApprovals(approvals);
        }
    };

    const handleApprove = async (completionId) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            await supabase.functions.invoke('approve-task', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: {
                    task_completion_id: completionId,
                },
            });

            loadData();
        } catch (error) {
            alert('Error approving task: ' + error.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Your Children</Text>

            {children.map((child) => (
                <View key={child.id} style={styles.childCard}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <View style={styles.balanceContainer}>
                        <TBucksCoin size={18} style={{ marginRight: 6 }} />
                        <Text style={styles.balance}>{child.time_bucks}</Text>
                    </View>
                    <Text style={styles.level}>Level {child.level} • {child.streak} day streak</Text>
                </View>
            ))}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('ChildProfiles')}
            >
                <Text style={styles.addButtonText}>+ Add Child</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Pending Approvals ({pendingApprovals.length})</Text>

            {pendingApprovals.map((approval) => (
                <View key={approval.id} style={styles.approvalCard}>
                    <Text style={styles.approvalChild}>{approval.children.name}</Text>
                    <Text style={styles.approvalTask}>{approval.tasks.title}</Text>
                    <View style={styles.rewardContainer}>
                        <TBucksCoin size={14} style={{ marginRight: 4 }} />
                        <Text style={styles.approvalReward}>+{approval.tasks.time_bucks_reward}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(approval.id)}
                    >
                        <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AppBlocker')}
                >
                    <Text style={styles.actionButtonText}>🔒 Blocked Apps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Tasks')}
                >
                    <Text style={styles.actionButtonText}>📝 Manage Tasks</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Analytics')}
                >
                    <Text style={styles.actionButtonText}>📊 Analytics</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('Settings')}
                >
                    <Text style={styles.actionButtonText}>⚙️ Settings</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 15,
    },
    childCard: {
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
    childName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    balance: {
        fontSize: 18,
        color: '#10B981',
        fontWeight: '600',
        marginBottom: 5,
    },
    level: {
        fontSize: 14,
        color: '#6B7280',
    },
    addButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    approvalCard: {
        backgroundColor: '#FFF7ED',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    approvalChild: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    approvalTask: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 5,
    },
    rewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    approvalReward: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
        marginBottom: 10,
    },
    approveButton: {
        backgroundColor: '#10B981',
        borderRadius: 8,
        padding: 10,
        alignItems: 'center',
    },
    approveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    quickActions: {
        marginTop: 20,
        marginBottom: 40,
    },
    actionButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
    },
});

export default ParentOverview;
