/* eslint-disable @typescript-eslint/no-explicit-any */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotifyPayload = {
  type: "pending" | "approved";
  email: string;
  full_name?: string;
};

async function sendResendEmail(payload: NotifyPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  const subject =
    payload.type === "pending"
      ? "Your account is pending approval"
      : "Your account has been approved";

  const greetingName = payload.full_name || "there";
  const html = payload.type === "pending"
    ? `<p>Hello ${greetingName},</p>
       <p>Thank you for registering. Your account is currently <strong>pending approval</strong> by an administrator.</p>
       <p>We will notify you once your account is approved. You can close this window for now.</p>
       <p>Regards,<br/>Farm Manager Team</p>`
    : `<p>Hello ${greetingName},</p>
       <p>Your account has been <strong>approved</strong>. You can now sign in and start using the system.</p>
       <p><a href="${Deno.env.get("PUBLIC_APP_URL") || ""}">Open the app</a></p>
       <p>Regards,<br/>Farm Manager Team</p>`;

  // Use Resend's test sender by default to avoid failures when a custom sender isn't configured
  const from = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error: ${res.status} ${text}`);
  }

  return await res.json();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as NotifyPayload;

    if (!payload || !payload.email || (payload.type !== "pending" && payload.type !== "approved")) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendResendEmail(payload);

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


