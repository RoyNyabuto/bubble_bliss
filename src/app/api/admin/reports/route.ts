import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const now = new Date();
  const [todayRevenueAggregate, ordersInProgress, activeDrivers, machineCounts, totalOrders, refundedPayments] =
    await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: "PAID",
          createdAt: { gte: startOfDay(now), lte: endOfDay(now) }
        }
      }),
      prisma.order.count({
        where: {
          status: {
            in: [
              "ORDER_RECEIVED",
              "PICKUP_SCHEDULED",
              "DRIVER_ASSIGNED",
              "LAUNDRY_COLLECTED",
              "CLEANING",
              "DRYING",
              "IRONING",
              "PACKAGING",
              "OUT_FOR_DELIVERY"
            ]
          }
        }
      }),
      prisma.user.count({ where: { role: "DRIVER" } }),
      prisma.machine.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.order.count(),
      prisma.payment.count({ where: { status: "REFUNDED" } })
    ]);

  const machineSummary = {
    available: 0,
    inUse: 0,
    maintenance: 0,
    outOfService: 0
  };

  for (const entry of machineCounts) {
    if (entry.status === "AVAILABLE") machineSummary.available = entry._count.status;
    if (entry.status === "IN_USE") machineSummary.inUse = entry._count.status;
    if (entry.status === "MAINTENANCE") machineSummary.maintenance = entry._count.status;
    if (entry.status === "OUT_OF_SERVICE") machineSummary.outOfService = entry._count.status;
  }

  return NextResponse.json({
    revenueToday: todayRevenueAggregate._sum.amount ?? 0,
    ordersInProgress,
    activeDrivers,
    machineSummary,
    totalOrders,
    refundedPayments
  });
}
