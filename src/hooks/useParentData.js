import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useParentData = () => {
    const [user, setUser] = useState(null);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (currentUser) {
                const { data: childrenData, error } = await supabase
                    .from('children')
                    .select('*')
                    .eq('parent_id', currentUser.id)
                    .order('created_at');

                if (!error) {
                    setChildren(childrenData || []);
                }
            }
        } catch (error) {
            console.error('Error loading parent data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        user,
        children,
        loading,
        refresh
    };
};
