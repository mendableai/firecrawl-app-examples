import time
import json
import os
from datetime import datetime, timedelta
from threading import Thread
from typing import Callable, Dict, Any
import pickle


class Scheduler:
    """Simple scheduler for running tasks at specified intervals"""

    def __init__(self):
        self.running = False
        self.thread = None
        self.last_run_time = None
        self.scheduled_time = None
        self.state_file = "scheduler_state.pkl"
        self._load_state()

    def _load_state(self):
        """Load scheduler state from file if it exists"""
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, "rb") as f:
                    state = pickle.load(f)
                    self.last_run_time = state.get("last_run_time")
                    self.scheduled_time = state.get("scheduled_time")
        except:
            self.last_run_time = None
            self.scheduled_time = None

    def _save_state(self):
        """Save scheduler state to file"""
        try:
            state = {
                "last_run_time": self.last_run_time,
                "scheduled_time": self.scheduled_time,
            }
            with open(self.state_file, "wb") as f:
                pickle.dump(state, f)
        except:
            pass

    def start(self, task: Callable, frequency: str, time_of_day: str = "09:00"):
        """Start the scheduler with the specified task and frequency"""
        if self.running:
            return False

        self.running = True
        self.thread = Thread(
            target=self._run_scheduler, args=(task, frequency, time_of_day)
        )
        self.thread.daemon = True
        self.thread.start()
        return True

    def stop(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            self.thread = None
        return True

    def _run_scheduler(self, task: Callable, frequency: str, time_of_day: str):
        """Run the scheduler loop"""
        while self.running:
            # Determine if we need to run the task
            now = datetime.now()

            # Set the scheduled time if not already set
            if not self.scheduled_time:
                self.scheduled_time = self._calculate_next_run_time(
                    frequency, time_of_day
                )
                self._save_state()

            # Check if it's time to run
            if now >= self.scheduled_time:
                # Run the task
                try:
                    task()
                    self.last_run_time = now

                    # Calculate the next run time
                    self.scheduled_time = self._calculate_next_run_time(
                        frequency, time_of_day
                    )

                    # Save state
                    self._save_state()
                except Exception as e:
                    print(f"Error running scheduled task: {str(e)}")

            # Sleep for a bit before checking again
            time.sleep(10)

    def _calculate_next_run_time(self, frequency: str, time_of_day: str) -> datetime:
        """Calculate the next run time based on frequency and time of day"""
        now = datetime.now()

        if frequency == "hourly":
            # Run at the next hour
            next_run = now.replace(minute=0, second=0, microsecond=0) + timedelta(
                hours=1
            )

        elif frequency == "daily":
            # Parse time of day
            try:
                hour, minute = map(int, time_of_day.split(":"))
                next_run = now.replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )
                if next_run <= now:
                    next_run += timedelta(days=1)
            except:
                # Default to 9:00 AM tomorrow if time format is invalid
                next_run = now.replace(hour=9, minute=0, second=0, microsecond=0)
                if next_run <= now:
                    next_run += timedelta(days=1)

        elif frequency == "weekly":
            # Run on Monday at the specified time
            try:
                hour, minute = map(int, time_of_day.split(":"))
                next_run = now.replace(
                    hour=hour, minute=minute, second=0, microsecond=0
                )

                # If today is not Monday (0) or it's already past the time, go to next Monday
                days_until_monday = (7 - now.weekday()) % 7
                if days_until_monday == 0 and next_run <= now:
                    days_until_monday = 7

                next_run += timedelta(days=days_until_monday)
            except:
                # Default to Monday 9:00 AM if time format is invalid
                next_run = now.replace(hour=9, minute=0, second=0, microsecond=0)
                days_until_monday = (7 - now.weekday()) % 7
                if days_until_monday == 0 and next_run <= now:
                    days_until_monday = 7

                next_run += timedelta(days=days_until_monday)

        else:
            # Default to running once a day
            next_run = now + timedelta(days=1)

        return next_run

    def get_next_run_info(self) -> Dict[str, Any]:
        """Get information about the next scheduled run"""
        if not self.scheduled_time:
            return {"scheduled": False, "message": "No task scheduled"}

        now = datetime.now()
        time_until = self.scheduled_time - now

        return {
            "scheduled": True,
            "next_run": self.scheduled_time.strftime("%Y-%m-%d %H:%M:%S"),
            "last_run": (
                self.last_run_time.strftime("%Y-%m-%d %H:%M:%S")
                if self.last_run_time
                else None
            ),
            "time_until": str(time_until).split(".")[0],  # Format as HH:MM:SS
        }
