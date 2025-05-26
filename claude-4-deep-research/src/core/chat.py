"""
Chat functionality and Claude interactions
"""

import json
import time
from typing import Dict, Any, List, Generator
from .clients import ClientManager
from .research import ResearchEngine


class ChatEngine:
    """Handles chat interactions with Claude and tool usage."""

    def __init__(self, client_manager: ClientManager, research_engine: ResearchEngine):
        self.client_manager = client_manager
        self.research_engine = research_engine

    def get_response_with_tools(
        self, messages: List[Dict], tools: List[Dict] = None
    ) -> str:
        """Get response from Claude with tool support (non-streaming for tool handling)."""
        client = self.client_manager.get_anthropic_client()

        try:
            # Create the message request
            request_params = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 4000,
                "messages": messages,
            }

            if tools:
                request_params["tools"] = tools

            # Get response
            response = client.messages.create(**request_params)

            # Check if Claude wants to use a tool
            if response.content and len(response.content) > 0:
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_name = content_block.name
                        tool_input = content_block.input
                        tool_id = content_block.id

                        if tool_name == "deep_research":
                            # Execute deep research
                            research_result = self.research_engine.execute_research(
                                **tool_input
                            )

                            # Create new messages with tool result
                            new_messages = messages + [
                                {"role": "assistant", "content": response.content},
                                {
                                    "role": "user",
                                    "content": [
                                        {
                                            "type": "tool_result",
                                            "tool_use_id": tool_id,
                                            "content": json.dumps(research_result),
                                        }
                                    ],
                                },
                            ]

                            # Get final response with tool results
                            final_response = client.messages.create(
                                model="claude-3-5-sonnet-20241022",
                                max_tokens=4000,
                                messages=new_messages,
                            )

                            return (
                                final_response.content[0].text
                                if final_response.content
                                else "No response generated."
                            )

            # Return regular response if no tools used
            return (
                response.content[0].text
                if response.content
                else "No response generated."
            )

        except Exception as e:
            return f"❌ **Error:** {str(e)}"

    def stream_text_response(
        self, text: str, delay: float = 0.02
    ) -> Generator[str, None, None]:
        """Stream text character by character for typewriter effect."""
        for char in text:
            yield char
            time.sleep(delay)

    def prepare_claude_messages(
        self, session_messages: List[Dict], welcome_content: str
    ) -> List[Dict]:
        """Prepare messages for Claude by filtering out welcome message."""
        claude_messages = []
        for msg in session_messages:
            if (
                msg["role"] in ["user", "assistant"]
                and msg.get("content") != welcome_content
            ):
                claude_messages.append({"role": msg["role"], "content": msg["content"]})
        return claude_messages
