import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import TBucksCoin from '../../components/TBucksCoin';

const TransactionLog = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get all children IDs first
            const { data: children } = await supabase
                .from('children')
                .select('id, name')
                .eq('parent_id', user.id);

            if (!children?.length) {
                setLoading(false);
                return;
            }

            const childIds = children.map(c => c.id);

            const { data, error } = await supabase
                .from('transactions')
                .select('*, children(name)')
                .in('child_id', childIds)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }) => {
        const isEarned = item.type === 'earned' || item.type === 'adjusted'; // Assuming adjustment can be pos/neg
        const amountPrefix = item.type === 'spent' ? '-' : '+';
        const color = item.type === 'spent' ? '#EF4444' : '#10B981';

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.childName}>{item.children?.name}</Text>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.notes}>{item.notes || item.type}</Text>
                    <View style={styles.amountRow}>
                        <Text style={[styles.amount, { color }]}>{amountPrefix}</Text>
                        <TBucksCoin size={16} style={{ marginHorizontal: 2 }} />
                        <Text style={[styles.amount, { color }]}>{item.amount}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return <ActivityIndicator style={styles.loading} size="large" color="#6366F1" />;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No transactions recorded yet.</Text>}
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
        marginBottom: 5,
    },
    childName: {
        fontWeight: 'bold',
        color: '#333',
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
    notes: {
        fontSize: 16,
        color: '#4B5563',
        flex: 1,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    empty: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 50,
    },
});

export default TransactionLog;
