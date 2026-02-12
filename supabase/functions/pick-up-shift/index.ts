import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders, withCors } from "../_shared/cors.ts";

type PickupShiftBody = {
  swapRequestId: string;
  pickupMembershipId: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return withCors({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as PickupShiftBody;
  if (!body.swapRequestId || !body.pickupMembershipId) {
    return withCors({ error: "swapRequestId and pickupMembershipId are required" }, 400);
  }

  const supabase = createAdminClient();

  const { data: swapRequest, error: requestError } = await supabase
    .from("swap_requests")
    .select("id,status,requester_membership_id,shift_id,shifts!inner(id,restaurant_id,role_id,starts_at,ends_at)")
    .eq("id", body.swapRequestId)
    .single();

  if (requestError) {
    return withCors({ error: requestError.message }, 500);
  }

  if (!swapRequest || swapRequest.status !== "open") {
    return withCors({ error: "Swap request is not open" }, 409);
  }

  if (swapRequest.requester_membership_id === body.pickupMembershipId) {
    return withCors({ error: "Requester cannot pick up their own shift" }, 400);
  }

  const shift = Array.isArray(swapRequest.shifts) ? swapRequest.shifts[0] : swapRequest.shifts;
  if (!shift) {
    return withCors({ error: "Shift not found for swap request" }, 404);
  }

  const [roleMatchResult, conflictResult] = await Promise.all([
    supabase
      .from("membership_roles")
      .select("id")
      .eq("membership_id", body.pickupMembershipId)
      .eq("role_id", shift.role_id)
      .maybeSingle(),
    supabase.rpc("has_shift_conflict", {
      p_membership_id: body.pickupMembershipId,
      p_starts_at: shift.starts_at,
      p_ends_at: shift.ends_at,
      p_exclude_shift_id: shift.id ?? null,
    }),
  ]);

  if (roleMatchResult.error) {
    return withCors({ error: roleMatchResult.error.message }, 500);
  }

  if (conflictResult.error) {
    return withCors({ error: conflictResult.error.message }, 500);
  }

  const hasRole = Boolean(roleMatchResult.data);
  const hasConflict = Boolean(conflictResult.data);
  const autoApproved = hasRole && !hasConflict;

  const { data: pickup, error: pickupError } = await supabase
    .from("swap_pickups")
    .insert({
      swap_request_id: body.swapRequestId,
      pickup_membership_id: body.pickupMembershipId,
      status: autoApproved ? "approved" : "pending",
      auto_approved: autoApproved,
    })
    .select("id,status,auto_approved")
    .single();

  if (pickupError) {
    return withCors({ error: pickupError.message }, 500);
  }

  if (autoApproved) {
    const { error: assignError } = await supabase
      .from("shift_assignments")
      .update({ assigned_membership_id: body.pickupMembershipId, assignment_status: "assigned" })
      .eq("shift_id", swapRequest.shift_id);

    if (assignError) {
      return withCors({ error: assignError.message }, 500);
    }

    const { error: requestUpdateError } = await supabase
      .from("swap_requests")
      .update({ status: "approved" })
      .eq("id", body.swapRequestId);

    if (requestUpdateError) {
      return withCors({ error: requestUpdateError.message }, 500);
    }
  } else {
    const { error: requestUpdateError } = await supabase
      .from("swap_requests")
      .update({ status: "pending_approval" })
      .eq("id", body.swapRequestId);

    if (requestUpdateError) {
      return withCors({ error: requestUpdateError.message }, 500);
    }
  }

  const { error: notifyError } = await supabase.from("notifications").insert({
    restaurant_id: shift.restaurant_id,
    membership_id: swapRequest.requester_membership_id,
    channel: "push",
    event_type: autoApproved ? "swap_auto_approved" : "swap_pickup_pending",
    payload: {
      swapRequestId: body.swapRequestId,
      pickupMembershipId: body.pickupMembershipId,
    },
  });

  if (notifyError) {
    return withCors({ error: notifyError.message }, 500);
  }

  return withCors({ pickup, autoApproved }, autoApproved ? 200 : 202);
});
