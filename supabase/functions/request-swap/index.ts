import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders, withCors } from "../_shared/cors.ts";

type RequestSwapBody = {
  shiftId: string;
  requesterMembershipId: string;
  message?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return withCors({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as RequestSwapBody;
  if (!body.shiftId || !body.requesterMembershipId) {
    return withCors({ error: "shiftId and requesterMembershipId are required" }, 400);
  }

  const supabase = createAdminClient();

  const { data: assignment, error: assignmentError } = await supabase
    .from("shift_assignments")
    .select("id,assigned_membership_id")
    .eq("shift_id", body.shiftId)
    .single();

  if (assignmentError) {
    return withCors({ error: assignmentError.message }, 500);
  }

  if (!assignment || assignment.assigned_membership_id !== body.requesterMembershipId) {
    return withCors({ error: "Only currently assigned staff can request a swap" }, 403);
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .insert({
      shift_id: body.shiftId,
      requester_membership_id: body.requesterMembershipId,
      status: "open",
      message: body.message,
    })
    .select("id,shift_id,requester_membership_id,status,created_at")
    .single();

  if (error) {
    return withCors({ error: error.message }, 500);
  }

  return withCors({ swapRequest: data }, 201);
});
