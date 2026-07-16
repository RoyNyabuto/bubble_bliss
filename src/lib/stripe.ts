import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20"
});

export async function createPaymentIntent(amountKsh: number, orderId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountKsh * 100),
    currency: "kes",
    metadata: { orderId }
  });
}
