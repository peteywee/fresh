import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase.admin";
import { getServerSession } from "@/lib/session";

const Body = z.object({
  user: z.object({
    displayName: z.string().min(1),
  }),
  org: z.object({
    name: z.string().min(2),
  }),
  type: z.enum(["create", "join"]).optional().default("create"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { user, org, type } = parsed.data;
    const auth = adminAuth();

    // Generate organization ID based on the organization name and timestamp
    const orgId = `org_${org.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;

    // For "create" type, user becomes admin/owner; for "join" type, user becomes member
    const role = type === "create" ? "owner" : "member";

    // Set custom claims without Firestore (for demo/testing)
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role: role,
      displayName: user.displayName,
      orgName: org.name,
      orgId: orgId,
    });

    return NextResponse.json({ 
      ok: true, 
      org: { name: org.name, id: orgId }, 
      user: { displayName: user.displayName, role: role }
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ 
      error: "Onboarding failed - make sure Firebase Authentication is enabled in console" 
    }, { status: 500 });
  }
}
