import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/session";
import { ensureRole } from "@/lib/roles";

// GET /api/admin/users — placeholder admin-only endpoint
export async function GET(_req: NextRequest) {
	const session = await getServerSession();
	try {
		ensureRole(session, "owner");
	} catch (e) {
		return NextResponse.json({ error: "forbidden" }, { status: 403 });
	}
	return NextResponse.json({ ok: true, users: [] });
}

