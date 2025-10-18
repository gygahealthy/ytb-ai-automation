# Gemini Chat Model Selection Constants

Reference: https://github.com/hieu2906090/Gemini-API

## Supported Models (as of June 12, 2025)

### Latest Models

- **`GEMINI_MODEL_UNSPECIFIED`** (default)

  - Automatically selected by Gemini
  - No usage limit
  - Best for general use

- **`GEMINI_MODEL_2_5_PRO`** (recommended for advanced tasks)

  - Latest Gemini 2.5 Pro
  - **Has daily usage limit** (exact limit varies by account)
  - Supports thinking capabilities
  - Best for complex reasoning and analysis

- **`GEMINI_MODEL_2_5_FLASH`** (recommended for speed)
  - Fast Gemini 2.5 Flash
  - No usage limit
  - Optimized for speed
  - Good balance between performance and quality

### Deprecated Models (still working)

- **`GEMINI_MODEL_2_0_FLASH`**

  - Legacy Gemini 2.0 Flash
  - No longer recommended

- **`GEMINI_MODEL_2_0_FLASH_THINKING`**
  - Legacy with thinking capabilities
  - No longer recommended

## Usage in Code

### Import

```typescript
import {
  GEMINI_MODEL_2_5_PRO,
  GEMINI_MODEL_2_5_FLASH,
  GEMINI_MODEL_UNSPECIFIED,
  getModelInfo,
  isSupportedModel,
  isDeprecatedModel,
} from "@shared/constants/gemini-models.constants";
```

### Using in Requests

```typescript
// Single-turn request with specific model
const response = await electronApi.gemini.chat.send({
  profileId,
  prompt: "Your question here",
  model: GEMINI_MODEL_2_5_PRO,
});

// Using helper functions
if (isSupportedModel("gemini-2.5-pro")) {
  const info = getModelInfo("gemini-2.5-pro");
  console.log(info.name); // "Gemini 2.5 Pro"
  console.log(info.hasUsageLimit); // true
}

if (isDeprecatedModel("gemini-2.0-flash")) {
  console.log("This model is deprecated, consider upgrading");
}
```

## Implementation Notes

### Model Constants File

Location: `src/shared/constants/gemini-models.constants.ts`

Exports:

- Model name constants (`GEMINI_MODEL_*`)
- `GEMINI_MODELS` object with metadata for each model
- Type definition: `GeminiModelType`
- Helper functions: `getModelInfo()`, `isSupportedModel()`, `isDeprecatedModel()`

### Integration Points

1. **Renderer**: Can import constants and pass to IPC call
2. **IPC Types**: `ChatRequest` should include optional `model` field
3. **Main Handler**: Router can accept `model` parameter and pass to ChatService
4. **ChatService**: Can pass model to Gemini API request

## Daily Usage Limits

### Gemini 2.5 Pro Limitation

- Has a **daily usage limit** imposed by Google
- Exact limit varies by account and region
- When limit is reached, API returns an error
- Users should fall back to other models or retry next day

### Recommendation

When implementing model selection:

1. Let users choose their preferred model
2. Provide warnings about Pro model's daily limit
3. Suggest alternatives (2.5 Flash) when Pro limit is reached
4. Log which model was used for each request (helpful for debugging)

## Future Considerations

### Model Selection UI

Could implement a dropdown to let users choose:

- Default (auto-select)
- 2.5 Pro (if daily limit not reached)
- 2.5 Flash (always available)

### Error Handling

Handle model-specific errors:

- Daily limit exceeded: Show warning and offer model fallback
- Unsupported model: Show error with available models
- Model deprecated: Show warning to upgrade

### Performance Tracking

Track which models are used most:

- 2.5 Pro vs 2.5 Flash usage ratio
- When daily limit is hit
- User preference patterns

## References

- GitHub Repo: https://github.com/hieu2906090/Gemini-API
- Model Selection Section: https://github.com/hieu2906090/Gemini-API#select-language-model
