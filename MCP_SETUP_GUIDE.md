# MCP Setup Guide for Tata 1mg Wellness Companion

This guide will help you set up Notion and Todoist API credentials for full MCP integration.

## Prerequisites

- A Notion account (free is fine)
- A Todoist account (free is fine)

---

## Step 1: Set Up Notion Integration

### 1.1 Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Fill in:
   - **Name**: `Tata 1mg Wellness Companion`
   - **Associated workspace**: Select your workspace
   - **Type**: Internal integration
4. Click **"Submit"**
5. Copy the **"Internal Integration Token"** (starts with `secret_...`)

### 1.2 Create a Wellness Database

1. In Notion, create a new page called **"Daily Wellness Log"**
2. Add a database with these properties:
   - **Date** (Date type)
   - **Mood** (Text type)
   - **Goals** (Multi-select or Text type)
   - **Summary** (Text type)
3. Share the database with your integration:
   - Click **"..."** (top right of the database)
   - Click **"Add connections"**
   - Select your **"Tata 1mg Wellness Companion"** integration
4. Copy the **Database ID** from the URL:
   - URL format: `https://notion.so/workspace/{database_id}?v=...`
   - The `database_id` is the 32-character string after your workspace name

---

## Step 2: Set Up Todoist API

### 2.1 Get Todoist API Token

1. Go to [https://todoist.com/prefs/integrations](https://todoist.com/prefs/integrations)
2. Scroll to **"API token"**
3. Copy your API token

### 2.2 Create a Wellness Project (Optional)

1. In Todoist, create a new project called **"Wellness Goals"**
2. This is where your daily goals will be added as tasks

---

## Step 3: Configure Environment Variables

1. Open `backend/.env.local` in your editor
2. Add these lines:

```bash
# Notion Configuration
NOTION_API_TOKEN=secret_your_token_here
NOTION_DATABASE_ID=your_database_id_here

# Todoist Configuration
TODOIST_API_TOKEN=your_todoist_token_here
```

3. Replace the placeholder values with your actual tokens

---

## Step 4: Restart the Application

```bash
# Stop the current app (Ctrl+C in terminal)
# Then restart:
./start_app.sh
```

---

## Step 5: Test MCP Integration

Once everything is configured, during a wellness check-in you can say:

### Save to Notion
**User**: "Can you save this to Notion?"
**Agent**: *Creates a new entry in your Notion database*

### Create Todoist Tasks
**User**: "Create these goals as Todoist tasks"
**Agent**: *Adds each goal as a task in Todoist*

---

## Troubleshooting

### "Notion credentials not configured"
- Double-check that `NOTION_API_TOKEN` and `NOTION_DATABASE_ID` are in `.env.local`
- Make sure there are no extra spaces or quotes
- Restart the backend

### "Todoist credentials not configured"
- Verify `TODOIST_API_TOKEN` is in `.env.local`
- Token should be a long string without `secret_` prefix (unlike Notion)

### Database not updating
- Ensure the Notion integration is **connected to your database**
- Check that the Database ID is correct (32 characters, no dashes)

---

## Next Steps

Once configured, your wellness companion can:
- ✅ Automatically log check-ins to Notion
- ✅ Create actionable tasks in Todoist
- ✅ Keep your wellness data synced across platforms

Enjoy your enhanced wellness tracking! 🎉
