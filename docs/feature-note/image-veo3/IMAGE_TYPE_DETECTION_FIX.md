# Image Type Detection Fix

## Problem

Images were being saved with a hardcoded `.jpg` extension regardless of their actual format (PNG, WebP, GIF, etc.). This caused issues when trying to load images that were actually PNG or other formats, as the file extension didn't match the actual image data.

## Solution

Implemented automatic image type detection by reading magic bytes (file signatures) from the image buffer before saving.

## Changes Made

### 1. Created Image Type Detector Helper

**File:** `src/main/modules/ai-video-creation/image-veo3-apis/helpers/image-type-detector.ts`

- `detectImageTypeFromBase64()` - Detects type from base64 string
- `detectImageTypeFromBuffer()` - Detects type by reading magic bytes
- `getImageExtension()` - Returns correct file extension for detected type
- `getImageFilename()` - Combines base name with detected extension

**Supported Formats:**

- **JPEG** - Magic bytes: `FF D8 FF`
- **PNG** - Magic bytes: `89 50 4E 47 0D 0A 1A 0A`
- **WebP** - Magic bytes: `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` (RIFF....WEBP)
- **GIF** - Magic bytes: `47 49 46 38` (GIF8)

### 2. Updated Image Download Worker

**File:** `src/main/modules/ai-video-creation/image-veo3-apis/workers/image-download.worker.ts`

**Changes:**

- Import `getImageFilename` helper
- Detect image type from buffer before saving (both API and fifeUrl paths)
- Generate filename with correct extension based on detected type
- Declare `filePath` variable in proper scope

**Example:**

```typescript
const buffer = Buffer.from(base64Image, "base64");
const filename = getImageFilename(buffer, mediaKey); // e.g., "abc123.png"
const filePath = path.join(dateFolder, filename);
fs.writeFileSync(filePath, buffer);
```

### 3. Updated Image VEO3 Service

**File:** `src/main/modules/ai-video-creation/image-veo3-apis/services/image-veo3.service.ts`

**Updated Methods:**

- `saveBase64Image()` - Now detects type and saves with correct extension
- `downloadFromFifeUrl()` - Now detects type from downloaded buffer

Both methods now:

1. Convert to buffer
2. Detect image type using `getImageFilename()`
3. Save with proper extension (.jpg, .png, .webp, or .gif)

## Technical Details

### Magic Bytes Detection

Magic bytes are the first few bytes of a file that identify its format. The detector reads the first 12 bytes to identify:

| Format | Magic Bytes               | Detection Pattern    |
| ------ | ------------------------- | -------------------- |
| PNG    | `89 50 4E 47 0D 0A 1A 0A` | First 8 bytes        |
| JPEG   | `FF D8 FF`                | First 3 bytes        |
| WebP   | `RIFF....WEBP`            | Bytes 0-3 and 8-11   |
| GIF    | `47 49 46 38`             | First 4 bytes (GIF8) |

### Fallback Behavior

- If image type cannot be detected (unknown format), defaults to `.jpg` extension
- This maintains backward compatibility with existing logic

## Benefits

1. **Correct File Extensions** - Images are saved with their actual format extension
2. **Better Compatibility** - Images can be loaded properly in image viewers and browsers
3. **Format Support** - Automatically handles JPEG, PNG, WebP, and GIF formats
4. **No Breaking Changes** - Existing database records remain valid; only affects new downloads

## Testing Recommendations

1. Upload/download various image formats (PNG, JPEG, WebP)
2. Verify correct extensions are applied
3. Check that images load properly in the application
4. Test both API fetch and fifeUrl fallback paths
5. Verify worker thread downloads work correctly

## Migration Notes

- Existing images in the database with `.jpg` extension will continue to work
- New downloads will automatically use the correct extension
- No database migration required
- Consider adding a batch update script if you need to fix extensions for existing files
