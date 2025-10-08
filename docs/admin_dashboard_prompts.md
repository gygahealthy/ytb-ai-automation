# Admin Dashboard for Master Prompts

This documentation describes the admin dashboard system created for managing master prompts across different AI services.

## Overview

The admin dashboard allows administrators to configure master prompts for:
1. YouTube/TikTok video analysis
2. YouTube channel analysis  
3. AI video creation (Veo3, OpenAI, etc.)

Each prompt can include dynamic variables using the `[VARIABLE_NAME]` syntax, which will automatically generate input fields in the UI.

## Files Created

### Frontend (React)

#### Pages
- `src/renderer/pages/AdminPage.tsx` - Main admin dashboard with cards for each prompt category
- `src/renderer/pages/admin/PlatformAnalysisPromptsPage.tsx` - Manage YouTube/TikTok analysis prompts
- `src/renderer/pages/admin/ChannelAnalysisPromptsPage.tsx` - Manage YouTube channel analysis prompts
- `src/renderer/pages/admin/VideoCreationPromptsPage.tsx` - Manage AI video creation prompts

#### Routes Added to `App.tsx`
```tsx
<Route path="/admin" element={<AdminPage />} />
<Route path="/admin/prompts/platform-analysis" element={<PlatformAnalysisPromptsPage />} />
<Route path="/admin/prompts/channel-analysis" element={<ChannelAnalysisPromptsPage />} />
<Route path="/admin/prompts/video-creation" element={<VideoCreationPromptsPage />} />
```

#### Sidebar Updated
Added "Admin" menu item with Shield icon to `src/renderer/components/Sidebar.tsx`

### Backend (Electron Main Process)

#### Database Schema
Added to `src/main/storage/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS master_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL, -- 'youtube', 'tiktok', 'veo3', 'openai', etc.
  prompt_kind TEXT NOT NULL, -- 'video_analysis', 'channel_analysis', 'video_creation', etc.
  prompt_template TEXT NOT NULL, -- The actual prompt with [VARIABLE] placeholders
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, prompt_kind)
);
```

#### Repository
- `src/main/storage/repositories/master-prompts.repository.ts` - Database operations for master prompts
  - `getAll()` - Get all prompts
  - `getById(id)` - Get prompt by ID
  - `getByProvider(provider)` - Get prompts by provider (youtube, tiktok, etc.)
  - `getByKind(kind)` - Get prompts by kind (video_analysis, channel_analysis, etc.)
  - `create(input)` - Create new prompt
  - `update(id, updates)` - Update existing prompt
  - `delete(id)` - Delete prompt
  - `extractVariables(template)` - Extract [VARIABLE] names from template
  - `populateTemplate(template, variables)` - Replace variables with actual values

#### IPC Handlers
- `src/main/handlers/master-prompts.handlers.ts` - IPC handlers for all master prompt operations
- Registered in `src/main/handlers/index.ts`

#### Preload API
Added to `src/main/preload.ts`:
```typescript
masterPrompts: {
  getAll: () => Promise<any>;
  getById: (id: number) => Promise<any>;
  getByProvider: (provider: string) => Promise<any>;
  getByKind: (kind: string) => Promise<any>;
  create: (prompt: any) => Promise<any>;
  update: (id: number, prompt: any) => Promise<any>;
  delete: (id: number) => Promise<any>;
}
```

### TypeScript Types
- Updated `src/renderer/types/electron-api.d.ts` with masterPrompts interface

## Usage

### Accessing the Admin Dashboard
1. Click "Admin" in the sidebar (Shield icon)
2. Choose which type of prompts to manage:
   - **Video Platform Analysis Prompts** - For YouTube/TikTok content analysis
   - **YouTube Channel Analysis Prompts** - For comprehensive channel evaluation
   - **AI Video Creation Prompts** - For video generation prompts

### Creating a Prompt
1. Navigate to the desired prompt management page
2. Click "Add New Prompt"
3. Fill in:
   - **Prompt Kind**: Identifier for this prompt type (e.g., "video_analysis")
   - **Description**: Brief description of what this prompt does
   - **Prompt Template**: The actual prompt text with `[VARIABLE_NAME]` placeholders
4. Click "Save"

### Using Variables
Variables in prompts are denoted with square brackets: `[VARIABLE_NAME]`

Example:
```
Analyze the YouTube video titled [VIDEO_TITLE] from channel [CHANNEL_NAME]. 
The video has [VIEW_COUNT] views and was published on [PUBLISH_DATE].
Provide insights on...
```

These variables will automatically:
- Be detected and displayed in the UI
- Generate input fields when the prompt is used
- Be replaced with actual values when the prompt is executed

### Example Prompts

#### Video Analysis
```
Provider: youtube
Kind: video_analysis
Template: Analyze this YouTube video: [VIDEO_URL]. Focus on:
1. Content quality and engagement
2. SEO optimization 
3. Potential for viral growth
Video title: [VIDEO_TITLE]
Channel: [CHANNEL_NAME]
```

#### Channel Analysis  
```
Provider: youtube
Kind: channel_analysis
Template: Provide a comprehensive analysis of the YouTube channel: [CHANNEL_NAME]
Channel URL: [CHANNEL_URL]
Subscribers: [SUBSCRIBER_COUNT]
Analyze content strategy, posting frequency, engagement metrics, and growth potential.
```

#### Video Creation
```
Provider: veo3
Kind: video_creation
Template: Create a [DURATION] second video about [TOPIC] in [STYLE] style.
The video should be suitable for [TARGET_AUDIENCE] and convey a [MOOD] mood.
```

## UI Features

### Modern Card Design
- Beautiful gradient borders on hover
- Responsive grid layout
- Icon-based navigation
- Dark mode support

### Prompt Editor
- Syntax-highlighted textarea for prompt templates
- Real-time variable detection and preview
- Inline help text for variable syntax
- Provider and kind selectors

### Variable Preview
Automatically detects and displays all variables found in the template with color-coded badges.

## API Integration

Use the master prompts in your automation workflows:

```typescript
// Get a specific prompt
const result = await window.electronAPI.masterPrompts.getByProviderAndKind('youtube', 'video_analysis');
const prompt = result.data;

// Extract variables
const variables = extractVariables(prompt.promptTemplate);
// ['VIDEO_URL', 'VIDEO_TITLE', 'CHANNEL_NAME']

// Populate with actual values
const populated = populateTemplate(prompt.promptTemplate, {
  VIDEO_URL: 'https://youtube.com/watch?v=...',
  VIDEO_TITLE: 'My Awesome Video',
  CHANNEL_NAME: 'Tech Channel'
});

// Use populated prompt with AI service
await aiService.analyze(populated);
```

## Notes

- The `UNIQUE(provider, prompt_kind)` constraint ensures only one prompt per provider/kind combination
- Prompts are stored in SQLite database with automatic timestamps
- TypeScript types may need a rebuild after changes (`npm run dev` or restart the dev server)
- The database schema is automatically initialized on first app start

## Future Enhancements

Potential features to add:
- Version history for prompts
- Import/export prompt templates
- Prompt testing interface with sample variables
- Usage analytics (how often each prompt is used)
- Template sharing between providers
- Variable validation (required vs optional)
