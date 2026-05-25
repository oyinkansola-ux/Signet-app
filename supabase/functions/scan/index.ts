import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // Route: POST /scan/validate — validate a QR code scan
    if (req.method === "POST" && pathParts[1] === "validate") {
      const { qr_code_data, scan_token } = await req.json();

      if (!qr_code_data || !scan_token) {
        return new Response(
          JSON.stringify({ result: "invalid", message: "Missing qr_code_data or scan_token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Find event by scan_token
      const { data: event } = await supabase
        .from("events")
        .select("id, name")
        .eq("scan_token", scan_token)
        .maybeSingle();

      if (!event) {
        return new Response(
          JSON.stringify({ result: "invalid", message: "Event not found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find attendee by qr_code_data and event_id
      const { data: attendee } = await supabase
        .from("attendees")
        .select("id, name, email, ticket_type, status, scanned_at")
        .eq("qr_code_data", qr_code_data)
        .eq("event_id", event.id)
        .maybeSingle();

      if (!attendee) {
        // Log invalid scan
        await supabase.from("scan_logs").insert({
          event_id: event.id,
          result: "invalid",
        });

        return new Response(
          JSON.stringify({ result: "invalid", message: "Pass not recognised for this event" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (attendee.status === "used") {
        // Log already used scan
        await supabase.from("scan_logs").insert({
          attendee_id: attendee.id,
          event_id: event.id,
          result: "already_used",
        });

        return new Response(
          JSON.stringify({
            result: "already_used",
            attendee: { name: attendee.name, ticket_type: attendee.ticket_type, scanned_at: attendee.scanned_at },
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Valid first scan — mark as used and checked_in
      const now = new Date().toISOString();
      await supabase
        .from("attendees")
        .update({ status: "used", scanned_at: now, pass_status: "checked_in" })
        .eq("id", attendee.id);

      // Log valid scan
      await supabase.from("scan_logs").insert({
        attendee_id: attendee.id,
        event_id: event.id,
        result: "valid",
      });

      return new Response(
        JSON.stringify({
          result: "valid",
          attendee: { name: attendee.name, ticket_type: attendee.ticket_type, email: attendee.email },
          event: { name: event.name },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route: GET /scan/event/:scan_token — get event info for scanner
    if (req.method === "GET" && pathParts[1] === "event" && pathParts[2]) {
      const scan_token = pathParts[2];

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: event } = await supabase
        .from("events")
        .select("id, name, date, time, venue")
        .eq("scan_token", scan_token)
        .maybeSingle();

      if (!event) {
        return new Response(
          JSON.stringify({ error: "Event not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(event),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
