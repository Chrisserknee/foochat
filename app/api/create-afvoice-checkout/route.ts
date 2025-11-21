import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json({ 
        error: "Stripe is not configured. Please contact support." 
      }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });

    console.log("💳 Creating AF Voice subscription checkout for user:", userId);

    // Create Stripe checkout session for AF Voice Mode subscription
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "AF Voice Mode",
              description: "Advanced Foo Mode - Real-time voice conversations with Foo",
              images: ["https://i.imgur.com/your-foo-avatar.png"], // Optional: add your Foo avatar
            },
            unit_amount: 499, // $4.99 in cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?afvoice=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?afvoice=cancelled`,
      metadata: {
        userId: userId,
        subscriptionType: "af_voice",
      },
      // Allow promotional codes
      allow_promotion_codes: true,
    });

    console.log("✅ AF Voice checkout session created:", session.id);

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error("❌ Stripe AF Voice checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}

