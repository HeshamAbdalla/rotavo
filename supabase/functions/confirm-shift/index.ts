import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders, withCors } from "../_shared/cors.ts";

type ConfirmShiftBody = {
  shiftId: string;
  membershipId: string;
  source?: "mobile" | "web" | "sync";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return withCors({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as ConfirmShiftBody;
  if (!body.shiftId || !body.membershipId) {
    return withCors({ error: "shiftId and membershipId are required" }, 400);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shift_confirmations")
    .upsert(
      {
        shift_id: body.shiftId,
        membership_id: body.membershipId,
        source: body.source ?? "mobile",
        confirmed_at: new Date().toISOString(),
      },
      {
        onConflict: "shift_id,membership_id",
      },
    )
    .select("id,shift_id,membership_id,confirmed_at")
    .single();

  if (error) {
    return withCors({ error: error.message }, 500);
  }

  return withCors({ confirmation: data });
});
