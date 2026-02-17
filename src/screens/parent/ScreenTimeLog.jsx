import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const ScreenTimeLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get all children IDs first
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .eq('parent_id', user.id);

            if (!children?.length) {
                setLoading(false);
                return;
            }

            const childIds = children.map(c => c.id);

            const { data, error } = await supabase
                .from('screen_time_sessions')
                .select('*, children(name)')
                .in('child_id', childIds)
                .order('started_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error loading screen time logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.childName}>{item.children?.name}</Text>
                <Text style={styles.date}>{formatDate(item.started_at)}</Text>
            </View>
            <View style={styles.content}>
                <View>
                    <Text style={styles.appName}>{item.app_name}</Text>
                    <Text style={styles.status}>{item.status.toUpperCase()}</Text>
                </View>
                <View style={styles.stats}>
                    <Text style={styles.duration}>⏱️ {item.minutes_granted} min</Text>
                    <View style={styles.costRow}>
                        <Text style={styles.cost}>-</Text>
                        <TBucksCoin size={12} style={{ marginHorizontal: 2 }} />
                        <Text style={styles.cost}>{item.time_bucks_spent}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return <ActivityIndicator style={styles.loading} size="large" color="#6366F1" />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No screen time sessions yet.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    loading: {
        marginTop: 50,
    },
    list: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 8,
    },
    childName: {
        fontWeight: 'bold',
        color: '#6366F1',
        fontSize: 14,
    },
    date: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    status: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    stats: {
        alignItems: 'flex-end',
    },
    duration: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    cost: {
        fontSize: 14,
        color: '#EF4444',
        marginTop: 2,
    },
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    empty: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 50,
    },
});

export default ScreenTimeLog;
