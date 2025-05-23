#!/usr/bin/env python
import os
from crewai_chatgpt_clone.crew import ChatgptCloneCrew

os.makedirs("output", exist_ok=True)


def run():
    """Run the ChatGPT clone crew."""
    user_query = "Generate me a loooooong poem in the style of Alisher Navoi."
    print(f"Running crew with user input: {user_query}")

    inputs = {"user_input": user_query}
    crew_instance = ChatgptCloneCrew()
    result = crew_instance.crew().kickoff(inputs=inputs)

    # Print the result (assuming result has a .raw attribute or is a string)
    print("\n\n=== CREW RESPONSE ===\n\n")
    if hasattr(result, "raw"):
        print(result.raw)
    else:
        print(result)  # Fallback if no .raw attribute


if __name__ == "__main__":
    run()
