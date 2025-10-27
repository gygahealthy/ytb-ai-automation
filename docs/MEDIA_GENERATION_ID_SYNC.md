# Media Generation ID Sync - Complete Setup

## 📋 Summary

A new utility script has been added to recover and sync `mediaGenerationId` values from stored response data in your database. This is useful for backfilling historical records that were saved before the media generation ID extraction feature was implemented.

## 🗂️ Files Created/Modified

### New Files

- ✅ `scripts/sync-media-generation-ids.js` - Main sync script
- ✅ `scripts/SYNC_MEDIA_GEN_IDS_README.md` - Detailed documentation
- ✅ `scripts/README.md` - Scripts directory overview

### Modified Files

- ✅ `package.json` - Added npm script: `sync:media-gen-ids`

## 🚀 Quick Start

### 1. Build the project first

```bash
npm run build
```

### 2. Run the sync script

```bash
npm run sync:media-gen-ids
```

Or directly:

```bash
node scripts/sync-media-generation-ids.js
```

## 📊 What the Script Does

The script processes existing database records to extract and store `mediaGenerationId`:

### Input Data Structure

Looks for `mediaGenerationId` in VEO3 API responses:

```json
{
  "operations": [
    {
      "mediaGenerationId": "CAUSJGI4NWI1YjYx...",  ← Top-level
      "operation": {
        "metadata": {
          "video": {
            "mediaGenerationId": "CAUSJGI4NWI1YjYx..."  ← Or nested here
          }
        }
      },
      "status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"
    }
  ]
}
```

### Processing Steps

1. **Scan**: Finds records where `raw_response IS NOT NULL` and `media_generation_id IS NULL`
2. **Extract**: Parses JSON and looks for `mediaGenerationId` in two possible locations
3. **Update**: Sets the `media_generation_id` column with extracted value
4. **Report**: Displays statistics (synced, skipped, failed)

### Output Example

```
🔍 Scanning for records with raw_response but null media_generation_id...

Found 5 records to sync:

✅ Synced: abc12345... -> CAUSJGI4NWI1YjYx...
✅ Synced: def67890... -> CAUSJGI4NWI1YjYx...
⏭️  Skipped: ghi24680... (no mediaGenerationId in response)
✅ Synced: jkl13579... -> CAUSJGI4NWI1YjYx...
✅ Synced: mno86420... -> CAUSJGI4NWI1YjYx...

📊 Summary:
   ✅ Synced:  4
   ⏭️  Skipped: 1
   ❌ Failed:  0
   📈 Total:   5

🎉 Successfully synced 4 media generation IDs!
```

## 🔍 Database Impact

### Updates Made

- **Column**: `veo3_video_generations.media_generation_id`
- **Also Updates**: `updated_at` timestamp to current time
- **Condition**: Only records with `raw_response` but null `media_generation_id`

### Safe Operations

- ✅ Read-only scan first
- ✅ Only updates null values (never overwrites)
- ✅ Max 1000 records per run (prevents long locks)
- ✅ Detailed error reporting
- ✅ Transaction-safe with better-sqlite3

## 📈 When to Run

Run this script when:

- ✅ You've just updated the VEO3 status checker service
- ✅ You want to sync historical video data
- ✅ You notice `media_generation_id` is mostly NULL
- ✅ You're preparing features that depend on this field
- ✅ As a data maintenance task (safe to run multiple times)

## ⚙️ Technical Details

### Dependencies

- `better-sqlite3` - Already in your project dependencies
- Node.js 14+ - For ES6+ syntax support

### Error Handling

- Gracefully skips records with parsing errors
- Reports failed records individually
- Returns exit code 1 if any errors occur
- Returns exit code 0 on success

### Performance

- Processes max 1000 records per run
- Uses prepared statements (efficient)
- Single transaction per batch
- Suitable for large datasets (run multiple times if needed)

## 🔗 Related Changes

This script works with these recent changes:

1. **veo3-status-checker.service.ts** - Now extracts and stores:

   - `mediaGenerationId`
   - `fifeUrl`
   - `servingBaseUri`

2. **video-generation.repository.ts** - Already supports updating these fields

## 📚 Documentation

For more details, see:

- `scripts/SYNC_MEDIA_GEN_IDS_README.md` - Full documentation
- `scripts/README.md` - Scripts directory overview
- `src/main/modules/ai-video-creation/flow-veo3-apis/repository/video-generation.repository.ts` - Database schema

## 🎯 Next Steps

1. ✅ Build the project: `npm run build`
2. ✅ Run the sync: `npm run sync:media-gen-ids`
3. ✅ Verify your database has media_generation_ids populated
4. ✅ Future videos will have this field automatically populated

---

**Questions?** Check the README files or review the script source code - both are well-documented!
