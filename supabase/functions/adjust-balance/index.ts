import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-reauth-confirmed',
};

interface AdjustBalanceRequest {
    child_id: string;
    amount: number;
    notes?: string;
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

        // Check for re-auth confirmation header
        const reauthConfirmed = req.headers.get('x-reauth-confirmed');
        if (reauthConfirmed !== 'true') {
            throw new Error('Re-authentication required for this action');
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
            throw new Error('Unauthorized: Only parents can adjust balance');
        }

        const { child_id, amount, notes }: AdjustBalanceRequest = await req.json();

        if (!child_id || amount === undefined) {
            throw new Error('Missing required fields');
        }

        // Verify parent owns this child
        const { data: child, error: childError } = await supabaseClient
            .from('children')
            .select('time_bucks, parent_id')
            .eq('id', child_id)
            .single();

        if (childError || !child) {
            throw new Error('Child not found');
        }

        if (child.parent_id !== user.id) {
            throw new Error('Unauthorized: You do not own this child');
        }

        const newBalance = child.time_bucks + amount;

        if (newBalance < 0) {
            throw new Error('Balance cannot be negative');
        }

        // Update child's Time Bucks balance
        const { error: balanceError } = await supabaseClient
            .from('children')
            .update({ time_bucks: newBalance })
            .eq('id', child_id);

        if (balanceError) {
            throw balanceError;
        }

        // Write transaction log
        const { error: transactionError } = await supabaseClient
            .from('transactions')
            .insert({
                child_id,
                actor_id: user.id,
                type: 'adjusted',
                amount,
                notes: notes || 'Manual balance adjustment by parent',
            });

        if (transactionError) {
            throw transactionError;
        }

        // Write audit log
        const { error: auditError } = await supabaseClient
            .from('audit_logs')
            .insert({
                actor_id: user.id,
                child_id,
                action: 'adjust_balance',
                metadata: {
                    amount,
                    old_balance: child.time_bucks,
                    new_balance: newBalance,
                    notes,
                },
            });

        if (auditError) {
            throw auditError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                new_balance: newBalance,
                amount_adjusted: amount,
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
