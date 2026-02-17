import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ParentOverview from '../screens/parent/ParentOverview';
import AppBlockerManager from '../screens/parent/AppBlockerManager';
import ChildProfileManager from '../screens/parent/ChildProfileManager';
import TaskManager from '../screens/parent/TaskManager';
import ApprovalQueue from '../screens/parent/ApprovalQueue';
import ScreenTimeLog from '../screens/parent/ScreenTimeLog';
import TransactionLog from '../screens/parent/TransactionLog';
import Analytics from '../screens/parent/Analytics';
import Settings from '../screens/parent/Settings';

const Stack = createStackNavigator();

const ParentStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#10B981',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="Overview"
                component={ParentOverview}
                options={{ title: 'Parent Dashboard' }}
            />
            <Stack.Screen
                name="AppBlocker"
                component={AppBlockerManager}
                options={{ title: 'Blocked Apps' }}
            />
            <Stack.Screen
                name="ChildProfiles"
                component={ChildProfileManager}
                options={{ title: 'Manage Children' }}
            />
            <Stack.Screen
                name="Tasks"
                component={TaskManager}
                options={{ title: 'Manage Tasks' }}
            />
            <Stack.Screen
                name="Approvals"
                component={ApprovalQueue}
                options={{ title: 'Approve Tasks' }}
            />
            <Stack.Screen
                name="ScreenTimeLog"
                component={ScreenTimeLog}
                options={{ title: 'Screen Time History' }}
            />
            <Stack.Screen
                name="Transactions"
                component={TransactionLog}
                options={{ title: 'Transaction History' }}
            />
            <Stack.Screen
                name="Analytics"
                component={Analytics}
                options={{ title: 'Analytics' }}
            />
            <Stack.Screen
                name="Settings"
                component={Settings}
                options={{ title: 'Settings' }}
            />
        </Stack.Navigator>
    );
};

export default ParentStack;
