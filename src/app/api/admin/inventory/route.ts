import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const machines = await prisma.machine.findMany({
    orderBy: { label: "asc" }
  });

  return NextResponse.json(machines);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const label = (body.label as string | undefined)?.trim();
  const type = (body.type as string | undefined)?.trim();

  if (!label || !type) {
    return NextResponse.json({ error: "label and type are required." }, { status: 400 });
  }

  const created = await prisma.machine.create({
    data: {
      label,
      type,
      status: "AVAILABLE"
    }
  });

  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const machineId = body.machineId as string | undefined;
  const status = body.status as "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE" | undefined;

  if (!machineId || !status) {
    return NextResponse.json({ error: "machineId and status are required." }, { status: 400 });
  }

  if (session?.user?.role === "EMPLOYEE" && !["AVAILABLE", "IN_USE"].includes(status)) {
    return NextResponse.json(
      { error: "Employees can only mark machines as AVAILABLE or IN_USE." },
      { status: 403 }
    );
  }

  const updated = await prisma.machine.update({
    where: { id: machineId },
    data: { status }
  });

  return NextResponse.json(updated);
}
