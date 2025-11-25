import pytest
import json
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add backend/src to python path
sys.path.append(str(Path(__file__).resolve().parent.parent / "src"))

from agent import Assistant

# Path to wellness_log.json in project root
# backend/tests/test_wellness.py -> backend/tests -> backend -> project_root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
WELLNESS_LOG_PATH = PROJECT_ROOT / "wellness_log.json"

# Helper to clean up test file
@pytest.fixture
def clean_wellness_log():
    if WELLNESS_LOG_PATH.exists():
        os.remove(WELLNESS_LOG_PATH)
    yield
    if WELLNESS_LOG_PATH.exists():
        os.remove(WELLNESS_LOG_PATH)

@pytest.mark.asyncio
async def test_save_checkin(clean_wellness_log):
    agent = Assistant()
    ctx = MagicMock()
    
    result = await agent.save_checkin(
        ctx, 
        mood="Feeling great", 
        goals=["Run 5k", "Drink water"], 
        summary="User is happy and active."
    )
    
    assert "saved" in result.lower()
    
    # Verify file content
    assert WELLNESS_LOG_PATH.exists()
    with open(WELLNESS_LOG_PATH, "r") as f:
        data = json.load(f)
        
    assert len(data) == 1
    assert data[0]["mood"] == "Feeling great"
    assert data[0]["goals"] == ["Run 5k", "Drink water"]

@pytest.mark.asyncio
async def test_get_history_empty(clean_wellness_log):
    agent = Assistant()
    history = agent._get_history_context()
    assert "No previous check-ins found" in history

@pytest.mark.asyncio
async def test_get_history_with_data(clean_wellness_log):
    # Create dummy data
    entry = {
        "timestamp": 1234567890,
        "date": "2025-01-01",
        "mood": "Tired",
        "goals": ["Sleep"],
        "summary": "User needs rest."
    }
    with open(WELLNESS_LOG_PATH, "w") as f:
        json.dump([entry], f)
        
    agent = Assistant()
    history = agent._get_history_context()
    
    assert "User needs rest" in history
    assert "Tired" in history
