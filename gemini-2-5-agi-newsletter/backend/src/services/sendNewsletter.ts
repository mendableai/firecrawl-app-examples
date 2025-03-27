import dotenv from "dotenv";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsletter(newsletter: string, rawStories: string) {
  console.log("Starting newsletter send process...");
  console.log("Resend API Key present:", !!process.env.RESEND_API_KEY);
  console.log("Newsletter content:", newsletter);
  if (newsletter.length <= 750) {
    console.log("Newsletter is too short to send. See newsletter below:");
    console.log(newsletter);
    console.log("Raw stories below:");
    console.log(rawStories);
    return "Newsletter not sent due to insufficient length.";
  }

  if (!newsletter || newsletter.startsWith("??")) {
    console.error("Invalid newsletter format detected");
    return "Newsletter not sent due to invalid format.";
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );
    const batchSize = 50;
    let start = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: subscribers, error } = await supabase
        .from("users")
        .select("email")
        .range(start, start + batchSize - 1);

      if (error) {
        throw new Error(`Failed to fetch subscribers: ${error.message}`);
      }

      if (subscribers.length < batchSize) {
        hasMore = false;
      }

      console.log(`Sending newsletter to ${subscribers.length} subscribers`);

      for (const subscriber of subscribers) {
        try {
          console.log(`Attempting to send to: ${subscriber.email}`);
          const unsubscribe_link = `https://www.aginews.io/api/unsubscribe?email=${subscriber.email}`;

          const emailResult = await resend.emails.send({
            from: "AGI News <newsletter@resend.dev>",
            to: subscriber.email,
            subject: "AGI News – Your Quick Daily Roundup",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${newsletter}
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  <a href="${unsubscribe_link}" style="color: #666; text-decoration: underline;">Unsubscribe</a>
                </p>
              </div>
            `,
          });

          console.log(
            `Email sent successfully to ${subscriber.email}`,
            emailResult,
          );
        } catch (emailError) {
          console.error(`Failed to send to ${subscriber.email}:`, emailError);
        }
      }

      start += batchSize;
    }
    return "Success sending newsletter on " + new Date().toISOString();
  } catch (error) {
    console.log("error generating newsletter");
  }
}
