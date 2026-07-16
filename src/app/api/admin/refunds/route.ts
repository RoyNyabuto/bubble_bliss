import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const orderId = body.orderId as string | undefined;
  const reason = (body.reason as string | undefined)?.trim();

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true }
  });

  if (!order || !order.payment) {
    return NextResponse.json({ error: "Order payment not found." }, { status: 404 });
  }

  if (order.payment.status === "REFUNDED") {
    return NextResponse.json({ error: "This payment is already refunded." }, { status: 400 });
  }

  const updated = await prisma.payment.update({
    where: { orderId },
    data: {
      status: "REFUNDED",
      transactions: {
        create: {
          type: "REFUND",
          amount: order.payment.amount,
          reference: reason || "Admin refund"
        }
      }
    },
    include: { transactions: true }
  });

  await prisma.notification.create({
    data: {
      userId: order.customerId,
      title: "Refund processed",
      body: `A refund has been processed for ${order.orderNumber}.`
    }
  });

  return NextResponse.json(updated);
}
