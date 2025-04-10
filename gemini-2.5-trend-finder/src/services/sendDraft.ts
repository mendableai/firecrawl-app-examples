import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function sendDraftToDiscord(draft_post: string) {
  try {
    const response = await axios.post(
      process.env.DISCORD_WEBHOOK_URL || '',
      {
        content: draft_post,
        flags: 4 // SUPPRESS_EMBEDS
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return `Success sending draft to Discord webhook at ${new Date().toISOString()}`;
  } catch (error) {
    console.log('Error sending draft to Discord webhook');
    console.error(error);
    throw error;
  }
}

export async function sendDraft(draft_post: string) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error("SLACK_WEBHOOK_URL is not defined.");
    }

    const response = await axios.post(
      webhookUrl,
      {
        text: draft_post,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return `Success sending draft to webhook at ${new Date().toISOString()}`;
  } catch (error) {
    console.log("error sending draft to webhook");
    console.log(error);
  }
}
