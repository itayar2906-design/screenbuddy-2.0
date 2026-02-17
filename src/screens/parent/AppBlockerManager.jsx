import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';
import { supabase } from '../../lib/supabase';

const AppBlockerManager = ({ route }) => {
    const { childId } = route.params || {};
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [blockedApps, setBlockedApps] = useState([]);
    const [availableApps, setAvailableApps] = useState([
        { id: '1', name: 'YouTube', package: 'com.google.android.youtube' },
        { id: '2', name: 'TikTok', package: 'com.zhiliaoapp.musically' },
        { id: '3', name: 'Instagram', package: 'com.instagram.android' },
        { id: '4', name: 'Roblox', package: 'com.roblox.client' },
        { id: '5', name: 'Snapchat', package: 'com.snapchat.android' },
    ]);

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            loadBlockedApps();
        }
    }, [selectedChild]);

    const loadChildren = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
            .from('children')
            .select('*')
            .eq('parent_id', user.id);

        if (data) {
            setChildren(data);
            if (childId) {
                setSelectedChild(data.find(c => c.id === childId));
            } else if (data.length > 0) {
                setSelectedChild(data[0]);
            }
        }
    };

    const loadBlockedApps = async () => {
        const { data } = await supabase
            .from('blocked_apps')
            .select('*')
            .eq('child_id', selectedChild.id)
            .eq('is_active', true);

        if (data) {
            setBlockedApps(data);
        }
    };

    const toggleAppBlock = async (app, isBlocked) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (isBlocked) {
            // Unblock
            await supabase
                .from('blocked_apps')
                .update({ is_active: false })
                .eq('child_id', selectedChild.id)
                .eq('package_name', app.package);
        } else {
            // Block
            await supabase
                .from('blocked_apps')
                .insert({
                    parent_id: user.id,
                    child_id: selectedChild.id,
                    app_name: app.name,
                    package_name: app.package,
                    time_bucks_per_minute: 1,
                    is_active: true,
                });
        }

        loadBlockedApps();
    };

    const isAppBlocked = (app) => {
        return blockedApps.some(blocked => blocked.package_name === app.package);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Child</Text>
            <View style={styles.childSelector}>
                {children.map((child) => (
                    <TouchableOpacity
                        key={child.id}
                        style={[
                            styles.childChip,
                            selectedChild?.id === child.id && styles.childChipSelected,
                        ]}
                        onPress={() => setSelectedChild(child)}
                    >
                        <Text
                            style={[
                                styles.childChipText,
                                selectedChild?.id === child.id && styles.childChipTextSelected,
                            ]}
                        >
                            {child.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedChild && (
                <>
                    <Text style={styles.subtitle}>Manage Blocked Apps for {selectedChild.name}</Text>
                    <FlatList
                        data={availableApps}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const blocked = isAppBlocked(item);
                            return (
                                <View style={styles.appRow}>
                                    <View style={styles.appInfo}>
                                        <Text style={styles.appName}>{item.name}</Text>
                                        <Text style={styles.appPackage}>{item.package}</Text>
                                    </View>
                                    <Switch
                                        value={blocked}
                                        onValueChange={() => toggleAppBlock(item, blocked)}
                                        trackColor={{ false: '#D1D5DB', true: '#EF4444' }}
                                        thumbColor={blocked ? '#fff' : '#f4f3f4'}
                                    />
                                </View>
                            );
                        }}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F4FF',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    childSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    childChip: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    childChipSelected: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    childChipText: {
        color: '#333',
        fontWeight: '600',
    },
    childChipTextSelected: {
        color: '#fff',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    appRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 3,
    },
    appPackage: {
        fontSize: 12,
        color: '#6B7280',
    },
});

export default AppBlockerManager;
