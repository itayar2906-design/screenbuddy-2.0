import { supabase } from '../lib/supabase';

export const currency = {
    /**
     * Get T BUCKS balance for a child
     * READ ONLY - never modify balance from frontend
     */
    async getBalance(childId) {
        try {
            const { data, error } = await supabase
                .from('children')
                .select('time_bucks')
                .eq('id', childId)
                .single();

            if (error) throw error;

            return data?.time_bucks || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    },

    /**
     * Get transaction history for a child
     */
    async getTransactions(childId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('child_id', childId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting transactions:', error);
            return [];
        }
    },

    /**
     * Subscribe to balance changes via Realtime
     */
    subscribeToBalance(childId, callback) {
        const subscription = supabase
            .channel(`balance_${childId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'children',
                    filter: `id=eq.${childId}`,
                },
                (payload) => {
                    callback(payload.new.time_bucks);
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    },

    /**
     * Adjust balance (parent only)
     * Requires re-authentication
     */
    async adjustBalance(childId, amount, reason, reAuthToken) {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('adjust-balance', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'X-ReAuth-Token': reAuthToken,
                },
                body: {
                    child_id: childId,
                    amount,
                    reason,
                },
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error adjusting balance:', error);
            throw error;
        }
    },

    /**
     * Freeze/unfreeze spending (parent only)
     */
    async toggleFreeze(childId, freeze) {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('freeze-spending', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: {
                    child_id: childId,
                    freeze,
                },
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error toggling freeze:', error);
            throw error;
        }
    },
};
