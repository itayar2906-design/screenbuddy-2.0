import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Image } from 'react-native';
import PropTypes from 'prop-types';
import GimiCharacter from '../Gimi/GimiCharacter';
import TBucksCoin from '../TBucksCoin';

const ScreenTimePurchaseFlow = ({ visible, onClose, blockedApps, childName, currentBalance, onPurchase }) => {
    const [step, setStep] = useState(1);
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedMinutes, setSelectedMinutes] = useState(null);

    const durationOptions = [
        { minutes: 5, label: '5 min' },
        { minutes: 10, label: '10 min' },
        { minutes: 15, label: '15 min' },
        { minutes: 30, label: '30 min' },
    ];

    const handleAppSelect = (app) => {
        setSelectedApp(app);
        setStep(2);
    };

    const handleDurationSelect = (minutes) => {
        setSelectedMinutes(minutes);
        setStep(3);
    };

    const handleConfirm = async () => {
        if (selectedApp && selectedMinutes) {
            const cost = selectedMinutes * (selectedApp.time_bucks_per_minute || 1);
            await onPurchase(selectedApp, selectedMinutes, cost);
            setStep(4);

            // Auto-close after showing success
            setTimeout(() => {
                handleClose();
            }, 3000);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedApp(null);
        setSelectedMinutes(null);
        onClose();
    };

    const getCost = (minutes) => {
        if (!selectedApp) return 0;
        return minutes * (selectedApp.time_bucks_per_minute || 1);
    };

    const canAfford = (cost) => {
        return currentBalance >= cost;
    };

    const getGimiDialogue = () => {
        switch (step) {
            case 1:
                return `Hey ${childName}! Which app do you want to unlock?`;
            case 2:
                return `Nice choice! How long do you want?`;
            case 3:
                const cost = getCost(selectedMinutes);
                return `That's ${cost} T BUCKS! You have ${currentBalance}. Let's do it!`;
            case 4:
                return `Unlocked! You've got ${selectedMinutes} minutes. Make them count!`;
            default:
                return '';
        }
    };

    const getGimiMood = () => {
        switch (step) {
            case 1:
                return 'wave';
            case 2:
                return 'thinking';
            case 3:
                return 'excited';
            case 4:
                return 'happy';
            default:
                return 'wave';
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <GimiCharacter
                    mood={getGimiMood()}
                    dialogue={getGimiDialogue()}
                    position="fullscreen"
                />

                {step === 1 && (
                    <View style={styles.content}>
                        <Text style={styles.title}>Choose an App</Text>
                        <FlatList
                            data={blockedApps}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.appCard}
                                    onPress={() => handleAppSelect(item)}
                                >
                                    <View style={styles.appIcon}>
                                        <Text style={styles.appIconText}>{item.app_name[0]}</Text>
                                    </View>
                                    <Text style={styles.appName}>{item.app_name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {step === 2 && (
                    <View style={styles.content}>
                        <Text style={styles.title}>How Many Minutes?</Text>
                        <View style={styles.durationGrid}>
                            {durationOptions.map((option) => {
                                const cost = getCost(option.minutes);
                                const affordable = canAfford(cost);
                                return (
                                    <TouchableOpacity
                                        key={option.minutes}
                                        style={[
                                            styles.durationCard,
                                            !affordable && styles.durationCardDisabled,
                                        ]}
                                        onPress={() => affordable && handleDurationSelect(option.minutes)}
                                        disabled={!affordable}
                                    >
                                        <Text style={[styles.durationLabel, !affordable && styles.textDisabled]}>
                                            {option.label}
                                        </Text>
                                        <View style={styles.costContainer}>
                                            <TBucksCoin size={20} style={{ marginRight: 5 }} />
                                            <Text style={[styles.costLabel, !affordable && styles.textDisabled]}>
                                                {cost}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View style={styles.content}>
                        <Text style={styles.confirmTitle}>Ready to Unlock?</Text>
                        <View style={styles.confirmDetails}>
                            <Text style={styles.confirmText}>App: {selectedApp?.app_name}</Text>
                            <Text style={styles.confirmText}>Time: {selectedMinutes} minutes</Text>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmText}>Cost: </Text>
                                <TBucksCoin size={18} style={{ marginHorizontal: 5 }} />
                                <Text style={styles.confirmText}>{getCost(selectedMinutes)}</Text>
                            </View>
                            <View style={styles.confirmRow}>
                                <Text style={styles.confirmBalance}>New Balance: </Text>
                                <TBucksCoin size={18} style={{ marginHorizontal: 5 }} />
                                <Text style={styles.confirmBalance}>{currentBalance - getCost(selectedMinutes)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>CONFIRM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 4 && (
                    <View style={styles.content}>
                        <Text style={styles.successTitle}>🎉 Unlocked!</Text>
                        <Text style={styles.successText}>
                            {selectedApp?.app_name} is now available for {selectedMinutes} minutes!
                        </Text>
                    </View>
                )}
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        maxHeight: '50%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    appCard: {
        flex: 1,
        margin: 10,
        padding: 15,
        backgroundColor: '#F8F9FF',
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E0E7FF',
    },
    appIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    appIconText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    appName: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
    },
    durationCard: {
        width: '45%',
        padding: 20,
        margin: 5,
        backgroundColor: '#6366F1',
        borderRadius: 15,
        alignItems: 'center',
    },
    durationCardDisabled: {
        backgroundColor: '#D1D5DB',
    },
    durationLabel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    costLabel: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    confirmRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    textDisabled: {
        color: '#9CA3AF',
    },
    confirmTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    confirmDetails: {
        backgroundColor: '#F8F9FF',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
    },
    confirmText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    confirmBalance: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366F1',
        marginTop: 10,
    },
    confirmButton: {
        backgroundColor: '#10B981',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    cancelButton: {
        padding: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#6B7280',
    },
    successTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#10B981',
        textAlign: 'center',
        marginBottom: 20,
    },
    successText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
});

ScreenTimePurchaseFlow.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    blockedApps: PropTypes.array.isRequired,
    childName: PropTypes.string.isRequired,
    currentBalance: PropTypes.number.isRequired,
    onPurchase: PropTypes.func.isRequired,
};

export default ScreenTimePurchaseFlow;
