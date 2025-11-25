from livekit.plugins import murf
import inspect
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env.local"
load_dotenv(dotenv_path=env_path)

voices_to_test = ["en-US-matthew", "en-US-alicia", "en-US-ken"]

try:
    tts = murf.TTS(voice="en-US-matthew", style="Conversation")
    print("TTS Initialized.")
    
    for voice in voices_to_test:
        print(f"Testing voice: {voice}")
        try:
            tts.update_options(voice=voice)
            print(f"Success: {voice}")
        except Exception as e:
            print(f"FAILED: {voice} - Error: {e}")

except Exception as e:
    print(f"Fatal Error: {e}")
