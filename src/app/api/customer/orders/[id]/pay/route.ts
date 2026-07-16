import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/stripe";
import { stkPush } from "@/lib/mpesa";

type PayMethod = "MPESA" | "CARD" | "CASH";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const customer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
  }

  const body = await req.json();
  const method = body.method as PayMethod | undefined;
  const phone = body.phone as string | undefined;

  if (!method || !["MPESA", "CARD", "CASH"].includes(method)) {
    return NextResponse.json({ error: "Valid payment method is required." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: customer.id },
    include: { payment: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.payment?.status === "PAID") {
    return NextResponse.json({ error: "Order is already paid." }, { status: 400 });
  }

  const amount = Number(order.total);

  let reference = "";
  let paymentNote = "Payment confirmed";

  try {
    if (method === "MPESA") {
      if (!phone) {
        return NextResponse.json({ error: "Phone is required for MPESA payments." }, { status: 400 });
      }

      if (process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET) {
        const mpesaResult = await stkPush(phone, amount, order.id);
        reference = mpesaResult.CheckoutRequestID || mpesaResult.MerchantRequestID || "MPESA";
      } else {
        reference = `MPESA-DEMO-${Date.now()}`;
      }

      paymentNote = "MPESA payment confirmed";
    }

    if (method === "CARD") {
      if (process.env.STRIPE_SECRET_KEY) {
        const intent = await createPaymentIntent(amount, order.id);
        reference = intent.id;
      } else {
        reference = `CARD-DEMO-${Date.now()}`;
      }

      paymentNote = "Card payment confirmed";
    }

    if (method === "CASH") {
      reference = `CASH-${Date.now()}`;
      paymentNote = "Cash payment recorded";
    }
  } catch {
    return NextResponse.json({ error: "Payment request failed. Please try again." }, { status: 500 });
  }

  const payment = order.payment
    ? await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          method,
          status: "PAID",
          amount,
          mpesaReceipt: method === "MPESA" ? reference : null,
          stripeIntent: method === "CARD" ? reference : null,
          transactions: {
            create: {
              type: "PAYMENT",
              amount,
              reference
            }
          }
        },
        include: { transactions: true }
      })
    : await prisma.payment.create({
        data: {
          orderId: order.id,
          method,
          status: "PAID",
          amount,
          mpesaReceipt: method === "MPESA" ? reference : null,
          stripeIntent: method === "CARD" ? reference : null,
          transactions: {
            create: {
              type: "PAYMENT",
              amount,
              reference
            }
          }
        },
        include: { transactions: true }
      });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true }
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "Customer payment received",
        body: `${order.orderNumber} paid via ${method}. Amount: KSh ${amount}.`
      }))
    });
  }

  await prisma.notification.create({
    data: {
      userId: customer.id,
      title: "Payment successful",
      body: `${paymentNote} for ${order.orderNumber}.`
    }
  });

  return NextResponse.json({
    payment: {
      ...payment,
      amount: Number(payment.amount)
    }
  });
}
