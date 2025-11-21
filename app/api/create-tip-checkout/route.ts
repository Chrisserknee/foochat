import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { amount, userId } = await req.json();

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Tip amount must be at least $1" }, { status: 400 });
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json({ error: "Stripe is not configured. Please contact support." }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });

    console.log('💰 Creating tip checkout for amount:', amount, 'User:', userId);

    // Convert amount to cents
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    if (amountInCents < 100) {
      return NextResponse.json({ error: "Tip amount must be at least $1" }, { status: 400 });
    }

    // Create Stripe checkout session for tip
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tip for FooChat",
              description: "Help a Foo Out! 🍔 Your support keeps FooChat running.",
              images: ["https://i.imgur.com/your-foo-avatar.png"], // Optional: add your Foo avatar URL
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?tip=success&amount=${amount}`,
      cancel_url: `${req.headers.get("origin")}/?tip=cancelled`,
      metadata: {
        type: "tip",
        userId: userId,
        amount: amount.toString(),
      },
    });

    console.log("✅ Tip checkout session created:", session.id);

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error("❌ Stripe tip checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}

