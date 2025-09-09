import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase.admin";
import { getServerSession } from "@/lib/session";

const Body = z.object({
  user: z.object({
    displayName: z.string().min(1),
  }),
  inviteCode: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const { user, inviteCode } = parsed.data;
    const auth = adminAuth();

    // For demo purposes, validate invite codes that start with "FRESH-"
    if (!inviteCode.toUpperCase().startsWith("FRESH-")) {
      return NextResponse.json(
        { error: "Invalid invitation code format. Codes should start with FRESH-" },
        { status: 400 }
      );
    }

    // Extract organization name from invite code (demo logic)
    // Expected format: FRESH-ORGNAME-XXXXX
    const codeParts = inviteCode.toUpperCase().split("-");
    const orgName = codeParts.length >= 2 ? codeParts[1].replace(/_/g, " ") : "Demo Organization";
    const orgId = `org_${orgName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    // Set custom claims to mark user as joined organization member
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role: "member",
      displayName: user.displayName,
      orgName: orgName,
      orgId: orgId,
    });

    return NextResponse.json({
      ok: true,
      org: { name: orgName, id: orgId },
      user: { displayName: user.displayName, role: "member" }
    });
  } catch (error) {
    console.error("Join organization error:", error);
    return NextResponse.json(
      { error: "Failed to join organization - make sure Firebase Authentication is enabled" },
      { status: 500 }
    );
  }
}
