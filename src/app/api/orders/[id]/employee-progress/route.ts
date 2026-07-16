import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pushDriverAlerts } from "@/lib/driverPush";

type EmployeeAction =
  | "approve-arrival"
  | "washed"
  | "drying-done"
  | "ironed"
  | "ready-for-driver";

const transitionByAction: Record<EmployeeAction, { from: string; to: "CLEANING" | "DRYING" | "IRONING" | "PACKAGING" | "OUT_FOR_DELIVERY"; note: string }> = {
  "approve-arrival": {
    from: "LAUNDRY_COLLECTED",
    to: "CLEANING",
    note: "Order arrival approved by employee. Washing started."
  },
  washed: {
    from: "CLEANING",
    to: "DRYING",
    note: "Order washed and moved to drying."
  },
  "drying-done": {
    from: "DRYING",
    to: "IRONING",
    note: "Drying completed. Order moved to ironing."
  },
  ironed: {
    from: "IRONING",
    to: "PACKAGING",
    note: "Ironing completed. Order moved to packaging."
  },
  "ready-for-driver": {
    from: "PACKAGING",
    to: "OUT_FOR_DELIVERY",
    note: "Packaging completed. Ready for driver pickup to customer."
  }
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const employee = session.user.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true }
      })
    : null;

  if (!employee) {
    return NextResponse.json({ error: "Employee account not found." }, { status: 404 });
  }

  const body = await req.json();
  const action = body.action as EmployeeAction | undefined;

  if (!action || !transitionByAction[action]) {
    return NextResponse.json({ error: "Valid action is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerId: true,
      driverId: true,
      payment: { select: { status: true } }
    }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const transition = transitionByAction[action];

  if (order.status !== transition.from) {
    return NextResponse.json(
      { error: `Order must be in ${transition.from} before this action.` },
      { status: 400 }
    );
  }

  if (action === "ready-for-driver" && order.payment?.status !== "PAID") {
    return NextResponse.json(
      { error: "Customer payment is required before releasing order for delivery." },
      { status: 400 }
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: transition.to }
  });

  await prisma.deliveryTracking.create({
    data: {
      orderId: order.id,
      status: transition.to,
      note: `${transition.note} Updated by ${employee.name}.`
    }
  });

  await prisma.notification.create({
    data: {
      userId: order.customerId,
      title: "Order progress update",
      body: `${order.orderNumber}: ${transition.note}`
    }
  });

  if (action === "ready-for-driver") {
    const drivers = order.driverId
      ? await prisma.user.findMany({
          where: { id: order.driverId, role: "DRIVER" },
          select: { id: true, phone: true }
        })
      : await prisma.user.findMany({
          where: { role: "DRIVER" },
          select: { id: true, phone: true }
        });

    type DriverRow = Awaited<ReturnType<typeof prisma.user.findMany>>[number];

    const driverBody = `${order.orderNumber} is packed and ready for pickup to return to customer.`;

    if (drivers.length > 0) {
      await prisma.notification.createMany({
        data: drivers.map((driver: DriverRow) => ({
          userId: driver.id,
          title: "Order ready for return delivery",
          body: driverBody
        }))
      });

      await Promise.all(
        drivers.map((driver: DriverRow) =>
          pushDriverAlerts({
            phone: driver.phone,
            title: "Order ready for return delivery",
            body: driverBody,
            orderNumber: order.orderNumber
          })
        )
      );
    }
  }

  return NextResponse.json(updatedOrder);
}
