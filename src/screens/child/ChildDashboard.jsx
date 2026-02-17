import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import PropTypes from 'prop-types';
import { supabase } from '../../lib/supabase';
import GimiCharacter from '../../components/Gimi/GimiCharacter';
import ScreenTimePurchaseFlow from '../../components/ScreenTimePurchase/ScreenTimePurchaseFlow';
import TBucksCoin from '../../components/TBucksCoin';

const ChildDashboard = ({ childId, childName }) => {
    const [balance, setBalance] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [blockedApps, setBlockedApps] = useState([]);
    const [showPurchaseFlow, setShowPurchaseFlow] = useState(false);
    const [showGimiChat, setShowGimiChat] = useState(false);

    const balanceAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadChildData();
        subscribeToBalance();
    }, [childId]);

    useEffect(() => {
        // Animate balance changes
        Animated.spring(balanceAnim, {
            toValue: balance,
            tension: 50,
            friction: 7,
            useNativeDriver: false,
        }).start();
    }, [balance]);

    const loadChildData = async () => {
        // Load child data
        const { data: child } = await supabase
            .from('children')
            .select('time_bucks')
            .eq('id', childId)
            .single();

        if (child) {
            setBalance(child.time_bucks);
        }

        // Load tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*, task_completions(*)')
            .eq('child_id', childId)
            .eq('status', 'active');

        if (tasksData) {
            setTasks(tasksData);
        }

        // Load blocked apps
        const { data: apps } = await supabase
            .from('blocked_apps')
            .select('*')
            .eq('child_id', childId)
            .eq('is_active', true);

        if (apps) {
            setBlockedApps(apps);
        }

        // Load active session
        const { data: session } = await supabase
            .from('screen_time_sessions')
            .select('*')
            .eq('child_id', childId)
            .eq('status', 'active')
            .single();

        if (session) {
            setActiveSession(session);
        }
    };

    const subscribeToBalance = () => {
        const subscription = supabase
            .channel('balance_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'children',
                    filter: `id=eq.${childId}`,
                },
                (payload) => {
                    setBalance(payload.new.time_bucks);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const handlePurchaseScreenTime = async (app, minutes, cost) => {
        try {
            const { data, error } = await supabase.functions.invoke('unlock-screen-time', {
                body: {
                    child_id: childId,
                    app_name: app.app_name,
                    package_name: app.package_name,
                    minutes,
                },
            });

            if (error) throw error;

            // Reload data
            await loadChildData();
        } catch (error) {
            console.error('Error purchasing screen time:', error);
            alert('Failed to unlock screen time. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Hi, {childName}! 👋</Text>
                </View>

                {/* Time Bucks Balance */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Your T BUCKS</Text>
                    <View style={styles.balanceHeader}>
                        <TBucksCoin size={80} style={{ marginRight: 10 }} />
                        <Animated.Text style={styles.balanceAmount}>
                            {Math.round(balance)}
                        </Animated.Text>
                    </View>
                    <Text style={styles.balanceSubtext}>
                        = {Math.round(balance)} minutes of screen time
                    </Text>
                </View>

                {/* Active Session */}
                {activeSession && (
                    <View style={styles.activeSessionCard}>
                        <Text style={styles.activeSessionTitle}>⏱️ Active Session</Text>
                        <Text style={styles.activeSessionApp}>{activeSession.app_name}</Text>
                        <Text style={styles.activeSessionTime}>
                            {activeSession.minutes_granted} minutes remaining
                        </Text>
                    </View>
                )}

                {/* Unlock Screen Time Button */}
                <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => setShowPurchaseFlow(true)}
                >
                    <Text style={styles.unlockButtonText}>🔓 Unlock Screen Time</Text>
                </TouchableOpacity>

                {/* Tasks Preview */}
                <View style={styles.tasksSection}>
                    <Text style={styles.sectionTitle}>Your Tasks</Text>
                    {tasks.slice(0, 3).map((task) => (
                        <View key={task.id} style={styles.taskCard}>
                            <View style={styles.taskInfo}>
                                <Text style={styles.taskTitle}>{task.title}</Text>
                                <View style={styles.rewardContainer}>
                                    <TBucksCoin size={16} style={{ marginRight: 4 }} />
                                    <Text style={styles.taskReward}>+{task.time_bucks_reward}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.taskButton}>
                                <Text style={styles.taskButtonText}>Done!</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* GIMI in corner */}
            <TouchableOpacity
                style={styles.gimiCorner}
                onPress={() => setShowGimiChat(!showGimiChat)}
            >
                <GimiCharacter
                    mood="wave"
                    position="corner"
                />
            </TouchableOpacity>

            {/* GIMI Chat */}
            {showGimiChat && (
                <View style={styles.gimiChatBubble}>
                    <Text style={styles.gimiChatText}>
                        Hey {childName}! You're doing great! Keep earning T BUCKS! 🌟
                    </Text>
                </View>
            )}

            {/* Screen Time Purchase Flow */}
            <ScreenTimePurchaseFlow
                visible={showPurchaseFlow}
                onClose={() => setShowPurchaseFlow(false)}
                blockedApps={blockedApps}
                childName={childName}
                currentBalance={balance}
                onPurchase={handlePurchaseScreenTime}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    balanceCard: {
        margin: 20,
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 10,
    },
    balanceAmount: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    balanceSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 5,
    },
    activeSessionCard: {
        margin: 20,
        marginTop: 0,
        padding: 20,
        backgroundColor: '#10B981',
        borderRadius: 20,
        alignItems: 'center',
    },
    activeSessionTitle: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
        marginBottom: 5,
    },
    activeSessionApp: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    activeSessionTime: {
        fontSize: 16,
        color: '#fff',
    },
    unlockButton: {
        margin: 20,
        marginTop: 0,
        padding: 20,
        backgroundColor: '#6366F1',
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    unlockButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    tasksSection: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    taskCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 10,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    taskReward: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    taskButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    taskButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    gimiCorner: {
        position: 'absolute',
        bottom: 20,
        right: 20,
    },
    gimiChatBubble: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        left: 80,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    gimiChatText: {
        fontSize: 14,
        color: '#333',
    },
    balanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rewardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

ChildDashboard.propTypes = {
    childId: PropTypes.string.isRequired,
    childName: PropTypes.string.isRequired,
};

export default ChildDashboard;
