# Secret Extraction System - Usage Guide

## Overview

The Secret Extraction System automatically extracts API keys and tokens from Next.js applications (like Google Labs Flow) using headless browser automation. It stores these secrets per-profile in the database and caches them in a Zustand store for fast runtime access.

## Key Features

✅ **Automatic Extraction**: Uses Puppeteer to extract secrets from `_app-[hash].js` files  
✅ **FLOW_NEXT_KEY Support**: Specifically extracts Google API keys (AIzaSy...) for Flow API calls  
✅ **Per-Profile Storage**: Each profile has its own set of secrets  
✅ **Database Persistence**: Secrets stored in `profile_secrets` table  
✅ **Runtime Caching**: Zustand store for fast access in renderer  
✅ **Auto-Refresh**: Can invalidate and re-extract when cookies rotate  

## Architecture

```
src/main/modules/common/secret-extraction/
├── manifest.json                          # Module configuration
├── index.ts                               # Module exports
├── types/index.ts                         # TypeScript types
├── repository/profile-secret.repository.ts # Database access
├── services/secret-extraction.service.ts  # Business logic
├── handlers/
│   ├── registrations.ts                   # IPC channel list
│   └── secret-extraction.handlers.ts      # IPC handlers
└── helpers/
    ├── browser-automation.helper.ts       # Puppeteer automation
    └── script-parser.helper.ts            # Regex parsing

src/renderer/store/secretStore.ts          # Zustand store for UI
```

## Usage Examples

### 1. Extract Secrets for a Profile (Main Process)

```typescript
import { secretExtractionService } from '@main/modules/common/secret-extraction';

// Extract all secrets from Google Labs Flow
const result = await secretExtractionService.extractSecrets(profileId);

if (result.success) {
  console.log(`Extracted ${result.secrets.length} secrets`);
}
```

### 2. Get a Secret (Main Process)

```typescript
import { secretExtractionService } from '@main/modules/common/secret-extraction';

// Get FLOW_NEXT_KEY for API calls
const apiKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');

if (apiKey) {
  // Use in API request
  const url = `https://aisandbox-pa.googleapis.com/v1/media/${mediaId}?key=${apiKey}`;
}
```

### 3. Use in Renderer (React Component)

```tsx
import { useSecretStore, useFlowNextKey } from '@renderer/store/secretStore';

function MyComponent({ profileId }: { profileId: string }) {
  const flowNextKey = useFlowNextKey(profileId);
  const extractSecrets = useSecretStore((state) => state.extractSecrets);
  const loading = useSecretStore((state) => state.loading);

  const handleExtract = async () => {
    const success = await extractSecrets(profileId);
    if (success) {
      alert('Secrets extracted successfully!');
    }
  };

  return (
    <div>
      {flowNextKey ? (
        <p>✅ API Key: {flowNextKey.substring(0, 10)}...</p>
      ) : (
        <button onClick={handleExtract} disabled={loading}>
          Extract Secrets
        </button>
      )}
    </div>
  );
}
```

### 4. Auto-Extract on First Use (Service Pattern)

```typescript
// In your service that needs the API key
async function fetchImage(profileId: string, imageName: string) {
  // Try to get existing secret
  let apiKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');

  // If not found, extract automatically
  if (!apiKey) {
    console.log('No API key found, extracting...');
    const extractResult = await secretExtractionService.extractSecrets(profileId);
    
    if (!extractResult.success) {
      throw new Error('Failed to extract API key');
    }

    apiKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');
  }

  // Use the API key
  const url = `https://aisandbox-pa.googleapis.com/v1/media/${imageName}?key=${apiKey}`;
  return fetch(url, { ... });
}
```

## IPC Channels

### Main → Renderer Communication

| Channel | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `secret-extraction:extract` | `{ profileId, config? }` | `{ success, data }` | Extract secrets from target URL |
| `secret-extraction:get` | `{ profileId, secretType? }` | `{ success, secretValue, found }` | Get a valid secret |
| `secret-extraction:get-all` | `{ profileId? }` | `{ success, secrets[] }` | Get all secrets (or for one profile) |
| `secret-extraction:refresh` | `{ profileId, config? }` | `{ success, data }` | Invalidate old & extract new |
| `secret-extraction:invalidate` | `{ profileId }` | `{ success }` | Mark all secrets as invalid |
| `secret-extraction:browser-status` | `{}` | `{ success, isActive }` | Check if browser is running |
| `secret-extraction:cleanup` | `{}` | `{ success }` | Close browser resources |

### Example IPC Call from Renderer

```typescript
// Extract secrets
const result = await (window as any).electronAPI.invoke('secret-extraction:extract', {
  profileId: 'profile-123'
});

// Get API key
const { secretValue } = await (window as any).electronAPI.invoke('secret-extraction:get', {
  profileId: 'profile-123',
  secretType: 'FLOW_NEXT_KEY'
});
```

## Database Schema

```sql
CREATE TABLE profile_secrets (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  cookie_id TEXT,
  secret_type TEXT NOT NULL,  -- 'FLOW_NEXT_KEY', 'BEARER_TOKEN', etc.
  secret_value TEXT NOT NULL,
  extracted_at TEXT NOT NULL,
  is_valid INTEGER DEFAULT 1,
  last_validated_at TEXT,
  metadata TEXT,              -- JSON metadata
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (cookie_id) REFERENCES cookies(id) ON DELETE SET NULL
);

-- Indexes for fast lookups
CREATE UNIQUE INDEX idx_profile_secrets_profile_type 
  ON profile_secrets(profile_id, secret_type);
```

## Integration with Image Fetch API

The secret is now used in `imageVEO3ApiClient.fetchImage()`:

```typescript
// Before: Hardcoded placeholder
const url = `${mediaBaseUrl}/media/${imageName}?key=[SECRET]&clientContext.tool=PINHOLE`;

// After: Uses extracted secret
const url = `${mediaBaseUrl}/media/${imageName}?key=${apiKey}&clientContext.tool=PINHOLE`;
```

The service automatically attempts extraction if no key is found:

```typescript
// In imageVeo3Service.uploadImage()
const apiKey = await secretExtractionService.getValidSecret(profileId, 'FLOW_NEXT_KEY');
if (!apiKey) {
  // Auto-extract
  await secretExtractionService.extractSecrets(profileId);
}
```

## Secret Types

| Type | Pattern | Example | Usage |
|------|---------|---------|-------|
| `FLOW_NEXT_KEY` | `AIzaSy[A-Za-z0-9_-]{33}` | `AIzaSyAbC123...` | Google API key for Flow endpoints |
| `BEARER_TOKEN` | JWT format | `eyJhbG...` | Authorization headers |
| `API_KEY` | Generic | Various | Other API keys |
| `AUTH_TOKEN` | Generic | Various | Authentication tokens |

## Troubleshooting

### "No API key found"

**Solution**: Ensure the profile has valid Flow cookies before attempting extraction.

```typescript
// Check cookies first
const cookies = await cookieService.getCookiesByProfile(profileId);
const flowCookie = cookies.find(c => c.service === 'flow' && c.status === 'active');

if (!flowCookie) {
  // Need to login first
  await profileService.login(profileId);
}

// Then extract
await secretExtractionService.extractSecrets(profileId);
```

### "Browser initialization failed"

**Solution**: Check that Puppeteer can find Chrome executable.

```typescript
// Provide explicit path if needed
const service = new SecretExtractionService(
  repository,
  logger,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
);
```

### "No matching script files found"

**Solution**: The `_app-[hash].js` pattern may have changed. Update the regex in:

```typescript
// secret-extraction.service.ts
const DEFAULT_FLOW_EXTRACTION_CONFIG = {
  scriptPattern: /_next\/static\/chunks\/pages\/_app-[a-f0-9]+\.js/,
  // ... update this pattern if Next.js changes
};
```

## Best Practices

1. **Extract on Profile Creation**: Extract secrets immediately after successful login
2. **Refresh on Cookie Rotation**: Invalidate secrets when cookies are rotated
3. **Cache in Zustand**: Use the Zustand store for renderer access (faster than IPC)
4. **Handle Failures Gracefully**: Always check if secret exists before using
5. **Monitor Validity**: Periodically validate secrets by making test API calls

## Future Enhancements

- [ ] Add automatic secret validation (test API calls)
- [ ] Support more secret types (OAuth tokens, session IDs)
- [ ] Add UI panel to view/manage secrets per profile
- [ ] Implement automatic re-extraction on 401/403 errors
- [ ] Add secret expiration tracking
- [ ] Support multiple Next.js apps (not just Flow)

---

**For more details**, see:
- `docs/feature-note/secret-extraction/` (not yet created)
- `src/main/modules/common/secret-extraction/`
- `src/renderer/store/secretStore.ts`
