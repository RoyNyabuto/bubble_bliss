import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushDriverAlerts } from "@/lib/driverPush";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const driverId = body.driverId as string | undefined;

  if (!driverId) {
    return NextResponse.json({ error: "driverId is required." }, { status: 400 });
  }

  const driver = await prisma.user.findFirst({
    where: { id: driverId, role: "DRIVER" },
    select: { id: true, name: true, phone: true }
  });

  if (!driver) {
    return NextResponse.json({ error: "Driver not found." }, { status: 404 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, orderNumber: true, customerId: true, pickupTime: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: params.id },
    data: {
      driverId,
      status: "DRIVER_ASSIGNED"
    }
  });

  const pickupLine = order.pickupTime
    ? new Date(order.pickupTime).toLocaleString()
    : "As soon as possible";

  const driverNotification = `You have been assigned ${order.orderNumber}. Pickup time: ${pickupLine}`;

  await prisma.notification.createMany({
    data: [
      {
        userId: driver.id,
        title: "Pickup assigned",
        body: driverNotification
      },
      {
        userId: order.customerId,
        title: "Driver assigned",
        body: `${driver.name} has been assigned to collect ${order.orderNumber}.`
      }
    ]
  });

  await pushDriverAlerts({
    phone: driver.phone,
    title: "Pickup assigned",
    body: driverNotification,
    orderNumber: order.orderNumber
  });

  return NextResponse.json(updatedOrder);
}
