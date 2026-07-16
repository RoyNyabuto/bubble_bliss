import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [reviews, aggregate] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        order: { select: { orderNumber: true } }
      }
    }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { _all: true }
    })
  ]);

  return NextResponse.json({
    items: reviews,
    summary: {
      averageRating: Number(aggregate._avg.rating ?? 0),
      totalReviews: aggregate._count._all
    }
  });
}
