# 🚀 Quick Start Guide

## ✅ What's Ready

Your VEO3 Automation app now has a **simple, clean architecture** with 4 main features ready to use:

1. **Profile Management** - Manage browser profiles with credits
2. **Browser Automation** - Automate tasks with Puppeteer
3. **VEO3 Video Creation** - Create and manage video projects
4. **YouTube Analysis** - Track channels and analyze videos

## 🏃 Run the App

```bash
npm run dev
```

This starts both:

- Vite dev server (React UI) on http://localhost:5173
- Electron window (desktop app)

## 📖 Using the APIs in React

All APIs are available via `window.electronAPI`:

### Create a Profile

```typescript
const result = await window.electronAPI.profile.create({
  name: "My Profile",
  userDataDir: "./data/profiles/my-profile",
  browserPath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  creditRemaining: 100,
  proxy: {
    server: "proxy.example.com:8080",
    username: "user",
    password: "pass",
  },
});

if (result.success) {
  console.log("Profile created:", result.data);
}
```

### Start Automation

```typescript
// 1. Create task
const task = await window.electronAPI.automation.create({
  profileId: "profile_123",
  name: "Login Automation",
  targetUrl: "https://example.com",
  actions: [
    { type: "type", selector: "#username", value: "myuser" },
    { type: "type", selector: "#password", value: "mypass" },
    { type: "click", selector: "#login-btn" },
    { type: "wait", timeout: 2000 },
    { type: "screenshot", value: "login-success.png" },
  ],
});

// 2. Start it
await window.electronAPI.automation.start(task.data.id);

// 3. Check status
const status = await window.electronAPI.automation.getById(task.data.id);
console.log(status.data.status); // "running", "completed", etc.

// 4. Stop if needed
await window.electronAPI.automation.stop(task.data.id);
```

### Create VEO3 Project

```typescript
const project = await window.electronAPI.veo3.create({
  projectId: "veo3_proj_001",
  profileId: "profile_123",
  name: "My First Video",
  scenes: [
    {
      scene: "Opening scene",
      segment: "Introduction to the topic",
      image: "scene1.jpg",
    },
    {
      scene: "Main content",
      segment: "Deep dive explanation",
    },
  ],
  jsonPrompt: {
    style: "professional",
    duration: 60,
  },
});

// Add more scenes
await window.electronAPI.veo3.addScene(project.data.id, {
  scene: "Conclusion",
  segment: "Summary and call to action",
});

// Update status
await window.electronAPI.veo3.updateStatus(project.data.id, "processing");
```

### Track YouTube Channel

```typescript
// Add channel
const channel = await window.electronAPI.youtube.createChannel({
  channelId: "UC1234567890",
  channelName: "My Channel",
  channelUrl: "https://youtube.com/@mychannel",
});

// Analyze it (will call YouTube API in future)
await window.electronAPI.youtube.analyzeChannel(channel.data.id);

// Update metrics manually
await window.electronAPI.youtube.updateChannelMetrics(channel.data.id, {
  subscriberCount: 10000,
  videoCount: 50,
  viewCount: 500000,
});

// Analyze a video
await window.electronAPI.youtube.analyzeVideo("VIDEO_ID", channel.data.id);
```

## 🗂️ Where Data Is Stored

All data is saved as JSON files in:

**Windows**: `C:\Users\{YOU}\AppData\Roaming\veo3-automation\database\`

Files:

- `profiles.json` - All profiles
- `automation_tasks.json` - All automation tasks
- `veo3_projects.json` - All VEO3 projects
- `youtube_channels.json` - All channels
- `video_analysis.json` - All video analyses

You can open these files to see your data anytime!

## 🛠️ Development Tips

### Add New Features

1. **Want a new service?**

   - Create `src/services/my-feature.service.ts`
   - Add methods like `async doSomething()`
   - Register IPC handler in `src/main/ipc-handlers.ts`
   - Expose in `src/main/preload.ts`

2. **Need new types?**

   - Add to `src/types/index.ts`

3. **Want custom utilities?**
   - Add to `src/utils/`

### Example: Add Settings Service

```typescript
// src/services/settings.service.ts
import { database } from "../storage/database";

export class SettingsService {
  async getSettings() {
    return await database.findAll("settings");
  }

  async saveSetting(key: string, value: any) {
    return await database.insert("settings", { key, value });
  }
}

export const settingsService = new SettingsService();
```

```typescript
// src/main/ipc-handlers.ts - Add this
ipcMain.handle("settings:get", async () => {
  return await settingsService.getSettings();
});
```

```typescript
// src/main/preload.ts - Add this
settings: {
  get: () => ipcRenderer.invoke("settings:get"),
  save: (key: string, value: any) => ipcRenderer.invoke("settings:save", key, value),
}
```

## 🐛 Debugging

### View Database Files

```bash
# Windows
explorer %APPDATA%\veo3-automation\database

# Open a file
notepad %APPDATA%\veo3-automation\database\profiles.json
```

### Check Logs

All services use logger. Open DevTools (F12) to see logs:

```
[ProfileService] INFO: Profile created: profile_123
[AutomationService] INFO: Task started: task_456
```

### Clear All Data

```bash
# Delete database folder to start fresh
rmdir /s %APPDATA%\veo3-automation\database
```

## 📚 Full API Reference

See `docs/IMPLEMENTATION_COMPLETE.md` for:

- Complete API list
- All data models
- Architecture details
- File structure

## 🎯 Common Tasks

### Get All Profiles

```typescript
const { data: profiles } = await window.electronAPI.profile.getAll();
profiles.forEach((p) => console.log(p.name));
```

### Update Profile Credit

```typescript
// Add 50 credits
await window.electronAPI.profile.updateCredit("profile_123", 50);

// Deduct 10 credits
await window.electronAPI.profile.updateCredit("profile_123", -10);
```

### Get All Running Tasks

```typescript
const { data: tasks } = await window.electronAPI.automation.getAll();
const running = tasks.filter((t) => t.status === "running");
console.log(`${running.length} tasks running`);
```

### List All VEO3 Projects

```typescript
const { data: projects } = await window.electronAPI.veo3.getAll();
projects.forEach((p) => {
  console.log(`${p.name}: ${p.status} (${p.scenes.length} scenes)`);
});
```

---

**That's it!** Simple and straightforward. Start coding! 🚀
