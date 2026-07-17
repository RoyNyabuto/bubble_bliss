import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RoleFilter = "CUSTOMER" | "DRIVER" | "EMPLOYEE" | "ADMIN";
type EventType = "PAYMENT" | "PICKUP" | "DELIVERY" | "ORDER" | "REFUND" | "GENERAL";
type NotificationWhere = Prisma.NotificationWhereInput;

function classifyEventType(title: string, body: string): EventType {
  const text = `${title} ${body}`.toLowerCase();

  if (text.includes("refund")) return "REFUND";
  if (text.includes("payment") || text.includes("paid") || text.includes("mpesa") || text.includes("card")) {
    return "PAYMENT";
  }
  if (text.includes("pickup") || text.includes("collect")) return "PICKUP";
  if (text.includes("delivery") || text.includes("delivered")) return "DELIVERY";
  if (text.includes("order")) return "ORDER";

  return "GENERAL";
}

function parseReadFilter(value: string | null): boolean | undefined {
  if (value === "read") return true;
  if (value === "unread") return false;
  return undefined;
}

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function eventTypeWhere(eventType: EventType | "all" | null): Record<string, unknown> {
  const payment = {
    OR: [
      { title: { contains: "payment", mode: "insensitive" as const } },
      { body: { contains: "payment", mode: "insensitive" as const } },
      { body: { contains: "paid", mode: "insensitive" as const } },
      { body: { contains: "mpesa", mode: "insensitive" as const } },
      { body: { contains: "card", mode: "insensitive" as const } }
    ]
  };
  const pickup = {
    OR: [
      { title: { contains: "pickup", mode: "insensitive" as const } },
      { body: { contains: "pickup", mode: "insensitive" as const } },
      { body: { contains: "collect", mode: "insensitive" as const } }
    ]
  };
  const delivery = {
    OR: [
      { title: { contains: "delivery", mode: "insensitive" as const } },
      { body: { contains: "delivery", mode: "insensitive" as const } },
      { body: { contains: "delivered", mode: "insensitive" as const } }
    ]
  };
  const refund = {
    OR: [
      { title: { contains: "refund", mode: "insensitive" as const } },
      { body: { contains: "refund", mode: "insensitive" as const } }
    ]
  };
  const order = {
    OR: [
      { title: { contains: "order", mode: "insensitive" as const } },
      { body: { contains: "order", mode: "insensitive" as const } }
    ]
  };

  if (!eventType || eventType === "all") return {};
  if (eventType === "PAYMENT") return payment;
  if (eventType === "PICKUP") return pickup;
  if (eventType === "DELIVERY") return delivery;
  if (eventType === "REFUND") return refund;
  if (eventType === "ORDER") return order;

  return {
    AND: [{ NOT: payment }, { NOT: pickup }, { NOT: delivery }, { NOT: refund }, { NOT: order }]
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as RoleFilter | "all" | null;
  const eventType = searchParams.get("eventType") as EventType | "all" | null;
  const read = parseReadFilter(searchParams.get("read"));
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") ?? 20), 5), 100);
  const startDate = parseDate(searchParams.get("startDate"));
  const endDate = parseDate(searchParams.get("endDate"));

  const where: NotificationWhere = {
    ...(typeof read === "boolean" ? { read } : {}),
    ...(role && role !== "all" ? { user: { role } } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        }
      : {}),
    ...eventTypeWhere(eventType)
  };

  const total = await prisma.notification.count({ where });
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * pageSize;

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize
  });

  type NotificationRow = Awaited<ReturnType<typeof prisma.notification.findMany>>[number];

  const items = notifications.map((notification: NotificationRow) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
    eventType: classifyEventType(notification.title, notification.body),
    recipient: notification.user
  }));

  return NextResponse.json({
    items,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages
    }
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const read = body.read as boolean | undefined;

  if (typeof read !== "boolean") {
    return NextResponse.json({ error: "read must be a boolean." }, { status: 400 });
  }

  if (body.all) {
    const ids = Array.isArray(body.ids) ? (body.ids as string[]) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids are required for bulk updates." }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { read }
    });

    return NextResponse.json({ updatedCount: result.count });
  }

  const notificationId = body.notificationId as string | undefined;
  if (!notificationId) {
    return NextResponse.json({ error: "notificationId is required." }, { status: 400 });
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read }
  });

  return NextResponse.json(updated);
}
