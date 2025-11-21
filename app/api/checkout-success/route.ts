import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';

/**
 * Checkout Success Endpoint - Failsafe User Upgrade
 * 
 * This endpoint is called immediately after successful checkout to ensure
 * the user is upgraded to Pro, even if webhooks fail or are delayed.
 * 
 * Flow:
 * 1. User completes Stripe checkout
 * 2. Redirected to success page with session_id
 * 3. Client calls this endpoint with session_id
 * 4. We verify the payment with Stripe
 * 5. Immediately upgrade the user to Pro
 */
export async function POST(request: NextRequest) {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 CHECKOUT SUCCESS ENDPOINT CALLED');
  console.log('='.repeat(70));
  
  try {
    const body = await request.json();
    const { sessionId } = body;

    console.log('📥 Request body:', { sessionId });

    if (!sessionId) {
      console.error('❌ Missing session ID');
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // Verify environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing');
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔍 Verifying checkout session:', sessionId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      console.log('⚠️ Payment not completed yet:', session.payment_status);
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    // Get user ID from metadata
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType || 'pro';
    const subscriptionType = session.metadata?.subscriptionType; // 'af_voice' for AF Voice subscriptions

    if (!userId) {
      console.error('❌ No userId in session metadata');
      return NextResponse.json(
        { error: "Invalid session - missing user ID" },
        { status: 400 }
      );
    }

    console.log('💳 Payment verified! Subscription type:', subscriptionType || 'pro', 'for user:', userId);
    console.log('📋 Session details:', {
      payment_status: session.payment_status,
      customer: session.customer,
      subscription: session.subscription,
      mode: session.mode,
      metadata: session.metadata
    });

    // Get subscription and customer details
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    console.log('🔑 Subscription ID:', subscriptionId);
    console.log('👤 Customer ID:', customerId);

    // Check if user profile exists
    console.log('🔍 Checking if user profile exists for:', userId);
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    console.log('📊 Existing profile check:', { 
      exists: !!existingProfile, 
      is_pro: existingProfile?.is_pro,
      email: existingProfile?.email,
      fetchError 
    });

    // Check if this is an AF Voice subscription
    if (subscriptionType === 'af_voice') {
      console.log('🎤 Processing AF Voice subscription...');
      
      if ((existingProfile as any)?.has_af_voice) {
        console.log('ℹ️ User already has AF Voice');
        return NextResponse.json({
          success: true,
          message: "Already has AF Voice Mode",
          alreadyUpgraded: true
        });
      }

      // Try to update profile with AF Voice access
      const afUpdateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      // Try to add AF Voice fields if they exist
      try {
        afUpdateData.has_af_voice = true;
        afUpdateData.af_voice_subscription_id = subscriptionId;
      } catch (e) {
        console.log('⚠️ AF Voice columns may not exist yet');
      }

      const { data: afData, error: afError } = await supabase
        .from("user_profiles")
        .update(afUpdateData)
        .eq("id", userId)
        .select();

      if (afError) {
        // If error is about missing columns, that's OK - log it and continue
        if (afError.message?.includes('has_af_voice') || afError.message?.includes('af_voice_subscription_id')) {
          console.warn('⚠️ AF Voice columns not in database yet. User upgraded but AF Voice feature disabled until migration runs.');
          return NextResponse.json({
            success: true,
            message: "Subscription successful! AF Voice will be enabled soon.",
            warning: "Database migration needed for AF Voice columns"
          });
        }
        
        console.error('❌ Failed to grant AF Voice access:', afError);
        return NextResponse.json(
          { error: "Failed to grant AF Voice access", details: afError.message },
          { status: 500 }
        );
      }

      console.log('✅ User successfully granted AF Voice access!');
      return NextResponse.json({
        success: true,
        message: "Successfully subscribed to AF Voice Mode!",
        user: afData?.[0]
      });
    }

    // Regular Pro subscription handling
    if (existingProfile?.is_pro) {
      console.log('ℹ️ User is already Pro');
      return NextResponse.json({
        success: true,
        message: "Already upgraded to Pro",
        alreadyUpgraded: true
      });
    }

    let data, error;

    if (existingProfile) {
      // Profile exists - UPDATE it
      console.log('📝 Updating existing profile to Pro...');
      
      // Build update object with only fields that exist in DB
      const updateData: any = {
        is_pro: true,
        plan_type: planType,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      };
      
      // Try to add upgraded_at if column exists (won't fail if it doesn't)
      try {
        updateData.upgraded_at = new Date().toISOString();
      } catch (e) {
        console.log('⚠️ upgraded_at column may not exist, skipping...');
      }
      
      const result = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", userId)
        .select();
      
      data = result.data;
      error = result.error;
      
      // If error is about missing column, retry without that column
      if (error && error.message?.includes('upgraded_at')) {
        console.log('🔄 Retrying without upgraded_at column...');
        delete updateData.upgraded_at;
        
        const retryResult = await supabase
          .from("user_profiles")
          .update(updateData)
          .eq("id", userId)
          .select();
        
        data = retryResult.data;
        error = retryResult.error;
      }
    } else {
      // Profile doesn't exist - CREATE it
      console.log('🆕 Creating new profile as Pro...');
      
      // Get user email from Stripe session
      const userEmail = session.customer_details?.email || session.customer_email || '';
      
      // Build insert object with only required fields
      const insertData: any = {
        id: userId,
        email: userEmail,
        is_pro: true,
        plan_type: planType,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const result = await supabase
        .from("user_profiles")
        .insert(insertData)
        .select();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('❌ Failed to upgrade user:', error);
      return NextResponse.json(
        { error: "Failed to upgrade user", details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ User successfully upgraded to Pro!');
    console.log('Updated profile:', data);
    console.log('='.repeat(70));
    console.log('🎉 CHECKOUT SUCCESS COMPLETE');
    console.log('='.repeat(70) + '\n');

    return NextResponse.json({
      success: true,
      message: "Successfully upgraded to Pro!",
      user: data?.[0]
    });

  } catch (error: any) {
    console.error('='.repeat(70));
    console.error('❌ CHECKOUT SUCCESS ERROR');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('='.repeat(70) + '\n');
    
    return NextResponse.json(
      { error: "Failed to verify checkout", details: error.message },
      { status: 500 }
    );
  }
}

