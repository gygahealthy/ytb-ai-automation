# Prompt Playground

## Overview

The Prompt Playground is an interactive testing and preview tool for the AI Prompt system. It allows developers and content creators to:

1. **Select** component prompt configurations
2. **Preview** template variable replacements in real-time with syntax highlighting
3. **Test** AI responses with actual API calls
4. **Validate** prompt templates before deploying them in production

## Features

### 1. Component Prompt Selection (Left Panel - Top)

- Lists all configured component prompts from the database
- Shows component name, prompt ID, and AI model
- Click to select and load the associated master prompt

### 2. Variable Input Form (Left Panel - Bottom)

- Automatically detects variables from the selected master prompt's `variable_occurrences_config`
- Shows which occurrences of each variable will be replaced
- Input fields for each variable with real-time preview

### 3. Prompt Preview (Right Panel - Top)

- Live preview of the prompt template with highlighted variables
- **Green highlight**: Variables with values that will be replaced
- **Yellow highlight**: Variables without values or not in occurrence config
- "Send to AI" button to execute the actual API call
- Respects selective occurrence replacement based on `variable_occurrences_config`

### 4. AI Output Display (Right Panel - Bottom)

- Shows the actual AI response after sending the prompt
- Loading indicator during API call
- Error display if the request fails
- Clean formatted output of the AI response

## Architecture

### Components

All components are located in `src/renderer/components/admin/playground/`:

#### ComponentPromptSelector.tsx

- Fetches all component prompt configs via `electronApi.aiPrompt.getAllConfigs()`
- Renders selectable list with active state
- Notifies parent when selection changes

#### VariableInputForm.tsx

- Receives `variableOccurrenceConfig` from master prompt
- Provides text inputs for each variable
- Shows occurrence indices for each variable
- Triggers parent callback on value changes

#### PromptPreview.tsx

- Uses `detectTemplateVariables()` from `template-replacement.util.ts`
- Tracks occurrence indices for each variable
- Highlights variables based on:
  - Whether they're in the `variableOccurrenceConfig`
  - Whether they have values entered
- Renders "Send to AI" button

#### AIOutputDisplay.tsx

- Shows loading spinner during API calls
- Displays errors with red styling
- Shows AI response with formatted text
- Handles different response formats (string, object with text/response fields)

### Main Page

**Location**: `src/renderer/pages/admin/PromptPlaygroundPage.tsx`

**Layout**:

```
┌─────────────────────────────────────────────────────────┐
│                    Prompt Playground                     │
├──────────────────────┬──────────────────────────────────┤
│  Component Selector  │      Prompt Preview              │
│      (1/3 width)     │       (2/3 width)                │
│                      │                                  │
├──────────────────────┤  [Send to AI Button]             │
│                      ├──────────────────────────────────┤
│  Variable Inputs     │      AI Output Display           │
│      (1/3 width)     │       (2/3 width)                │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

**State Management**:

- `selectedConfig`: Currently selected component prompt config
- `masterPrompt`: Loaded master prompt data (includes `variableOccurrencesConfig`)
- `variableValues`: User-entered values for template variables
- `aiOutput`: Response from AI API
- `isSending`: Loading state for API call
- `error`: Error messages

### Data Flow

1. **Load Configs**: Page loads → Fetch all component configs
2. **Select Config**: User selects config → Load master prompt by `promptId`
3. **Enter Values**: User enters variable values → Preview updates in real-time
4. **Send to AI**:
   - Template is processed using `replaceTemplate()` with occurrence config
   - Call `electronApi.aiPrompt.callAI()` with processed prompt
   - Display response or error

## Integration Points

### IPC Handlers

All handlers are already registered in:

- `src/main/modules/master-prompt-management/handlers/ai-prompt.handler.ts`
- `src/main/modules/master-prompt-management/handlers/registrations.ts`

**Available IPC channels**:

- `aiPrompt:getConfig` - Get config for specific component
- `aiPrompt:getAllConfigs` - Get all component configs
- `aiPrompt:saveConfig` - Save/update config
- `aiPrompt:deleteConfig` - Delete config
- `aiPrompt:callAI` - Execute AI call with prompt

### Services

**AIPromptService** (`src/main/modules/master-prompt-management/services/ai-prompt.service.ts`):

- `getConfigForComponent()` - Fetch component config
- `getAllConfigs()` - Fetch all configs
- `callAIWithPrompt()` - Process and send prompt to AI
  - Handles template replacement with `replaceTemplate()`
  - Respects `variableOccurrencesConfig` for selective replacement
  - Routes to `sendChatMessage()` in gemini-apis module

### Template Replacement

Uses shared utility: `src/shared/utils/template-replacement.util.ts`

**Key Functions**:

- `detectTemplateVariables(template)` - Finds all `{VAR}` and `[VAR]` placeholders
- `replaceTemplate(template, values, occurrenceConfig)` - Selective replacement
  - Normalizes keys to snake_case for flexible matching
  - Only replaces specified occurrences when config provided
  - Replaces all when no config provided

**Occurrence Config Format**:

```typescript
{
  "video_topic": [0, 2],  // Replace 1st and 3rd occurrence
  "video_style": [0]      // Replace 1st occurrence only
}
```

## Routing

**Menu Location**: Admin → Prompt Playground (at the end of admin section)

**Route**: `/admin/prompt-playground`

**Configuration**:

- `src/renderer/Routes.tsx` - Route definition
- `src/renderer/components/common/sidebar/routes.config.ts` - Menu item with FlaskConical icon

## Usage Example

1. Navigate to **Admin → Prompt Playground** in the sidebar
2. Select a component prompt (e.g., "VideoCreationPage|StoryGenerator")
3. The master prompt template loads on the right
4. Enter values for variables on the left (e.g., `video_topic`: "AI in Healthcare")
5. Watch the preview update with highlighted replacements
6. Click **"Send to AI"** to test the actual API call
7. View the AI response in the bottom right panel

## Development Notes

### Adding New Features

**To add more preview options**:

- Modify `PromptPreview.tsx` to add new visualization modes
- Consider adding tabs for "Raw", "Highlighted", "Diff" views

**To support streaming responses**:

- Update `handleSendToAI()` to pass `stream: true`
- Modify `AIOutputDisplay` to handle streaming chunks
- Listen for IPC events for streamed data

**To add history/favorites**:

- Create new components in `playground/` folder
- Store test configurations in local storage or database
- Add UI to save/load test scenarios

### Best Practices

1. **Always test with real component configs**: Ensures production parity
2. **Use occurrence config**: Validates selective replacement behavior
3. **Check different variable formats**: camelCase, snake_case, PascalCase
4. **Test error cases**: Missing profileId, invalid prompt IDs, network errors
5. **Verify AI model selection**: Different models may have different response formats

## Troubleshooting

### No Configs Appear

- Ensure component configs are created via **Admin → AI Prompt Config**
- Check database has `component_prompt_configs` table
- Verify IPC handlers are registered

### Variables Not Highlighting

- Check `variableOccurrencesConfig` is set on master prompt
- Ensure variable names match exactly (case-insensitive via snake_case normalization)
- Verify template uses `{VAR}` or `[VAR]` syntax

### AI Call Fails

- Check `profileId` is valid in the config
- Ensure master prompt `promptId` exists
- Verify network/API credentials for Gemini
- Check console logs for detailed error messages

### Preview Doesn't Update

- Ensure variable names in occurrence config match template
- Check React state is updating correctly
- Verify `replaceTemplate()` is called on value changes

## Future Enhancements

- [ ] Add diff view comparing before/after replacement
- [ ] Support for streaming AI responses
- [ ] Save test scenarios (favorites)
- [ ] Export/import test cases
- [ ] Batch testing with multiple variable sets
- [ ] Compare responses across different AI models
- [ ] Response history and comparison
- [ ] Variable suggestions based on master prompt type
- [ ] Inline variable documentation from prompt metadata
