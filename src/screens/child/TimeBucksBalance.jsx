import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { storage } from '../../utils/storage';
import { currency } from '../../services/currency';
import TBucksCoin from '../../components/TBucksCoin';

const TimeBucksBalance = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [childId, setChildId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const id = await storage.getChildSession();
        if (id && id.childId) {
            setChildId(id.childId);

            const bal = await currency.getBalance(id.childId);
            setBalance(bal);

            const txs = await currency.getTransactions(id.childId);
            setTransactions(txs);
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const renderTransactionItem = ({ item }) => {
        const isEarned = item.type === 'earned';
        const amountPrefix = isEarned ? '+' : '-';
        const amountColor = isEarned ? '#10B981' : '#EF4444';

        return (
            <View style={styles.txCard}>
                <View style={[styles.txIcon, isEarned && styles.earnedIcon]}>
                    {isEarned ? (
                        <TBucksCoin size={24} />
                    ) : (
                        <Text style={styles.txIconText}>📱</Text>
                    )}
                </View>
                <View style={styles.txContent}>
                    <Text style={styles.txNotes}>{item.type === 'earned' ? 'Task Completed' : 'Screen Time'}</Text>
                    <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: amountColor }]}>
                    {amountPrefix}{item.amount}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <View style={styles.headerContent}>
                    <TBucksCoin size={48} style={{ marginRight: 10 }} />
                    <Text style={styles.balanceValue}>{balance}</Text>
                </View>
                <Text style={styles.currencyName}>T BUCKS</Text>
            </View>

            <View style={styles.historySection}>
                <Text style={styles.historyTitle}>History</Text>
                {loading ? (
                    <ActivityIndicator color="#6366F1" />
                ) : (
                    <FlatList
                        data={transactions}
                        renderItem={renderTransactionItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No transactions yet.</Text>
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    header: {
        backgroundColor: '#6366F1',
        padding: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    balanceLabel: {
        color: '#E0E7FF',
        fontSize: 16,
        marginBottom: 5,
    },
    balanceValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    currencyName: {
        color: '#E0E7FF',
        fontSize: 18,
        marginTop: 5,
    },
    historySection: {
        flex: 1,
        padding: 20,
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    listContainer: {
        paddingBottom: 20,
    },
    txCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    earnedIcon: {
        backgroundColor: '#ECFDF5',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    txIconText: {
        fontSize: 20,
    },
    txContent: {
        flex: 1,
    },
    txNotes: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    txDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    txAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 30,
    },
});

export default TimeBucksBalance;
