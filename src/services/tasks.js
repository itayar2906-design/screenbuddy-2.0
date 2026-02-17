import { supabase } from '../lib/supabase';

export const tasks = {
    /**
     * Get all tasks for a child
     */
    async getTasksForChild(childId) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          task_completions (
            id,
            status,
            submitted_at,
            reviewed_at
          )
        `)
                .eq('child_id', childId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting tasks:', error);
            return [];
        }
    },

    /**
     * Submit a task completion
     */
    async submitTaskCompletion(taskId, childId) {
        try {
            const { data, error } = await supabase
                .from('task_completions')
                .insert({
                    task_id: taskId,
                    child_id: childId,
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error submitting task:', error);
            throw error;
        }
    },

    /**
     * Get pending task completions for approval
     */
    async getPendingApprovals(parentId) {
        try {
            // First get all children for this parent
            const { data: children } = await supabase
                .from('children')
                .select('id')
                .eq('parent_id', parentId);

            if (!children || children.length === 0) return [];

            const childIds = children.map(c => c.id);

            const { data, error } = await supabase
                .from('task_completions')
                .select(`
          *,
          tasks (*),
          children (*)
        `)
                .eq('status', 'pending')
                .in('child_id', childIds)
                .order('submitted_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting pending approvals:', error);
            return [];
        }
    },

    /**
     * Approve a task completion
     * Calls Edge Function to add T BUCKS
     */
    async approveTask(taskCompletionId) {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            const { data, error } = await supabase.functions.invoke('approve-task', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: {
                    task_completion_id: taskCompletionId,
                },
            });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error approving task:', error);
            throw error;
        }
    },

    /**
     * Create a new task
     */
    async createTask(parentId, childId, taskData) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert({
                    parent_id: parentId,
                    child_id: childId,
                    title: taskData.title,
                    description: taskData.description,
                    frequency: taskData.frequency || 'daily',
                    time_bucks_reward: taskData.time_bucks_reward,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },
};
