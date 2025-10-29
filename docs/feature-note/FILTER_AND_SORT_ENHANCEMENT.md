# Filter and Sort Enhancement

## Overview

Added "Not Created" (idle) filter option and a sort feature to JsonToolbar to help users better manage and organize their prompts.

## Features Added

### 1. "Not Created" Filter Option

**What it does:**

- Filters to show only prompts that haven't been used to generate videos yet
- A prompt is considered "Not Created" when there's no job associated with it

**When to use:**

- Quickly find prompts that still need video generation
- Identify which prompts haven't been processed yet
- Useful when you want to re-run only the unprocessed prompts

**Display:**

- Shows as "Not Created" in the filter dropdown and badge
- Purple badge on filter button when active

### 2. Sort By Feature

**Sort Options:**

#### By Index (Default)

- Sorts prompts by their array position
- Maintains the order you added them in
- Useful for following a specific workflow sequence

#### By Status

- Sorts prompts by status priority:
  1. **Failed** (red) - highest priority
  2. **Processing** (blue) - in progress
  3. **Completed** (green) - done
  4. **Idle** (gray) - not started
- Within each status group, sorts by array index
- Useful for finding and focusing on problem videos or prioritizing work

**UI:**

- Sort button appears next to filter button
- Shows current sort mode (e.g., "By Index" or "By Status")
- ArrowUpDown icon for visual recognition
- Click to toggle between sort modes

## Implementation Details

### Store Updates (video-creation.store.ts)

```typescript
// New state
sortBy: "index" | "status";  // Track current sort preference

// New action
setSortBy: (sortBy: "index" | "status") => void;  // Change sort mode
```

**Persistence:** Both `sortBy` and `statusFilter` are persisted to localStorage.

### Filtering Logic (SingleVideoCreationPage.tsx)

```typescript
// Filter by status (including new "idle" filter)
const filteredPrompts = prompts
  .filter((prompt) => {
    if (statusFilter === "all") return true;
    const job = jobs.find((j) => j.promptId === prompt.id);
    if (statusFilter === "idle") {
      return !job; // No job exists
    }
    return job?.status === statusFilter;
  })
  .sort((a, b) => {
    if (sortBy === "status") {
      // Priority: failed → processing → completed → idle
      // Then by index
    }
    return a.order - b.order; // By index
  });
```

### UI Components (JsonToolbar.tsx)

**Filter Dropdown:**

- Now includes "Not Created" option
- Wider popover (w-48) to accommodate longer labels
- Displays "Not Created" badge instead of "Idle"

**Sort Button:**

- New button with ArrowUpDown icon
- Toggles between "By Index" and "By Status"
- Positioned next to filter button
- Shows current sort mode in label

## Filter Combinations

You can combine filters and sorts for flexible organization:

| Filter      | Sort      | Result                                         |
| ----------- | --------- | ---------------------------------------------- |
| All         | By Index  | All prompts in add order                       |
| All         | By Status | Failed first, then processing, completed, idle |
| Completed   | By Index  | Completed prompts in add order                 |
| Completed   | By Status | All completed (status sort has no effect)      |
| Not Created | By Index  | Unprocessed prompts in add order               |
| Not Created | By Status | Unprocessed prompts (all same status)          |
| Processing  | By Status | Processing prompts (all same status)           |
| Failed      | By Status | Failed prompts (all same status)               |

## Use Cases

### Case 1: Find Problem Videos

1. Click **Filter** → Select **Failed**
2. Click **Sort** → Select **By Status** (or keep **By Index**)
3. See all failed videos grouped and prioritized

### Case 2: Process New Prompts

1. Click **Filter** → Select **Not Created**
2. Click **Sort** → Select **By Index**
3. See unprocessed prompts in the order you added them

### Case 3: Monitor Progress

1. Click **Filter** → Select **All**
2. Click **Sort** → Select **By Status**
3. See processing items at top, completed below, pending at bottom

### Case 4: Check Completion Status

1. Click **Filter** → Select **Completed**
2. Click **Sort** → Select **By Index**
3. Review finished videos in creation order

## Status Colors Reference

```
Idle/Not Created  → Gray
Processing        → Blue
Completed         → Green
Failed            → Red
```

## Technical Notes

### Store Persistence

- `sortBy` is automatically saved to localStorage
- Preference persists across app restarts
- Stored alongside other UI state (statusFilter, globalPreviewMode)

### Performance

- Filtering: O(n) - single pass through prompts
- Sorting: O(n log n) - efficient array sort
- Re-renders only when filter/sort changes (memoized via zustand)

### Job Status Mapping

```typescript
// How jobs determine if a prompt is "idle"
const isIdle = !jobs.find((j) => j.promptId === prompt.id);

// Available job statuses
type JobStatus = "idle" | "processing" | "completed" | "failed";
```

## Related Components

- **JsonToolbar.tsx** - Filter and sort UI buttons
- **video-creation.store.ts** - Store state and actions
- **SingleVideoCreationPage.tsx** - Filter/sort logic and application
- **VideoPromptRow.tsx** - Individual prompt display

## Future Enhancements

1. **Save Sort Preferences Per Filter**

   - Remember which sort was active for each filter
   - Auto-apply when switching filters

2. **Custom Sort Options**

   - Sort by creation time
   - Sort by last modified
   - Custom sort order via drag-and-drop

3. **Advanced Filtering**

   - Filter by profile or project
   - Filter by generation time range
   - Text search in prompts

4. **Batch Operations**

   - Apply actions to sorted/filtered groups
   - "Delete all failed" with one click
   - "Download all completed" for current filter

5. **Sort Direction Toggle**
   - Ascending/descending for each sort option
   - Add sort direction indicator (↑/↓)
