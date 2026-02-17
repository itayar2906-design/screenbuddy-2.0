import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature');

    if (!signature) {
        return new Response('No signature', { status: 400 });
    }

    try {
        const body = await req.text();
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }

        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        );

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

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;

                await supabaseClient
                    .from('stripe_customers')
                    .update({
                        stripe_subscription_id: subscription.id,
                        price_id: subscription.items.data[0].price.id,
                        active: subscription.status === 'active',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_customer_id', subscription.customer as string);

                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;

                await supabaseClient
                    .from('stripe_customers')
                    .update({
                        active: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('stripe_customer_id', subscription.customer as string);

                break;
            }

            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === 'subscription' && session.subscription) {
                    await supabaseClient
                        .from('stripe_customers')
                        .update({
                            stripe_subscription_id: session.subscription as string,
                            active: true,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('stripe_customer_id', session.customer as string);
                }

                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
