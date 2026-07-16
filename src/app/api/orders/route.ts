import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pushDriverAlerts } from "@/lib/driverPush";

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true, payment: true }
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const session = await getServerSession(authOptions);

  const selectedItems = Array.isArray(body.selectedItems)
    ? body.selectedItems.filter(
        (item: { name?: unknown; quantity?: unknown; unitPrice?: unknown }) =>
          typeof item?.name === "string" &&
          typeof item?.quantity === "number" &&
          typeof item?.unitPrice === "number" &&
          item.quantity > 0
      )
    : [];

  const fallbackCustomer = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
    select: { id: true }
  });

  const sessionCustomer = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      })
    : null;

  const customerId =
    body.customerId ?? sessionCustomer?.id ?? fallbackCustomer?.id;

  if (!customerId) {
    return NextResponse.json({ error: "No customer profile available for booking." }, { status: 400 });
  }

  // In production: look up/create the customer from the session, validate the
  // service selection, and compute subtotal/discount/total from real Service rows.
  const orderNumber = `BB-${Date.now().toString().slice(-8)}`;
  const pickupTime = body.pickupTime ? new Date(body.pickupTime) : null;
  const selectedItemsSummary =
    selectedItems.length > 0
      ? [
          "Selected Items:",
          ...selectedItems.map(
            (item: { name: string; quantity: number; unitPrice: number }) =>
              `- ${item.name} x ${item.quantity} @ ${item.unitPrice}`
          )
        ].join("\n")
      : null;
  const bookingDetails = [
    body.laundryType ? `Laundry Type: ${body.laundryType}` : null,
    body.name ? `Customer: ${body.name}` : null,
    body.phone ? `Phone: ${body.phone}` : null,
    body.address ? `Address: ${body.address}` : null,
    pickupTime ? `Pickup Time: ${pickupTime.toISOString()}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const notes = [body.notes, bookingDetails, selectedItemsSummary].filter(Boolean).join("\n\n");

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId,
      pickupTime: pickupTime ?? undefined,
      notes: notes || null,
      subtotal: body.subtotal ?? 0,
      total: body.total ?? 0
    }
  });

  const qrCode = await QRCode.toDataURL(order.id);
  await prisma.order.update({ where: { id: order.id }, data: { qrCode } });

  const pickupLine = pickupTime ? pickupTime.toLocaleString() : "As soon as possible";
  const driverMessage = [
    `Order ${order.orderNumber} is awaiting pickup.`,
    body.address ? `Address: ${body.address}` : null,
    body.phone ? `Customer phone: ${body.phone}` : null,
    `Pickup time: ${pickupLine}`
  ]
    .filter(Boolean)
    .join("\n");
  const employeeMessage = [
    `Upcoming order ${order.orderNumber} has been booked.`,
    `Prepare intake for pickup at ${pickupLine}.`
  ].join("\n");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["DRIVER", "EMPLOYEE"] } },
    select: { id: true, role: true, phone: true }
  });

  if (staff.length > 0) {
    await prisma.notification.createMany({
      data: staff.map((user) => ({
        userId: user.id,
        title: user.role === "DRIVER" ? "New pickup pending" : "Upcoming order",
        body: user.role === "DRIVER" ? driverMessage : employeeMessage
      }))
    });

    const driverTargets = staff.filter((user) => user.role === "DRIVER");
    await Promise.all(
      driverTargets.map((driver) =>
        pushDriverAlerts({
          phone: driver.phone,
          title: "New pickup pending",
          body: driverMessage,
          orderNumber: order.orderNumber
        })
      )
    );
  }

  return NextResponse.json(order, { status: 201 });
}
