# Video Studio - Quick Start Guide

## 🚀 Accessing the Studio

### From Single Video Creation Page
Click the **"Studio"** button in the top-right header (purple gradient button)

### Direct URL
Navigate to: `/video-creation/studio`

---

## 🎬 Studio Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back          Video Studio                    [Properties]   │
│                  2 scenes                        [Share] [Export]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     ╔════════════════════╗                       │
│                     ║                    ║                       │
│                     ║   VIDEO PREVIEW    ║  [Scene 1 of 2]      │
│                     ║   (Centered)       ║                       │
│                     ║                    ║                       │
│                     ╚════════════════════╝                       │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│   0:03 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 0:06  │
│                   [◄◄]  [▶/⏸]  [►►]                            │
├─────────────────────────────────────────────────────────────────┤
│  Scene Timeline                                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                        │
│  │ [✓]  │  │ [2]  │  │ [3]  │  │ [4]  │  →                      │
│  │ 6s   │  │ 6s   │  │ 6s   │  │ 6s   │                         │
│  │Scene1│  │Scene2│  │Scene3│  │Scene4│                         │
│  └──────┘  └──────┘  └──────┘  └──────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+P** | Toggle Properties Panel |
| *Future* | Space: Play/Pause |
| *Future* | ← →: Previous/Next Scene |

---

## 🎛️ Properties Panel (Ctrl+P)

Opens from the right side with three tabs:

### 📋 Info Tab
- **Scene Thumbnail**: Video preview
- **Scene Name**: Edit scene title
- **Scene Order**: View position (#1, #2, etc.)
- **Duration**: Video length in seconds
- **Video URL**: Direct link to video
- **Description**: Scene description textarea

### 🎨 Effects Tab
- **Brightness**: 0-200% slider
- **Contrast**: 0-200% slider
- **Saturation**: 0-200% slider
- **Filter Presets**: 
  - None
  - Vintage
  - Black & White
  - Sepia
  - Warm
  - Cool

### 🔊 Audio Tab
- **Volume**: 0-100% slider
- **Fade In**: 0-5s slider
- **Fade Out**: 0-5s slider
- **Background Music**: Add music button

---

## 🎞️ Scene Timeline Features

### Scene Card
Each scene card shows:
- 📹 Video thumbnail (actual frame from video)
- 🔢 Scene number badge (top-left)
- ⏱️ Duration badge (top-right)
- 📝 Scene description (bottom)

### Interactions
- **Click**: Select and preview scene
- **Hover**: Shows play icon overlay
- **Selected**: Blue ring with checkmark

### States
- **Default**: Gray border
- **Hover**: Gray border with shadow
- **Selected**: Blue border with ring offset

---

## 🎮 Playback Controls

### Main Controls
- **◄◄ Previous**: Go to previous scene (disabled at first scene)
- **▶/⏸ Play/Pause**: Toggle video playback
- **►► Next**: Go to next scene (disabled at last scene)

### Progress Bar
- Shows current time / total duration
- Updates in real-time during playback
- Visual progress indicator (gradient fill)

### Scene Navigation
- Use timeline cards to jump to any scene
- Previous/Next buttons for sequential navigation

---

## 🎨 Visual Design

### Colors
- **Primary Actions**: Purple/Indigo gradients
- **Export Button**: Primary blue gradient
- **Selected Items**: Primary blue with ring
- **Background**: Light gray (dark mode: dark gray)

### Spacing
- Large central preview area
- Comfortable padding throughout
- Scrollable timeline for many scenes

---

## 📊 Empty State

When no completed videos exist:

```
        🎬
    No Videos Available
    
Create and complete some videos
first to use the Video Studio

    [Go to Video Creation]
```

---

## 🔄 Data Source

**Reads from Video Creation Store:**
- All prompts with completed status
- Video URLs from job records
- Scene order from prompt order

**Filtering:**
- Only shows completed videos
- Ignores pending/failed generations

---

## 💡 Tips

1. **Complete Videos First**: Generate and wait for videos to complete in Single Video Creation page
2. **Ctrl+P Quick Access**: Use keyboard shortcut for fast property editing
3. **Timeline Navigation**: Click any scene card for instant preview
4. **Back Button**: Returns to previous page (usually Single Video Creation)

---

## 🚧 Coming Soon

- **Video Export**: Stitch all scenes into one video
- **Scene Reordering**: Drag and drop timeline cards
- **Trimming**: Cut scenes to desired length
- **Transitions**: Add effects between scenes
- **Real-time Effects**: Apply filters during playback
- **Project Saving**: Save studio sessions
- **Audio Mixing**: Add background music and voiceovers

---

## 🐛 Troubleshooting

### No videos showing
- ✅ Check if videos are completed in Single Video Creation page
- ✅ Ensure jobs have status === "completed"
- ✅ Verify videoUrl exists for completed jobs

### Properties panel not opening
- ✅ Check if drawer is pinned or already open
- ✅ Try clicking Properties button instead of Ctrl+P
- ✅ Check browser console for errors

### Video not playing
- ✅ Check browser video format support (MP4 recommended)
- ✅ Verify video URL is accessible
- ✅ Try different browser

---

## 📞 Support

For issues or feature requests, check:
- `docs/feature-note/video-studio/VIDEO_STUDIO_IMPLEMENTATION.md`
- Console logs (F12)
- Main application logs
