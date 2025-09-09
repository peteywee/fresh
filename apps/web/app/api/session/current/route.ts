import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

export async function GET() {
  const s = await getServerSession();
  if (!s) return NextResponse.json({ loggedIn: false }, { status: 200 });
  return NextResponse.json({ loggedIn: true, user: s }, { status: 200 });
}
