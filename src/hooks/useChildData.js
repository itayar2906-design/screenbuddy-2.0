import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { storage } from '../utils/storage';
import { currency } from '../services/currency';
import { tasks as tasksService } from '../services/tasks';
import { screentime } from '../services/screentime';

export const useChildData = () => {
    const [childId, setChildId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [blockedApps, setBlockedApps] = useState([]);
    const [activeSession, setActiveSession] = useState(null);

    const refresh = useCallback(async () => {
        if (!childId) return;
        setLoading(true);
        try {
            const [bal, tsk, apps, sess] = await Promise.all([
                currency.getBalance(childId),
                tasksService.getTasksForChild(childId),
                screentime.getBlockedApps(childId),
                screentime.getActiveSession(childId)
            ]);

            setBalance(bal);
            setTasks(tsk);
            setBlockedApps(apps);
            setActiveSession(sess);
        } catch (error) {
            console.error('Error refreshing child data:', error);
        } finally {
            setLoading(false);
        }
    }, [childId]);

    useEffect(() => {
        const init = async () => {
            const session = await storage.getChildSession();
            if (session?.childId) {
                setChildId(session.childId);
            } else {
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (!childId) return;

        // Realtime subscription for balance
        const unsubscribe = currency.subscribeToBalance(childId, (newBalance) => {
            setBalance(newBalance);
        });

        return () => unsubscribe();
    }, [childId]);

    return {
        childId,
        loading,
        balance,
        tasks,
        blockedApps,
        activeSession,
        refresh
    };
};
