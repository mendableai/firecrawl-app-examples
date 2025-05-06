import os
import asyncio
import base64
import io
from PIL import Image
from dotenv import load_dotenv
import argparse
from google.genai import types

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

from chatgpt_agentic_clone.agent import root_agent

# Load environment variables from .env file
load_dotenv()

APP_NAME = "chatgpt_agentic_clone_app"
USER_ID = "user_1"
SESSION_ID = "session_001"


async def call_agent_async(query: str, runner, user_id, session_id):
    """Sends a query to the agent and processes the final response."""
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."  # Default
    image_data = None

    # Run the agent and process events
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        # You can uncomment the line below to see all events
        # print(f"  [Event] Type: {type(event).__name__}, Final: {event.is_final_response()}")

        # Process the final response
        if event.is_final_response():
            if event.content and event.content.parts:
                # Extract text and check for special content markers
                response_text = event.content.parts[0].text

                # Check if the response contains a base64 image
                if "[[IMAGE_DATA:" in response_text:
                    # Extract the image data
                    start_marker = "[[IMAGE_DATA:"
                    end_marker = "]]"
                    start_idx = response_text.find(start_marker) + len(start_marker)
                    end_idx = response_text.find(end_marker, start_idx)

                    if start_idx > len(start_marker) - 1 and end_idx > start_idx:
                        # Get the base64 data
                        image_data = response_text[start_idx:end_idx].strip()

                        # Remove the image data marker from the text response
                        response_text = (
                            response_text[: start_idx - len(start_marker)]
                            + "[Image Generated]"
                            + response_text[end_idx + len(end_marker) :]
                        )

                final_response_text = response_text
            elif event.actions and event.actions.escalate:
                final_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )

            break  # Stop processing events once the final response is found

    # Print the response and display image if available
    print(f"<<< Agent Response: {final_response_text}")

    if image_data:
        try:
            print(
                "\n[Image was generated. In a GUI application, this would be displayed to the user.]"
            )
            # The following code would be used in a GUI environment to display the image
            # image_bytes = base64.b64decode(image_data)
            # image = Image.open(io.BytesIO(image_bytes))
            # image.show()
        except Exception as e:
            print(f"Error processing image: {e}")

    return {"text": final_response_text, "image_data": image_data}


async def interactive_session(runner, user_id, session_id):
    """Run an interactive session with the agent."""
    print("\n===== ChatGPT-Like Agentic Clone =====")
    print("Type 'exit' or 'quit' to end the session.")
    print("Example commands:")
    print(
        " - General knowledge: 'Who was Marie Curie?', 'How does photosynthesis work?'"
    )
    print(
        " - Current info: 'What's the weather in London right now?', 'Latest news about AI'"
    )
    print(" - Web extraction: 'Extract content from https://example.com'")
    print(" - Research: 'Do deep research on quantum computing advances'")
    print(" - Image: 'Generate an image of a cat playing piano'")
    print("========================================")

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if user_input.lower() in ["exit", "quit"]:
                print("Ending session. Goodbye!")
                break

            await call_agent_async(user_input, runner, user_id, session_id)

        except KeyboardInterrupt:
            print("\nSession interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Run the ChatGPT-like Agentic Clone")
    parser.add_argument(
        "--session-id",
        type=str,
        default=SESSION_ID,
        help=f"Session ID (default: {SESSION_ID})",
    )
    parser.add_argument(
        "--user-id", type=str, default=USER_ID, help=f"User ID (default: {USER_ID})"
    )

    args = parser.parse_args()

    # Session Service for managing conversation history and state
    session_service = InMemorySessionService()

    # Create the specific session where the conversation will happen
    session = session_service.create_session(
        app_name=APP_NAME, user_id=args.user_id, session_id=args.session_id
    )
    print(
        f"Session created: App='{APP_NAME}', User='{args.user_id}', Session='{args.session_id}'"
    )

    # Runner for orchestrating the agent execution
    runner = Runner(
        agent=root_agent, app_name=APP_NAME, session_service=session_service
    )
    print(f"Runner created for agent '{runner.agent.name}'.")

    # Run interactive session
    try:
        asyncio.run(interactive_session(runner, args.user_id, args.session_id))
    except KeyboardInterrupt:
        print("\nApplication interrupted. Exiting...")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
