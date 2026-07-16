import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const pickupAllowed = ["ORDER_RECEIVED", "PICKUP_SCHEDULED", "DRIVER_ASSIGNED"] as const;
const deliveryBlocked = ["CANCELLED", "DELIVERED"] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "DRIVER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const driver = session.user.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true }
      })
    : null;

  if (!driver) {
    return NextResponse.json({ error: "Driver account not found." }, { status: 404 });
  }

  const body = await req.json();
  const action = body.action as "pickup" | "delivery" | undefined;

  if (!action) {
    return NextResponse.json({ error: "action is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      driverId: true,
      customerId: true,
      payment: { select: { status: true } }
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.driverId !== driver.id) {
    return NextResponse.json({ error: "This order is not assigned to you." }, { status: 403 });
  }

  if (action === "pickup") {
    if (!pickupAllowed.includes(order.status as (typeof pickupAllowed)[number])) {
      return NextResponse.json({ error: "Order cannot be marked as picked up from current status." }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "LAUNDRY_COLLECTED" }
    });

    await prisma.deliveryTracking.create({
      data: {
        orderId: order.id,
        status: "LAUNDRY_COLLECTED",
        note: `Pickup confirmed by ${driver.name}`
      }
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: order.customerId,
          title: "Pickup confirmed",
          body: `${order.orderNumber} has been picked up by ${driver.name}.`
        }
      ]
    });

    return NextResponse.json(updated);
  }

  if (deliveryBlocked.includes(order.status as (typeof deliveryBlocked)[number])) {
    return NextResponse.json({ error: "Order cannot be delivered from current status." }, { status: 400 });
  }

  if (order.payment?.status !== "PAID") {
    return NextResponse.json(
      { error: "Payment must be completed before delivery confirmation." },
      { status: 400 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "DELIVERED", deliveryTime: new Date() }
  });

  await prisma.$transaction([
    prisma.deliveryTracking.create({
      data: {
        orderId: order.id,
        status: "DELIVERED",
        note: `Delivery confirmed by ${driver.name}`
      }
    }),
    prisma.user.update({
      where: { id: order.customerId },
      data: { loyaltyPoints: { increment: 5 } }
    }),
    prisma.notification.create({
      data: {
        userId: order.customerId,
        title: "Delivery completed - thank you!",
        body:
          `${order.orderNumber} was delivered successfully. Thank you for choosing Bubble Bliss Cleaners! ` +
          "Please rate and review your experience. You have earned 5 loyalty points for this completed order."
      }
    })
  ]);

  return NextResponse.json(updated);
}
