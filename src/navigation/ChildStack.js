import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ChildDashboard from '../screens/child/ChildDashboard';
import TaskList from '../screens/child/TaskList';
import TimeBucksBalance from '../screens/child/TimeBucksBalance';
import Progress from '../screens/child/Progress';

const Stack = createStackNavigator();

const ChildStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#6366F1',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="Dashboard"
                component={ChildDashboard}
                options={{ title: 'Screen Buddy' }}
            />
            <Stack.Screen
                name="Tasks"
                component={TaskList}
                options={{ title: 'My Tasks' }}
            />
            <Stack.Screen
                name="Balance"
                component={TimeBucksBalance}
                options={{ title: 'T BUCKS' }}
            />
            <Stack.Screen
                name="Progress"
                component={Progress}
                options={{ title: 'My Progress' }}
            />
        </Stack.Navigator>
    );
};

export default ChildStack;
