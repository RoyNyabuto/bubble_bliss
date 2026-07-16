import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const allowedRoles = ["CUSTOMER", "DRIVER", "EMPLOYEE", "ADMIN"] as const;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const name = (body.name as string | undefined)?.trim();
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const phone = (body.phone as string | undefined)?.trim();
  const password = body.password as string | undefined;
  const requestedRole = (body.role as string | undefined)?.toUpperCase();
  const role = requestedRole && allowedRoles.includes(requestedRole as (typeof allowedRoles)[number])
    ? (requestedRole as (typeof allowedRoles)[number])
    : "CUSTOMER";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "name, email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
  }

  if (phone) {
    const existingByPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingByPhone) {
      return NextResponse.json({ error: "Phone is already in use." }, { status: 409 });
    }
  }

  if (role === "ADMIN") {
    const ownerCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (ownerCount >= 2) {
      return NextResponse.json(
        { error: "Owner signup is full. Only 2 owner accounts are allowed." },
        { status: 409 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  return NextResponse.json(user, { status: 201 });
}
