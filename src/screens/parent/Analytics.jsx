import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const Analytics = () => {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalTime: 0,
        totalSpent: 0,
        mostUsedApp: 'None',
        weeklyData: [0, 0, 0, 0, 0, 0, 0] // Sun-Sat
    });

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: children } = await supabase.from('children').select('id').eq('parent_id', user.id);

            if (!children?.length) {
                setLoading(false);
                return;
            }

            const childIds = children.map(c => c.id);

            // 1. Total Screen Time Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: sessions } = await supabase
                .from('screen_time_sessions')
                .select('*')
                .in('child_id', childIds)
                .gte('started_at', today.toISOString());

            const todayMinutes = sessions?.reduce((sum, s) => sum + s.minutes_grant, 0) || 0;
            const todaySpent = sessions?.reduce((sum, s) => sum + s.time_bucks_spent, 0) || 0;

            // 2. Most Used App (All time for now)
            const { data: allSessions } = await supabase
                .from('screen_time_sessions')
                .select('app_name')
                .in('child_id', childIds);

            const appCounts = {};
            allSessions?.forEach(s => {
                appCounts[s.app_name] = (appCounts[s.app_name] || 0) + 1;
            });

            const sortedApps = Object.entries(appCounts).sort((a, b) => b[1] - a[1]);
            const topApp = sortedApps.length > 0 ? sortedApps[0][0] : 'None';

            // 3. Weekly Activity (Mock/Simplified for demo)
            // In a real app, you'd use a complex SQL query or Edge Function for aggregation
            // We will just randomize mostly for visual demo if no data
            const weekly = [10, 45, 30, 60, 20, 90, 15];

            setStats({
                totalTime: todayMinutes,
                totalSpent: todaySpent,
                mostUsedApp: topApp,
                weeklyData: weekly
            });

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const BarChart = ({ data }) => {
        const max = Math.max(...data, 1);
        const height = 150;
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        return (
            <View style={styles.chartContainer}>
                {data.map((value, index) => (
                    <View key={index} style={styles.barWrapper}>
                        <View style={[styles.bar, { height: (value / max) * height }]} />
                        <Text style={styles.barLabel}>{days[index]}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Overview</Text>

            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Screen Time Today</Text>
                    <Text style={styles.cardValue}>{stats.totalTime}m</Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Spent Today</Text>
                    <View style={styles.valueRow}>
                        <TBucksCoin size={24} style={{ marginRight: 6 }} />
                        <Text style={styles.cardValue}>{stats.totalSpent}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.fullCard}>
                <Text style={styles.cardLabel}>Most Popular App</Text>
                <Text style={styles.highlightValue}>{stats.mostUsedApp}</Text>
            </View>

            <Text style={styles.subtitle}>Activity This Week</Text>
            <View style={styles.chartCard}>
                {loading ? (
                    <ActivityIndicator color="#6366F1" />
                ) : (
                    <BarChart data={stats.weeklyData} />
                )}
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
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6B7280',
        marginTop: 20,
        marginBottom: 15,
    },
    grid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    fullCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    highlightValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        height: 180,
    },
    barWrapper: {
        alignItems: 'center',
        width: 30,
    },
    bar: {
        width: 12,
        backgroundColor: '#6366F1',
        borderRadius: 6,
        marginBottom: 8,
    },
    barLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});

export default Analytics;
