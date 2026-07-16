import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { amount, orderId } = await req.json();

  try {
    const intent = await createPaymentIntent(amount, orderId);
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (err) {
    return NextResponse.json({ error: "Stripe request failed" }, { status: 500 });
  }
}
