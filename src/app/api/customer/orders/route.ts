import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      pickupTime: true,
      createdAt: true,
      payment: {
        select: { id: true, status: true, method: true, amount: true }
      }
    }
  });

  type OrderRow = Awaited<ReturnType<typeof prisma.order.findMany>>[number];

  return NextResponse.json(
    orders.map((order: OrderRow) => ({
      ...order,
      total: Number(order.total),
      payment: order.payment
        ? {
            ...order.payment,
            amount: Number(order.payment.amount)
          }
        : null
    }))
  );
}
