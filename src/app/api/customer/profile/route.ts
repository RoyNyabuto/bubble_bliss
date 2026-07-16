import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, phone: true }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
    take: 5,
    select: { id: true, label: true, line1: true, city: true, isDefault: true }
  });

  type AddressRow = Awaited<ReturnType<typeof prisma.address.findMany>>[number];

  const selectedAddress = addresses.find((item: AddressRow) => item.isDefault) ?? addresses[0] ?? null;
  const address = selectedAddress
    ? [selectedAddress.line1, selectedAddress.city].filter(Boolean).join(", ")
    : null;

  const savedAddresses = addresses
    .map((item: AddressRow) => ({
      id: item.id,
      label: item.label,
      value: [item.line1, item.city].filter(Boolean).join(", "),
      isDefault: item.isDefault
    }))
    .filter((item) => item.value.length > 0);

  return NextResponse.json({
    name: user.name,
    phone: user.phone,
    address,
    addresses: savedAddresses
  });
}
