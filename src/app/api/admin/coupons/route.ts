import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { expiresAt: "asc" }
  });

  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const code = (body.code as string | undefined)?.trim()?.toUpperCase();
  const percentOffRaw = body.percentOff as number | null | undefined;
  const amountOffRaw = body.amountOff as number | null | undefined;
  const expiresAtRaw = body.expiresAt as string | null | undefined;

  if (!code) {
    return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
  }

  if (!percentOffRaw && !amountOffRaw) {
    return NextResponse.json({ error: "Provide either percentOff or amountOff." }, { status: 400 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      percentOff: percentOffRaw ?? null,
      amountOff: amountOffRaw ?? null,
      expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null
    }
  });

  return NextResponse.json(coupon, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const id = body.id as string | undefined;
  const active = body.active as boolean | undefined;

  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "id and active are required." }, { status: 400 });
  }

  const updated = await prisma.coupon.update({
    where: { id },
    data: { active }
  });

  return NextResponse.json(updated);
}
