import { createClient } from "@supabase/supabase-js";
import { RequestHandler } from "express";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(1).max(10000),
  submissionId: z.string().uuid(),
});

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const contactAdminEmail = process.env.CONTACT_ADMIN_EMAIL;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

function createSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const submitContactMessage: RequestHandler = async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please provide a valid name, email, and message." });
    return;
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    res.status(503).json({ error: "Contact service is unavailable." });
    return;
  }

  const { name, email, message, submissionId } = parsed.data;
  let { data: submission, error } = await supabase
    .from("contact_messages")
    .insert({
      name,
      email,
      message,
      client_submission_id: submissionId,
    })
    .select("id, created_at, notification_sent_at, notification_attempted_at")
    .single();

  if (error?.code === "23505") {
    ({ data: submission, error } = await supabase
      .from("contact_messages")
      .select("id, created_at, notification_sent_at, notification_attempted_at")
      .eq("client_submission_id", submissionId)
      .single());
  }

  if (error || !submission) {
    console.error("Unable to save contact message", error);
    res.status(500).json({ error: "Unable to save contact message." });
    return;
  }

  if (
    !submission.notification_sent_at &&
    !submission.notification_attempted_at &&
    resendApiKey &&
    resendFromEmail &&
    contactAdminEmail
  ) {
    const { data: notificationClaim } = await supabase
      .from("contact_messages")
      .update({ notification_attempted_at: new Date().toISOString() })
      .eq("id", submission.id)
      .is("notification_attempted_at", null)
      .select("id")
      .maybeSingle();

    if (notificationClaim) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: resendFromEmail,
            to: [contactAdminEmail],
            subject: "New Contact Form Message",
            text: `New contact form submission received.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nSubmitted: ${new Date(submission.created_at).toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" })}`,
          }),
        });

        if (response.ok) {
          await supabase
            .from("contact_messages")
            .update({ notification_sent_at: new Date().toISOString() })
            .eq("id", submission.id)
            .is("notification_sent_at", null);
        } else {
          console.error("Unable to send contact notification", response.status);
        }
      } catch (notificationError) {
        console.error("Unable to send contact notification", notificationError);
      }
    }
  }

  res.status(201).json({ ok: true });
};
