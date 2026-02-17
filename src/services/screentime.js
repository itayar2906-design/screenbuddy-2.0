import ScreenTime from '../native/ScreenTime';
import { supabase } from '../lib/supabase';

export const screentime = {
    /**
     * Unlock an app for specified minutes
     * Calls Edge Function first, then native module
     */
    async unlockApp(childId, appName, packageName, minutes) {
        try {
            // Step 1: Call Edge Function to deduct T BUCKS
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('unlock-screen-time', {
                headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
                body: {
                    child_id: childId,
                    app_name: appName,
                    package_name: packageName,
                    minutes,
                },
            });

            if (error) throw error;

            // Step 2: Call native module to actually unlock the app
            const result = await ScreenTime.unblockAppForMinutes(packageName, minutes, childId);

            return {
                success: true,
                session: data,
                nativeResult: result,
            };
        } catch (error) {
            console.error('Error unlocking app:', error);
            throw error;
        }
    },

    /**
     * Get active screen time session for a child
     */
    async getActiveSession(childId) {
        try {
            const { data, error } = await supabase
                .from('screen_time_sessions')
                .select('*')
                .eq('child_id', childId)
                .eq('status', 'active')
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            return data;
        } catch (error) {
            console.error('Error getting active session:', error);
            return null;
        }
    },

    /**
     * Get blocked apps for a child
     */
    async getBlockedApps(childId) {
        try {
            const { data, error } = await supabase
                .from('blocked_apps')
                .select('*')
                .eq('child_id', childId)
                .eq('is_active', true);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting blocked apps:', error);
            return [];
        }
    },

    /**
     * Request screen time permissions
     */
    async requestPermissions() {
        try {
            return await ScreenTime.requestPermissions();
        } catch (error) {
            console.error('Error requesting permissions:', error);
            throw error;
        }
    },

    /**
     * Set up event listeners for timer events
     */
    setupEventListeners(onTimerExpired, onTwoMinuteWarning) {
        const unsubscribeExpired = ScreenTime.onTimerExpired(onTimerExpired);
        const unsubscribeWarning = ScreenTime.onTwoMinuteWarning(onTwoMinuteWarning);

        return () => {
            unsubscribeExpired();
            unsubscribeWarning();
        };
    },
};
