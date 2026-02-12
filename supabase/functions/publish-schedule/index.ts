import { createAdminClient } from "../_shared/client.ts";
import { corsHeaders, withCors } from "../_shared/cors.ts";

type PublishScheduleBody = {
  restaurantId: string;
  shiftIds: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return withCors({ error: "Method not allowed" }, 405);
  }

  const body = (await req.json()) as PublishScheduleBody;
  if (!body.restaurantId || !Array.isArray(body.shiftIds) || body.shiftIds.length === 0) {
    return withCors({ error: "restaurantId and shiftIds are required" }, 400);
  }

  const supabase = createAdminClient();

  const { data: shifts, error: shiftsError } = await supabase
    .from("shifts")
    .update({ published: true })
    .in("id", body.shiftIds)
    .eq("restaurant_id", body.restaurantId)
    .select("id");

  if (shiftsError) {
    return withCors({ error: shiftsError.message }, 500);
  }

  const publishedShiftIds = (shifts ?? []).map((row) => row.id);
  if (publishedShiftIds.length === 0) {
    return withCors({ publishedShiftCount: 0, notificationCount: 0 });
  }

  const { data: assignees, error: assigneeError } = await supabase
    .from("shift_assignments")
    .select("shift_id,assigned_membership_id")
    .in("shift_id", publishedShiftIds)
    .eq("assignment_status", "assigned")
    .not("assigned_membership_id", "is", null);

  if (assigneeError) {
    return withCors({ error: assigneeError.message }, 500);
  }

  const notifications = (assignees ?? []).map((row) => ({
    restaurant_id: body.restaurantId,
    membership_id: row.assigned_membership_id,
    channel: "push",
    event_type: "schedule_published",
    payload: { shiftId: row.shift_id },
  }));

  let notificationCount = 0;
  if (notifications.length > 0) {
    const { error: notifyError, count } = await supabase
      .from("notifications")
      .insert(notifications, { count: "exact" });

    if (notifyError) {
      return withCors({ error: notifyError.message }, 500);
    }

    notificationCount = count ?? notifications.length;
  }

  return withCors({
    publishedShiftCount: publishedShiftIds.length,
    notificationCount,
  });
});
