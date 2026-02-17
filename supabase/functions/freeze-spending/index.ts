import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FreezeSpendingRequest {
    child_id: string;
    freeze: boolean;
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
            throw new Error('Unauthorized: Only parents can freeze spending');
        }

        const { child_id, freeze }: FreezeSpendingRequest = await req.json();

        if (!child_id || freeze === undefined) {
            throw new Error('Missing required fields');
        }

        // Verify parent owns this child
        const { data: child, error: childError } = await supabaseClient
            .from('children')
            .select('parent_id, freeze')
            .eq('id', child_id)
            .single();

        if (childError || !child) {
            throw new Error('Child not found');
        }

        if (child.parent_id !== user.id) {
            throw new Error('Unauthorized: You do not own this child');
        }

        // Update freeze status
        const { error: updateError } = await supabaseClient
            .from('children')
            .update({ freeze })
            .eq('id', child_id);

        if (updateError) {
            throw updateError;
        }

        // Write audit log
        const { error: auditError } = await supabaseClient
            .from('audit_logs')
            .insert({
                actor_id: user.id,
                child_id,
                action: freeze ? 'freeze_spending' : 'unfreeze_spending',
                metadata: {
                    freeze,
                    previous_freeze: child.freeze,
                },
            });

        if (auditError) {
            throw auditError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                freeze,
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
