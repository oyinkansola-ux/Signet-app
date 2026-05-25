import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const body = await req.json();

    // Check if Resend API key is configured
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (body.action === "check") {
      return new Response(
        JSON.stringify({ configured: !!resendKey }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.action === "send") {
      if (!resendKey) {
        return new Response(
          JSON.stringify({ error: "RESEND_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { to, attendeeName, eventName, eventDate, eventTime, venue, organiserName, pngBase64, fileName } = body;

      if (!to) {
        return new Response(
          JSON.stringify({ error: "Missing recipient email" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const dateStr = eventDate
        ? new Date(eventDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "TBD";

      const bodyText = `Hi ${attendeeName},\n\nHere is your pass for ${eventName || "your event"} on ${dateStr}${eventTime ? ` at ${eventTime}` : ""} at ${venue || "TBD"}.\nShow this pass at the door for entry.\n\n— ${organiserName || "Event Organiser"}`;

      const emailPayload: Record<string, unknown> = {
        from: "Signet <noreply@signet.app>",
        to: [to],
        subject: `Your pass for ${eventName || "your event"}`,
        text: bodyText,
      };

      if (pngBase64) {
        emailPayload.attachments = [
          {
            filename: fileName || "signet-pass.png",
            content: pngBase64,
            type: "image/png",
          },
        ];
      }

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!resendResponse.ok) {
        const errText = await resendResponse.text();
        console.error("Resend API error:", errText);
        return new Response(
          JSON.stringify({ error: "Failed to send email", details: errText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await resendResponse.json();

      return new Response(
        JSON.stringify({ success: true, id: result.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
