import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(request, "admin", { userId: user.id });
  if (!rl.allowed) return rl.response!;

  const { data: admin } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (id === user.id) return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : null;

  const { data: target } = await supabase.from("users").select("email").eq("id", id).single();

  // `users.is_banned` is locked from authenticated clients by 0013 (column-
  // level REVOKE). Admin authorization has already been verified above; the
  // service-role client performs the privileged write.
  const admin_db = createServiceRoleClient();

  const { error: banErr } = await admin_db.from("users").update({ is_banned: true }).eq("id", id);
  if (banErr) return NextResponse.json({ error: banErr.message }, { status: 500 });

  if (target?.email) {
    await admin_db
      .from("banned_emails")
      .upsert(
        { email: target.email.trim().toLowerCase(), reason, banned_by: user.id },
        { onConflict: "email" }
      );
  }

  return NextResponse.json({ ok: true });
}
