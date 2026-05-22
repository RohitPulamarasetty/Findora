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

  const { data: target } = await supabase.from("users").select("email").eq("id", id).single();

  // users.is_banned is locked from authenticated clients by 0013. Admin
  // authorization has already been verified above; use service-role for
  // the privileged write.
  const admin_db = createServiceRoleClient();

  const { error: unbanErr } = await admin_db
    .from("users")
    .update({ is_banned: false })
    .eq("id", id);
  if (unbanErr) return NextResponse.json({ error: unbanErr.message }, { status: 500 });

  if (target?.email) {
    await admin_db.from("banned_emails").delete().eq("email", target.email.trim().toLowerCase());
  }

  return NextResponse.json({ ok: true });
}
