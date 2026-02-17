import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveTaskRequest {
  task_completion_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get JWT from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Verify user is a parent
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'parent') {
      throw new Error('Unauthorized: Only parents can approve tasks');
    }

    const { task_completion_id }: ApproveTaskRequest = await req.json();

    // Get task completion details
    const { data: completion, error: completionError } = await supabaseClient
      .from('task_completions')
      .select(`
        id,
        task_id,
        child_id,
        tasks (
          time_bucks_reward,
          parent_id
        )
      `)
      .eq('id', task_completion_id)
      .single();

    if (completionError || !completion) {
      throw new Error('Task completion not found');
    }

    // Verify parent owns this child
    if (completion.tasks.parent_id !== user.id) {
      throw new Error('Unauthorized: You do not own this child');
    }

    // Update task completion to approved
    const { error: updateError } = await supabaseClient
      .from('task_completions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', task_completion_id);

    if (updateError) {
      throw updateError;
    }

    // Get current child balance
    const { data: child, error: childError } = await supabaseClient
      .from('children')
      .select('time_bucks')
      .eq('id', completion.child_id)
      .single();

    if (childError || !child) {
      throw new Error('Child not found');
    }

    const newBalance = child.time_bucks + completion.tasks.time_bucks_reward;

    // Update child's Time Bucks balance
    const { error: balanceError } = await supabaseClient
      .from('children')
      .update({ time_bucks: newBalance })
      .eq('id', completion.child_id);

    if (balanceError) {
      throw balanceError;
    }

    // Write transaction log
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        child_id: completion.child_id,
        actor_id: user.id,
        type: 'earned',
        amount: completion.tasks.time_bucks_reward,
        notes: `Task approved: ${task_completion_id}`,
        reference_id: task_completion_id,
      });

    if (transactionError) {
      throw transactionError;
    }

    // Write audit log
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        child_id: completion.child_id,
        action: 'approve_task',
        metadata: {
          task_completion_id,
          time_bucks_reward: completion.tasks.time_bucks_reward,
          new_balance: newBalance,
        },
      });

    if (auditError) {
      throw auditError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_balance: newBalance,
        time_bucks_earned: completion.tasks.time_bucks_reward,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
