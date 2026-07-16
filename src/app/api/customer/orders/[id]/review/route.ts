import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const rating = Number(body.rating);
  const comment = (body.comment as string | undefined)?.trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: params.id, customerId: customer.id },
    select: { id: true, status: true, orderNumber: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json({ error: "You can only review delivered orders." }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { orderId: order.id },
    update: {
      rating,
      comment: comment || null,
      userId: customer.id
    },
    create: {
      orderId: order.id,
      userId: customer.id,
      rating,
      comment: comment || null
    }
  });

  return NextResponse.json(review);
}
