import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/session";

// GET /api/dashboard/events — simple stub returning an empty list for authenticated users
export async function GET(_req: NextRequest) {
	const session = await getServerSession();
	if (!session?.sub) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	return NextResponse.json({ ok: true, events: [] });
}

