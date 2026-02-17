import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnlockScreenTimeRequest {
    child_id: string;
    app_name: string;
    package_name: string;
    minutes: number;
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

        // Get JWT from authorization header (child session)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const { child_id, app_name, package_name, minutes }: UnlockScreenTimeRequest = await req.json();

        if (!child_id || !app_name || !package_name || !minutes) {
            throw new Error('Missing required fields');
        }

        if (minutes <= 0) {
            throw new Error('Minutes must be greater than 0');
        }

        // Get child details
        const { data: child, error: childError } = await supabaseClient
            .from('children')
            .select('time_bucks, freeze, parent_id')
            .eq('id', child_id)
            .single();

        if (childError || !child) {
            throw new Error('Child not found');
        }

        // Check if spending is frozen
        if (child.freeze) {
            throw new Error('Spending is frozen by parent');
        }

        // Get blocked app details
        const { data: blockedApp, error: blockedAppError } = await supabaseClient
            .from('blocked_apps')
            .select('time_bucks_per_minute, is_active')
            .eq('child_id', child_id)
            .eq('package_name', package_name)
            .eq('is_active', true)
            .single();

        if (blockedAppError || !blockedApp) {
            throw new Error('App not found in blocked apps list');
        }

        // Calculate cost
        const cost = minutes * blockedApp.time_bucks_per_minute;

        // Check if child has enough Time Bucks
        if (child.time_bucks < cost) {
            throw new Error(`Insufficient Time Bucks. Need ${cost}, have ${child.time_bucks}`);
        }

        const newBalance = child.time_bucks - cost;

        // Deduct Time Bucks from balance
        const { error: balanceError } = await supabaseClient
            .from('children')
            .update({ time_bucks: newBalance })
            .eq('id', child_id);

        if (balanceError) {
            throw balanceError;
        }

        // Create screen time session
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + minutes);

        const { data: session, error: sessionError } = await supabaseClient
            .from('screen_time_sessions')
            .insert({
                child_id,
                app_name,
                package_name,
                minutes_granted: minutes,
                time_bucks_spent: cost,
                expires_at: expiresAt.toISOString(),
                status: 'active',
            })
            .select()
            .single();

        if (sessionError || !session) {
            throw new Error('Failed to create screen time session');
        }

        // Write transaction log
        const { error: transactionError } = await supabaseClient
            .from('transactions')
            .insert({
                child_id,
                actor_id: child_id,
                type: 'spent',
                amount: -cost,
                notes: `screen-time:${app_name}:${minutes}min`,
                reference_id: session.id,
            });

        if (transactionError) {
            throw transactionError;
        }

        // Write audit log
        const { error: auditError } = await supabaseClient
            .from('audit_logs')
            .insert({
                actor_id: child_id,
                child_id,
                action: 'unlock_screen_time',
                metadata: {
                    app_name,
                    package_name,
                    minutes,
                    time_bucks_spent: cost,
                    new_balance: newBalance,
                    session_id: session.id,
                },
            });

        if (auditError) {
            throw auditError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                session_id: session.id,
                expires_at: expiresAt.toISOString(),
                minutes_granted: minutes,
                time_bucks_spent: cost,
                new_balance: newBalance,
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
