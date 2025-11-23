# OpenAI Integration Guide

## Overview

Your task management platform now has OpenAI integration with four key features:

1. **Text Correction/Translation** - Correct, improve, or translate text
2. **Description Generation** - Automatically generate descriptions for tasks and events
3. **Event Scheduling** - Schedule events from natural language descriptions
4. **Reminder Setting** - Set reminders from natural language descriptions

## Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy the key (it starts with `sk-`)

### 2. Add API Key to Environment Variables

Create or update your `.env.local` file in the root of your project:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Important:** Never commit this file to version control! It's already in `.gitignore`.

### 3. Restart Development Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

### 1. Text Helper (Correct/Improve/Translate)

**Location:** Task summary and event title fields

**Features:**
- **Correct:** Fixes spelling, grammar, and punctuation errors
- **Improve:** Enhances text clarity and professionalism
- **Translate:** Translates to multiple languages (Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Russian, Arabic)

**How to Use:**
1. Type text in the task summary or event title field
2. Click the sparkles (✨) button next to the field
3. Select an action (Correct, Improve, or Translate)
4. If translating, select the target language
5. Click "Apply" to process
6. Use "Revert" to undo changes

### 2. Description Generator

**Location:** Task and event description fields

**Features:**
- Generates professional descriptions based on the title
- Context-aware (understands if it's a task or event)
- 2-4 sentences, professional and actionable

**How to Use:**
1. Enter a title for your task or event
2. Click "Generate with AI" button next to the description field
3. The AI will generate a description based on the title
4. You can edit or use it as-is

### 3. Event Scheduler

**Location:** Event creation dialog (at the top)

**Features:**
- Parses natural language event descriptions
- Extracts date, time, location, and other details
- Supports relative dates (e.g., "tomorrow", "next Monday")
- Auto-fills the event form

**How to Use:**
1. In the event creation dialog, find "Or schedule with AI"
2. Type a natural language description, e.g.:
   - "Team meeting tomorrow at 2pm in the conference room"
   - "Dentist appointment next Friday at 10am"
   - "All-day conference on December 15th"
3. Click "Schedule"
4. The form will be automatically filled with the parsed details

**Example Descriptions:**
- "Team meeting tomorrow at 2pm in conference room A"
- "Doctor appointment next Tuesday at 3:30pm"
- "Company holiday party on December 20th from 6pm to 10pm at the main office"

### 4. Reminder Setter

**Location:** Task creation dialog (appears when due date is set)

**Features:**
- Sets reminders from natural language
- Understands relative times (e.g., "30 minutes before", "tomorrow at 9am")
- Automatically calculates reminder times based on task due dates

**How to Use:**
1. Create a task with a due date
2. Scroll down to "Set Reminder" section
3. Type a reminder description, e.g.:
   - "30 minutes before"
   - "1 hour before"
   - "Tomorrow at 9am"
   - "At the time"
4. Click "Set"
5. The reminder will be configured (currently logs to console - you can implement notification logic)

**Example Reminder Descriptions:**
- "Remind me 30 minutes before"
- "15 minutes before deadline"
- "1 hour before"
- "Tomorrow at 8am"

## API Endpoints

### `/api/ai/text` (POST)
Text correction, improvement, and translation

**Request:**
```json
{
  "text": "Thsi is a test",
  "action": "correct",  // or "improve" or "translate"
  "targetLanguage": "Spanish"  // required if action is "translate"
}
```

**Response:**
```json
{
  "success": true,
  "result": "This is a test",
  "originalText": "Thsi is a test"
}
```

### `/api/ai/description` (POST)
Generate descriptions for tasks or events

**Request:**
```json
{
  "title": "Implement user authentication",
  "context": "Web application development",
  "type": "task"  // or "event"
}
```

**Response:**
```json
{
  "success": true,
  "description": "Implement secure user authentication system..."
}
```

### `/api/ai/schedule-event` (POST)
Parse natural language and extract event details

**Request:**
```json
{
  "description": "Team meeting tomorrow at 2pm in the conference room",
  "context": "Optional additional context"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "title": "Team meeting",
    "startDate": "2024-01-15",
    "startTime": "14:00",
    "allDay": false,
    "location": "conference room"
  }
}
```

### `/api/ai/reminder` (POST)
Set reminders from natural language

**Request:**
```json
{
  "description": "30 minutes before",
  "taskTitle": "Complete project",
  "dueDate": "2024-01-15T10:00:00Z",
  "context": "Optional context"
}
```

**Response:**
```json
{
  "success": true,
  "reminder": {
    "reminderTime": "2024-01-15T09:30:00Z",
    "message": "Reminder: Complete project is due soon",
    "type": "before",
    "minutesBefore": 30
  }
}
```

## Cost Considerations

OpenAI API usage is based on tokens:

- **GPT-3.5 Turbo** (used for text correction/description): ~$0.50 per 1M input tokens, $1.50 per 1M output tokens
- **GPT-4 Turbo** (used for event/reminder parsing): ~$10 per 1M input tokens, $30 per 1M output tokens

**Tips to reduce costs:**
1. Use caching for common queries
2. Implement rate limiting per user
3. Consider using GPT-3.5 for simple corrections instead of GPT-4
4. Set usage limits per user/space

## Security

1. **API Key Protection**: Never expose your API key in client-side code
2. **Authentication**: All endpoints require user authentication
3. **Rate Limiting**: Consider implementing rate limiting (recommended)
4. **Input Validation**: All inputs are validated before processing
5. **Error Handling**: Errors are handled gracefully without exposing sensitive information

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you've added `OPENAI_API_KEY` to your `.env.local` file
- Restart your development server after adding the key
- Check that the key starts with `sk-`

### "Failed to process text"
- Check your API key is valid and has credits
- Check your internet connection
- Verify OpenAI API is operational (check status.openai.com)

### High costs
- Implement rate limiting
- Add caching for repeated queries
- Consider using GPT-3.5 instead of GPT-4 where appropriate

## Future Enhancements

- [ ] Add caching for common queries
- [ ] Implement rate limiting
- [ ] Add usage tracking and limits
- [ ] Support more languages for translation
- [ ] Add voice input for event scheduling
- [ ] Implement actual reminder notifications
- [ ] Add batch processing for multiple tasks

## Support

For issues or questions:
1. Check the OpenAI API status: https://status.openai.com
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check your API usage dashboard: https://platform.openai.com/usage











