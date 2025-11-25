"""
MCP (Model Context Protocol) Integration for Wellness Agent
Real Notion and Todoist API integration with auto-database creation
"""
import os
import json
from typing import Optional, List, Dict
from datetime import datetime
from pathlib import Path
import requests
from notion_client import Client as NotionClient
from todoist_api_python.api import TodoistAPI

class MCPIntegration:
    """Handles MCP connections to Notion and Todoist with real API calls"""
    
    def __init__(self):
        self.notion_token = os.getenv("NOTION_API_TOKEN")
        self.notion_database_id = os.getenv("NOTION_DATABASE_ID")
        self.todoist_token = os.getenv("TODOIST_API_TOKEN")
        
        # Initialize clients
        self.notion = NotionClient(auth=self.notion_token) if self.notion_token else None
        self.todoist = TodoistAPI(self.todoist_token) if self.todoist_token else None
        
    def _ensure_notion_database(self) -> Optional[str]:
        """
        Ensure Notion database exists, create if not
        Returns database_id or None
        """
        if not self.notion:
            return None
            
        # If database ID is provided, verify it exists
        if self.notion_database_id:
            try:
                self.notion.databases.retrieve(self.notion_database_id)
                return self.notion_database_id
            except Exception:
                print(f"Database {self.notion_database_id} not found, will create new one")
        
        # Create new database
        try:
            # First, get the user's workspace to create database
            # We'll create it in a new page
            parent_page = self.notion.search(filter={"property": "object", "value": "page"}).get("results", [])
            
            if not parent_page:
                # Create in workspace root
                parent = {"type": "page_id", "page_id": "workspace"}
            else:
                parent = {"type": "page_id", "page_id": parent_page[0]["id"]}
            
            database = self.notion.databases.create(
                parent=parent,
                title=[{"type": "text", "text": {"content": "Daily Wellness Log"}}],
                properties={
                    "Name": {"title": {}},
                    "Date": {"date": {}},
                    "User": {"rich_text": {}},
                    "Mood": {"rich_text": {}},
                    "Goals": {"multi_select": {}},
                    "Summary": {"rich_text": {}}
                }
            )
            
            new_db_id = database["id"]
            print(f"✅ Created Notion database: {new_db_id}")
            
            # Save to env for future use
            env_path = Path(__file__).parent.parent / ".env.local"
            if env_path.exists():
                with open(env_path, "r") as f:
                    env_content = f.read()
                
                if "NOTION_DATABASE_ID" in env_content:
                    # Update existing
                    lines = env_content.split("\n")
                    for i, line in enumerate(lines):
                        if line.startswith("NOTION_DATABASE_ID"):
                            lines[i] = f"NOTION_DATABASE_ID={new_db_id}"
                    env_content = "\n".join(lines)
                else:
                    # Add new
                    env_content += f"\nNOTION_DATABASE_ID={new_db_id}\n"
                
                with open(env_path, "w") as f:
                    f.write(env_content)
            
            self.notion_database_id = new_db_id
            return new_db_id
            
        except Exception as e:
            print(f"❌ Failed to create Notion database: {e}")
            return None
    
    async def create_notion_wellness_entry(
        self,
        date: str,
        user_name: str,
        mood: str,
        goals: List[str],
        summary: str
    ) -> Dict:
        """Create a Notion page for a wellness check-in"""
        if not self.notion:
            return {
                "status": "error",
                "message": "Notion not configured. Set NOTION_API_TOKEN in .env.local"
            }
        
        # Ensure database exists
        db_id = self._ensure_notion_database()
        if not db_id:
            return {
                "status": "error",
                "message": "Could not create/find Notion database"
            }
        
        try:
            # Create page in database
            page = self.notion.pages.create(
                parent={"database_id": db_id},
                properties={
                    "Name": {
                        "title": [{"text": {"content": f"{user_name}'s Check-in - {date}"}}]
                    },
                    "Date": {
                        "date": {"start": datetime.now().isoformat()}
                    },
                    "User": {
                        "rich_text": [{"text": {"content": user_name}}]
                    },
                    "Mood": {
                        "rich_text": [{"text": {"content": mood}}]
                    },
                    "Goals": {
                        "multi_select": [{"name": goal[:100]} for goal in goals[:5]]  # Limit to 5 goals, 100 chars each
                    },
                    "Summary": {
                        "rich_text": [{"text": {"content": summary}}]
                    }
                }
            )
            
            return {
                "status": "success",
                "message": f"Created wellness entry in Notion",
                "page_id": page["id"],
                "url": page["url"]
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to create Notion entry: {str(e)}"
            }
    
    async def create_todoist_tasks(
        self,
        goals: List[str],
        user_name: str = "Wellness",
        project_name: str = "Wellness Goals"
    ) -> Dict:
        """Create Todoist tasks from wellness goals"""
        if not self.todoist:
            return {
                "status": "error",
                "message": "Todoist not configured. Set TODOIST_API_TOKEN in .env.local"
            }
        
        try:
            # Find or create project
            projects = self.todoist.get_projects()
            project = next((p for p in projects if p.name == project_name), None)
            
            if not project:
                # Create project
                project = self.todoist.add_project(name=project_name)
                print(f"✅ Created Todoist project: {project_name}")
            
            # Create tasks
            created_tasks = []
            for goal in goals:
                task = self.todoist.add_task(
                    content=goal,
                    project_id=project.id,
                    labels=[user_name] if user_name != "Wellness" else []
                )
                created_tasks.append({
                    "id": task.id,
                    "content": task.content,
                    "url": task.url
                })
            
            return {
                "status": "success",
                "message": f"Created {len(created_tasks)} tasks in '{project_name}'",
                "tasks": created_tasks,
                "project_url": f"https://todoist.com/app/project/{project.id}"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to create Todoist tasks: {str(e)}"
            }
    
    async def mark_todoist_task_complete(
        self,
        task_id: str
    ) -> Dict:
        """Mark a Todoist task as complete"""
        if not self.todoist:
            return {
                "status": "error",
                "message": "Todoist not configured"
            }
        
        try:
            self.todoist.close_task(task_id=task_id)
            return {
                "status": "success",
                "message": f"Task {task_id} marked as complete"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to complete task: {str(e)}"
            }


# Singleton instance
mcp_client = MCPIntegration()
