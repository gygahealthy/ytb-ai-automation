# Circular Pagination Fix

**Date**: October 31, 2025  
**Module**: `image-veo3-apis`  
**Issues**:

1. Infinite loop during image metadata sync (circular pagination)
2. TRPC cursor not working - always fetching same first page

## Problem 1: Circular Pagination

The Flow API's pagination returns the same images in a circular pattern when using wrong cursor format.

## Problem 2: TRPC Cursor Bug (CRITICAL)

**Root cause**: The TRPC API has a **special pagination format**:

- **First page** (`cursor=null`): Must include `meta.values.cursor: ["undefined"]`
- **Subsequent pages** (cursor provided): Must **REMOVE `meta` object entirely**

### Wrong Implementation (Always fetched page 1):

```typescript
const inputParam = {
  json: { cursor: "page2Token" },
  meta: {
    values: {
      cursor: ["page2Token"], // ❌ Wrong! This breaks pagination
    },
  },
};
```

### Correct Implementation:

```typescript
// First page
const inputParam = {
  json: { cursor: null },
  meta: {
    values: {
      cursor: ["undefined"], // ✅ Required for first page
    },
  },
};

// Second+ pages
const inputParam = {
  json: { cursor: "actualCursorToken" },
  // ✅ No meta object at all!
};
```

## Solution Implemented

- Page 1: Images 1-18, returns `nextPageToken`
- Page 2: Images 19-36, returns `nextPageToken`
- Page 3: Images 37-54, returns `nextPageToken` (but these are duplicates of Page 1)
- Page 4: Images 1-18 again (circular loop starts)

This caused the sync to run infinitely, creating hundreds of database operations:

```
Processed page 1: 18 new + 0 updated = 18 total
Processed page 2: 18 new + 18 updated = 36 total
Processed page 3: 18 new + 36 updated = 54 total
Processed page 4: 18 new + 54 updated = 72 total  ← All updates, no new images
...continues forever...
```

## Root Cause

The API always returns `nextPageToken` even when pagination loops back to already-seen images. Relying only on `nextPageToken === null` doesn't work for circular APIs.

## Solution

Track seen image names using a `Set` and detect when we encounter duplicates:

```typescript
const seenImageNames = new Set<string>();

// For each page, check duplicate rate BEFORE processing
let duplicateCount = 0;
for (const workflow of images) {
  const name = cleanImageName(workflow.name);
  if (seenImageNames.has(name)) {
    duplicateCount++;
  }
}

// Stop conditions:
if (duplicateCount === images.length) {
  // All images are duplicates - we've looped back
  logger.info("Circular pagination detected: all images already processed. Stopping.");
  break;
}

if (duplicateCount > images.length / 2) {
  // More than 50% duplicates - likely circular
  logger.warn("High duplicate rate detected. Stopping pagination.");
  break;
}

// Otherwise, process images and add to seen set
for (const workflow of images) {
  const name = cleanImageName(workflow.name);
  seenImageNames.add(name);
  // ... process image ...
}
```

## Expected Behavior After Fix

```
Processed page 1: 18 images (0 duplicates), 18 new + 0 updated = 18 total unique
Processed page 2: 18 images (0 duplicates), 36 new + 0 updated = 36 total unique
Processed page 3: 18 images (12 duplicates), 42 new + 0 updated = 42 total unique
Circular pagination detected at page 4: all 18 images already processed. Stopping.
Image metadata sync completed: 42 new images, 0 updated from 3 pages (42 unique images)
```

## Files Changed

- `src/main/modules/ai-video-creation/image-veo3-apis/services/image-veo3.service.ts`
  - Added `seenImageNames: Set<string>` tracking
  - Added duplicate detection before processing each page
  - Added early exit when circular pagination detected
  - Updated logs to show duplicate count and unique image count

## Testing

1. Start with empty database
2. Click "Sync All Images"
3. Verify logs show:
   - Duplicate count increases on later pages
   - "Circular pagination detected" message when loop starts
   - Final count matches actual unique images in account (e.g., 42)
4. Check database has correct number of unique records
5. Click "Sync" again - should update existing images, not create duplicates

## API Behavior Notes

From testing with real API responses (see `docs/implement-note/veo3-img-get-images-curl.md`):

- Page 1: 18 images, `nextPageToken` provided
- Page 2: 18 different images, `nextPageToken` provided
- Page 3: Mix of new and duplicate images, `nextPageToken` loops back

This is a **time-based pagination API** that may refresh its result set between calls, making simple token-based pagination unreliable for detecting "end of results".
