# macOS Browser Support Implementation

## Overview

This document describes the implementation of cross-platform browser executable detection and selection, with special focus on macOS support.

## Problem

The application was previously hardcoded for Windows, causing issues on macOS:

- Browser detection only checked Windows paths (Program Files, LocalAppData)
- File dialogs only accepted `.exe` files
- `.app` bundle structure on macOS was not handled
- Error messages referenced Windows-specific paths

## Solution

### 1. Browser Auto-Detection (`browser-automation.helper.ts`)

Updated `findChromeExecutable()` to detect browsers across all platforms:

**macOS paths added:**

```typescript
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
"/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
"/Applications/Chromium.app/Contents/MacOS/Chromium";
"~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
```

**Key insight:** On macOS, `.app` bundles are directories containing the actual executable at `Contents/MacOS/<AppName>`.

### 2. File Selection Dialog (`dialog.service.ts`)

#### Updated `selectBrowserExecutable()`

- **Windows:** Filters for `.exe` files
- **macOS:** Filters for `.app` bundles, then converts to the executable path inside
- **Linux:** No filter restrictions

**macOS-specific logic:**

```typescript
if (selectedPath.endsWith(".app")) {
  const appName = path.basename(selectedPath, ".app");
  const executablePath = path.join(selectedPath, "Contents", "MacOS", appName);

  // Falls back to common browser names if appName doesn't match
  // (e.g., "Google Chrome.app" → "Google Chrome")
}
```

#### Updated `validateBrowserPath()`

- Handles `.app` bundles on macOS by extracting the actual executable
- Validates the executable can be spawned with `--version` flag
- Detects browser type from path
- Returns version information if available

### 3. Settings UI (`SettingsForm.tsx`)

Updated browser addition dialog to use platform-appropriate filters:

```typescript
const platform = navigator.platform.toLowerCase();
const isMac = platform.includes('mac');
const isWin = platform.includes('win');

const filters = isMac
  ? [{ name: "Applications", extensions: ["app"] }, ...]
  : isWin
  ? [{ name: "Executable", extensions: ["exe"] }, ...]
  : [{ name: "All Files", extensions: ["*"] }];
```

### 4. Browser Manager (`browser-manager.ts`)

Already had macOS support via `getDefaultChromePath()` method (matched `dialog.service.ts`).

## macOS Browser Path Examples

| Browser | Application Bundle                 | Actual Executable                                                |
| ------- | ---------------------------------- | ---------------------------------------------------------------- |
| Chrome  | `/Applications/Google Chrome.app`  | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`   |
| Brave   | `/Applications/Brave Browser.app`  | `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`   |
| Edge    | `/Applications/Microsoft Edge.app` | `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge` |

## User Workflow (macOS)

1. **Auto-detection:** Application automatically finds Chrome if installed
2. **Manual selection:**
   - User opens Settings → Browsers → Add Browser
   - File dialog shows `.app` files
   - User selects `Google Chrome.app`
   - Dialog service converts to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
   - Validation confirms executable works
   - Path saved to settings

## Testing

### Verify Auto-Detection

```bash
# Check if Chrome is detected
ls -l "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Test version detection
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --version
```

### Verify in Application

1. Settings → Browsers → Add Browser
2. Select `Google Chrome.app` from `/Applications/`
3. Verify path shows as executable (not `.app`)
4. Verify version is detected

## Implementation Checklist

- [x] Update `browser-automation.helper.ts` with macOS paths
- [x] Update `dialog.service.ts` to handle `.app` bundles
- [x] Update `validateBrowserPath()` for macOS
- [x] Update `SettingsForm.tsx` with platform-aware filters
- [x] Cross-platform error messages
- [x] Build and test on macOS

## Related Files

- `src/main/modules/common/secret-extraction/helpers/browser-automation.helper.ts`
- `src/main/modules/common/dialog/dialog.service.ts`
- `src/main/modules/instance-management/services/browser-manager.ts`
- `src/renderer/components/common/settings/SettingsForm.tsx`
- `src/renderer/store/settings.store.ts`

## Notes

- The stored browser path is always the **actual executable**, not the `.app` bundle
- This ensures consistency across all browser launch methods
- Users see `.app` bundles in the file picker for better UX
- Conversion happens transparently in `selectBrowserExecutable()`
