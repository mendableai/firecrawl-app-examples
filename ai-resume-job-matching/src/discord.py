from discord_webhook import DiscordWebhook, DiscordEmbed
from .models import Job
import os


class DiscordNotifier:
    def __init__(self):
        self.webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    async def send_match(self, job: Job, match_reason: str):
        """Send a job match notification to Discord"""
        if not self.webhook_url:
            return

        webhook = DiscordWebhook(url=self.webhook_url)
        embed = DiscordEmbed(
            title=f"🎯 New Job Match Found!",
            description=f"**{job.title}** at **{job.company}**\n\n{match_reason}",
            color="5865F2",
        )

        # Add fields with job details
        embed.add_embed_field(name="🏢 Company", value=job.company, inline=True)
        embed.add_embed_field(
            name="🔗 Job URL", value=f"[Apply Here]({job.url})", inline=True
        )

        webhook.add_embed(embed)
        webhook.execute()
