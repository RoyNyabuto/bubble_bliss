import { NextRequest, NextResponse } from "next/server";
import { stkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  const { phone, amount, orderId } = await req.json();

  try {
    const result = await stkPush(phone, amount, orderId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Mpesa request failed" }, { status: 500 });
  }
}
