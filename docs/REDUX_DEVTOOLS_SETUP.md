# Redux DevTools Setup for Zustand in Electron

## Overview

This document explains how Redux DevTools is configured to work with Zustand stores in your Electron app. Redux DevTools provides time-travel debugging capabilities, making it easy to inspect and replay state changes in your application.

## Installation & Configuration

### ✅ What's Been Installed

1. **electron-devtools-installer** (v3.x.x)
   - A utility to programmatically install browser extensions into Electron apps
   - Handles downloading and installing Redux DevTools at runtime

### ✅ Main Process Setup (`src/main/main.ts`)

The Redux DevTools extension is automatically installed when your Electron app starts in development mode:

```typescript
if (process.env.NODE_ENV === "development") {
  try {
    const { default: installExtension, REDUX_DEVTOOLS } = require("electron-devtools-installer");
    await installExtension(REDUX_DEVTOOLS);
    console.log("✅ Redux DevTools installed successfully");
  } catch (err) {
    console.warn("[Electron] Failed to install Redux DevTools:", err);
  }
}
```

**Key Details:**

- Installation only happens in **development mode** (NODE_ENV === "development")
- It runs during `app.on("ready")` before the window is created
- Errors are logged but don't block the app startup

### ✅ Renderer Store Setup

Your Zustand stores are configured with the `devtools` middleware for time-travel debugging:

**Example: video-creation.store.ts**

```typescript
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export const useVideoCreationStore = create<VideoCreationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Your store actions and state...
      }),
      {
        name: "veo3-video-creation-store",
        // persist config...
      }
    ),
    { name: "VideoCreationStore" }
  )
);
```

**Middleware Stack Order:**

1. `devtools` (outermost) - Enables Redux DevTools integration
2. `persist` (middle) - Persists state to localStorage
3. Your store definition (innermost)

## How to Use

### 1. Start the App in Development Mode

```bash
npm run dev
```

### 2. Open DevTools

In your Electron app, use the keyboard shortcut or menu:

- **Ctrl+Shift+I** (Windows/Linux)
- **Cmd+Option+I** (macOS)
- Or use the keyboard shortcut **Ctrl+I** (configured in your keyboard shortcuts)

### 3. Find the Redux Tab

Look for the **"Redux"** tab in the DevTools panel (usually next to Console, Sources, etc.)

### 4. Inspect & Time-Travel Debug

In the Redux DevTools panel, you can:

- **Inspect State**: View the current state of all connected stores
- **Action History**: See all dispatched actions with timestamps
- **Time-Travel**: Click on any action to jump to that point in time
- **Diff**: View what changed in each action
- **Dispatch**: Manually dispatch actions to test state changes
- **Export/Import**: Save and restore state snapshots

## Supported Stores

Currently configured for Redux DevTools:

- `useVideoCreationStore` - Video creation prompts, jobs, drafts, history

To add more stores, wrap them with `devtools` middleware:

```typescript
export const useMyStore = create<MyStoreType>()(
  devtools(
    (set, get) => ({
      // store definition
    }),
    { name: "MyStore" }
  )
);
```

## Production Build

Redux DevTools will **NOT** be installed in production builds because:

- The installation is guarded by `process.env.NODE_ENV === "development"`
- DevTools middleware adds minimal overhead, but avoiding it in production is cleaner
- Production builds prioritize bundle size and performance

## Troubleshooting

### Redux Tab Not Appearing

1. **Clear DevTools Cache**

   ```bash
   rm -rf ~/.config/chromium  # On macOS/Linux
   # or for Windows: %APPDATA%\Chromium
   ```

2. **Restart the App**

   ```bash
   npm run dev
   ```

3. **Check Console for Errors**
   - Look for installation error messages in the console

### State Not Updating

- Ensure your store is wrapped with `devtools` middleware
- Verify actions are being dispatched to the store
- Check that the store name in `devtools({ name: "StoreName" })` is descriptive

### Performance Issues

- Redux DevTools adds minimal overhead
- If app feels slow, disable DevTools temporarily (Ctrl+Shift+I to close)
- Time-travel debugging with large action histories can be memory-intensive

## Advanced: Devtools Options

You can customize the devtools middleware behavior:

```typescript
devtools(
  persistMiddleware(...),
  {
    name: "VideoCreationStore",
    enabled: true,              // Enable/disable devtools
    trace: true,                // Enable action traces (shows where actions come from)
    traceLimit: 25,             // Max stack frames to capture
    actionSanitizer: (action) => action,  // Transform actions before sending
    stateSanitizer: (state) => state,     // Transform state before sending
  }
)
```

## Reference

- **Redux DevTools Chrome Extension**: [github.com/reduxjs/redux-devtools](https://github.com/reduxjs/redux-devtools)
- **electron-devtools-installer**: [npm.im/electron-devtools-installer](https://npm.im/electron-devtools-installer)
- **Zustand Middleware**: [zustand.pmnd.rs/middleware](https://zustand.pmnd.rs/middleware)

## Next Steps

1. **Start the dev server** and open Redux DevTools
2. **Interact with your app** to see actions being logged
3. **Experiment with time-travel** to understand state transitions
4. **Add devtools to other stores** as needed for comprehensive debugging
