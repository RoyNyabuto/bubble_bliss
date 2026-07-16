import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const read = body.read as boolean | undefined;

  if (typeof read !== "boolean") {
    return NextResponse.json({ error: "read must be a boolean." }, { status: 400 });
  }

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: user.id },
      data: { read }
    });

    return NextResponse.json({ success: true });
  }

  const notificationId = body.notificationId as string | undefined;
  if (!notificationId) {
    return NextResponse.json({ error: "notificationId is required." }, { status: 400 });
  }

  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read }
  });

  return NextResponse.json(updated);
}
