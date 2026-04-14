import { supabase } from "@/integrations/supabase/client";

export async function sendAdminPushNotification(
  title: string,
  body: string,
  url?: string,
  tag?: string
) {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: { title, body, url: url || "/admin", tag: tag || "notification" },
    });
  } catch (err) {
    console.error("Failed to send push notification:", err);
  }
}
