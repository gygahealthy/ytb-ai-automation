# Flow VEO3 Model Settings Implementation

## Overview

This implementation adds a new settings page to manage VEO3 video generation models, allowing users to sync available models from the Google Labs VEO3 API and configure which models to use throughout the application.

## Files Created/Modified

### 1. Types

**`src/shared/types/veo3-models.ts`** (NEW)

- Defines comprehensive TypeScript types for VEO3 models based on API response
- Includes types for aspect ratios, capabilities, model status, paygate tiers
- Exports `VEO3Model`, `VEO3ModelWithSettings`, and `VEO3ModelsAPIResponse`

### 2. Store

**`src/renderer/store/veo3-models.store.ts`** (NEW)

- Zustand store for managing VEO3 model data
- Persists to localStorage under key `veo3-models-config`
- Features:
  - Store synced models with metadata
  - Track last sync timestamp
  - Set default model for rendering
  - Toggle models for usage throughout app
  - Filter models by paygate tier and deprecated status
  - Get default render model
  - Get enabled usage models

### 3. API Client

**`src/main/modules/ai-video-creation/flow-veo3-apis/apis/veo3/veo3-models-api.client.ts`** (NEW)

- HTTP client for fetching models from VEO3 API
- Endpoint: `https://labs.google/fx/api/trpc/videoFx.getVideoModelConfig`
- Uses cookie authentication from profile

### 4. Service

**`src/main/modules/ai-video-creation/flow-veo3-apis/services/veo3-apis/veo3-models.service.ts`** (NEW)

- Business logic layer for model management
- `syncModels(cookie)` - Fetches and returns all available models

### 5. Handler

**`src/main/modules/ai-video-creation/flow-veo3-apis/handlers/models.ts`** (NEW)

- IPC handler for `veo3:syncModels` channel
- Validates profile ID
- Retrieves Flow service cookie for the profile
- Delegates to service layer
- Returns synced model data to renderer

**`src/main/modules/ai-video-creation/flow-veo3-apis/handlers/registrations.ts`** (MODIFIED)

- Added import and registration of `modelsRegistrations`

### 6. IPC Bridge

**`src/main/preload.ts`** (MODIFIED)

- Added `syncModels(profileId)` method to `veo3` namespace

**`src/renderer/vite-env.d.ts`** (MODIFIED)

- Added TypeScript declaration for `syncModels(profileId)` method

### 7. UI Component

**`src/renderer/components/common/settings/FlowVeo3Settings.tsx`** (NEW)

- React component for the Flow VEO3 settings page
- Features:
  - **Sync Button**: Fetches latest models from API using default Flow profile
  - **Filter Controls**:
    - Paygate tier dropdown (default: PAYGATE_TIER_TWO)
    - Exclude deprecated checkbox (default: checked)
  - **Models Table**: Compact table displaying:
    - Default render radio button
    - Usage checkbox
    - Display name
    - Model key (mono font)
    - Supported aspect ratios (badges)
    - Capabilities (badges)
    - Video length, FPS, tier
  - **Summary Stats**: Total models, enabled for usage, default render model
  - Proper error handling and loading states
  - Dark mode support

### 8. Settings Integration

**`src/renderer/components/common/settings/SettingsForm.tsx`** (MODIFIED)

- Added "Flow VEO3" menu item with Video icon
- Added route for `flowVeo3` section
- Renders `FlowVeo3Settings` component

**`src/renderer/store/settings.store.ts`** (MODIFIED)

- Added `flowVeo3: true` to default visible sections

## Usage Flow

1. **User navigates to Settings → Flow VEO3**
2. **Click "Sync Models"**:
   - Uses the default Flow profile from `useDefaultProfileStore`
   - Retrieves the active Flow cookie for that profile
   - Calls VEO3 API endpoint to fetch all available models
   - Stores models in Zustand store + localStorage
   - Displays models in table
3. **Configure Models**:
   - Set one model as default for rendering (radio button)
   - Toggle models on/off for usage throughout the app (checkbox)
   - Filter by paygate tier
   - Hide/show deprecated models
4. **Model Selection Persists**:
   - Settings saved to localStorage
   - Available for use in other parts of the app via `useVEO3ModelsStore`

## API Endpoint Details

**Endpoint**: `GET https://labs.google/fx/api/trpc/videoFx.getVideoModelConfig`

**Query Parameter**:

```json
{
  "json": null,
  "meta": {
    "values": ["undefined"]
  }
}
```

**Response Structure**:

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "videoModels": [
            {
              "key": "veo_3_1_t2v_fast_portrait_ultra",
              "displayName": "Veo 3.1 - Fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelStatus": "MODEL_STATUS_ACTIVE"
            }
          ]
        }
      }
    }
  }
}
```

## Model Properties

- **key**: Unique identifier for the model
- **displayName**: User-friendly name
- **supportedAspectRatios**: Array of aspect ratio enums
- **capabilities**: What the model supports (text, audio, images)
- **videoLengthSeconds**: Output video duration
- **videoGenerationTimeSeconds**: Estimated generation time
- **framesPerSecond**: Output FPS (typically 24)
- **paygateTier**: Tier level (ONE, TWO, THREE)
- **modelStatus**: ACTIVE or DEPRECATED
- **creditCost**: Optional credit cost per generation

## App Integration

Other components can access models via:

```typescript
import { useVEO3ModelsStore } from "@/renderer/store/veo3-models.store";

function MyComponent() {
  const { getDefaultRenderModel, getUsageModels, getFilteredModels } = useVEO3ModelsStore();

  const defaultModel = getDefaultRenderModel();
  const enabledModels = getUsageModels();
  const tier2Models = getFilteredModels("PAYGATE_TIER_TWO", true);

  // Use models in your logic...
}
```

## Benefits

1. **Dynamic Model Discovery**: Automatically syncs latest models from VEO3 API
2. **Centralized Configuration**: Single source of truth for model preferences
3. **User Control**: Users can choose which models to expose in UI
4. **Filtering**: Hide deprecated models, filter by tier
5. **Persistence**: Settings saved across app restarts
6. **Type Safety**: Full TypeScript support throughout

## Future Enhancements

- Auto-sync models on app startup (optional setting)
- Sync interval configuration
- Model performance metrics
- Model favorites/pinning
- Search/filter by capabilities
- Export/import model configurations
