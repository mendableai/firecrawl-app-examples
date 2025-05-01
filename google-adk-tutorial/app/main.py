import os
import asyncio
from dotenv import load_dotenv
import argparse
from google.genai import types

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner

from weather_agent_team.agent import root_agent

# Load environment variables from .env file
load_dotenv()

APP_NAME = "weather_agent_team_app"
USER_ID = "user_1"
SESSION_ID = "session_001"


async def call_agent_async(query: str, runner, user_id, session_id):
    """Sends a query to the agent and prints the final response."""
    print(f"\n>>> User Query: {query}")

    # Prepare the user's message in ADK format
    content = types.Content(role="user", parts=[types.Part(text=query)])

    final_response_text = "Agent did not produce a final response."  # Default

    # Key Concept: run_async executes the agent logic and yields Events.
    # We iterate through events to find the final answer.
    async for event in runner.run_async(
        user_id=user_id, session_id=session_id, new_message=content
    ):
        # You can uncomment the line below to see *all* events during execution
        # print(f"  [Event] Author: {event.author}, Type: {type(event).__name__}, Final: {event.is_final_response()}, Content: {event.content}")

        # Key Concept: is_final_response() marks the concluding message for the turn.
        if event.is_final_response():
            if event.content and event.content.parts:
                # Assuming text response in the first part
                final_response_text = event.content.parts[0].text
            elif (
                event.actions and event.actions.escalate
            ):  # Handle potential errors/escalations
                final_response_text = (
                    f"Agent escalated: {event.error_message or 'No specific message.'}"
                )
            # Add more checks here if needed (e.g., specific error codes)
            break  # Stop processing events once the final response is found

    print(f"<<< Agent Response: {final_response_text}")
    return final_response_text


async def interactive_session(runner, user_id, session_id):
    """Run an interactive session with the agent."""
    print("\n===== Weather Agent Team Interactive Session =====")
    print("Type 'exit' or 'quit' to end the session.")
    print("Available test commands:")
    print(
        " - Weather queries: 'What's the weather in London?', 'Weather in New York', etc."
    )
    print(" - Greetings: 'Hello', 'Hi there', etc.")
    print(" - Farewells: 'Goodbye', 'Bye', etc.")
    print(" - Blocked keyword: Try including 'BLOCK' in your message")
    print(" - Blocked city: Try asking about weather in 'Paris'")
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
    parser = argparse.ArgumentParser(description="Run the Weather Agent Team")
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
