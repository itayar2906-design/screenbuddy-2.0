import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { storage } from '../../utils/storage';
import { currency } from '../../services/currency';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const Progress = () => {
    const [stats, setStats] = useState({
        level: 1,
        xp: 0,
        streak: 0,
        totalEarned: 0,
        tasksCompleted: 0
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const id = await storage.getChildSession();
        if (id && id.childId) {
            const { data: child } = await supabase
                .from('children')
                .select('*')
                .eq('id', id.childId)
                .single();

            const { count } = await supabase
                .from('task_completions')
                .select('*', { count: 'exact', head: true })
                .eq('child_id', id.childId)
                .eq('status', 'approved');

            // Simple mock for "total earned" based on transactions
            const txs = await currency.getTransactions(id.childId, 100);
            const earned = txs
                .filter(t => t.type === 'earned')
                .reduce((sum, t) => sum + t.amount, 0);

            setStats({
                level: child.level || 1,
                xp: child.xp || 0,
                streak: child.streak || 0,
                totalEarned: earned,
                tasksCompleted: count || 0
            });
        }
        setLoading(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.levelLabel}>Level {stats.level}</Text>
                <View style={styles.xpBarContainer}>
                    <View style={[styles.xpBar, { width: `${Math.min(stats.xp, 100)}%` }]} />
                </View>
                <Text style={styles.xpText}>{stats.xp} / 100 XP to next level</Text>
            </View>

            <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.streakCard]}>
                    <Text style={styles.statIcon}>🔥</Text>
                    <Text style={styles.statValue}>{stats.streak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={[styles.statCard, styles.earnedCard]}>
                    <TBucksCoin size={32} style={{ marginBottom: 10 }} />
                    <Text style={styles.statValue}>{stats.totalEarned}</Text>
                    <Text style={styles.statLabel}>Total Earned</Text>
                </View>
                <View style={[styles.statCard, styles.completedCard]}>
                    <Text style={styles.statIcon}>✅</Text>
                    <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
                    <Text style={styles.statLabel}>Tasks Done</Text>
                </View>
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
    header: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    levelLabel: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6366F1',
        marginBottom: 15,
    },
    xpBarContainer: {
        width: '100%',
        height: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 10,
    },
    xpBar: {
        height: '100%',
        backgroundColor: '#10B981',
        borderRadius: 6,
    },
    xpText: {
        color: '#6B7280',
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statIcon: {
        fontSize: 32,
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    statLabel: {
        color: '#6B7280',
        fontSize: 14,
    },
    streakCard: {
        borderBottomWidth: 4,
        borderBottomColor: '#F59E0B',
    },
    earnedCard: {
        borderBottomWidth: 4,
        borderBottomColor: '#6366F1',
    },
    completedCard: {
        borderBottomWidth: 4,
        borderBottomColor: '#10B981',
        width: '100%',
    },
});

export default Progress;
