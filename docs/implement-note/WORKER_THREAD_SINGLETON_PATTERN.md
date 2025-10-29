# ⚠️ CRITICAL: Worker Thread Singleton Pattern

**Last Updated**: October 28, 2025  
**Status**: IMPORTANT - Architecture Decision  
**Affects**: All Worker Threads, Repository Singletons, Module Initialization

---

## Problem Summary

Repository singletons are **instantiated at module load time** when exported as:

```typescript
export const profileRepository = new ProfileRepository();
```

When a worker thread imports such a repository module, the constructor runs immediately:

```typescript
constructor(db?: SQLiteDatabase) {
  super("profiles", db || database.getSQLiteDatabase());  // ❌ BOOM in worker!
}
```

Since the worker hasn't provided a `db` parameter, it tries to access `database.getSQLiteDatabase()`, which checks `if (!isMainProcess())` and **throws**:

```
Error: Cannot access database singleton from worker thread.
Use SQLiteDatabase directly with a provided dbPath.
```

---

## Root Cause

1. Worker thread imports a module (e.g., `await import("profile.repository.js")`)
2. Module initialization code runs, including singleton creation
3. Singleton constructor calls `database.getSQLiteDatabase()`
4. Database module detects worker thread and throws error
5. Worker initialization fails, polling stops

This was especially problematic when:

- ProfileRepository was imported by cookie.service.ts (used by worker)
- Cookie service itself was also using a Proxy that triggered database access

---

## Solution: Lazy Proxy Pattern

**Replace eager singleton with lazy getter:**

```typescript
// ❌ BEFORE (fails in worker threads)
export const profileRepository = new ProfileRepository();

// ✅ AFTER (deferred instantiation)
let _profileRepositoryInstance: ProfileRepository | null = null;

function getProfileRepository(): ProfileRepository {
  if (!_profileRepositoryInstance) {
    _profileRepositoryInstance = new ProfileRepository();
  }
  return _profileRepositoryInstance;
}

export const profileRepository = new Proxy({} as ProfileRepository, {
  get(_target, prop) {
    return getProfileRepository()[prop as keyof ProfileRepository];
  },
});
```

**Key Benefits:**

- Singleton only instantiated on **first access**, not module load
- Worker threads can safely import the module without triggering database access
- Main process gets same convenient API: `profileRepository.findById(...)`
- Backward compatible—existing code doesn't change

---

## Worker Thread Implementation

When creating a worker thread, follow this pattern:

```typescript
// veo3-polling.worker.ts
async function initializeWorker() {
  const dbPath = process.env.DB_PATH;

  // 1. Import CLASSES, not singletons
  const genRepoModule = await import("../repository/video-generation.repository.js");
  const VideoGenerationRepositoryClass = genRepoModule.VideoGenerationRepository;

  // 2. Create worker's own database instance
  const dbModule = await import("../../../../storage/sqlite-database.js");
  const SQLiteDatabase = dbModule.SQLiteDatabase;
  const database = new SQLiteDatabase(dbPath);

  // 3. Instantiate repositories with worker's database
  const videoGenerationRepository = new VideoGenerationRepositoryClass(database);

  // Now safe to use worker's own repositories
  await videoGenerationRepository.find(...);
}
```

**Critical Rules:**

- Never import **singletons** in worker threads (e.g., `import { profileRepository }`)
- Import **classes** instead, then instantiate with worker's own database
- Set `DB_PATH` environment variable when spawning worker thread
- Worker owns its database connection—no sharing with main process

---

## Affected Repositories (As of Oct 28, 2025)

### ✅ Already Fixed (Lazy Proxy)

- `video-generation.repository.ts`
- `video-upscale.repository.ts`
- `profile.repository.ts`

### ⚠️ Not Yet Fixed (Eager Instantiation)

These still use the old pattern but are **not imported by worker threads**:

- `automation.repository.ts`
- `veo3-project.repository.ts`
- `channel-topic.repository.ts`
- `channel-playlist.repository.ts`
- `youtube.repository.ts` (2 singletons)
- `channel-performance.repository.ts`
- `channel-deep-dive.repository.ts`
- `channel-competitor.repository.ts`

**Status**: Safe to leave as-is unless these modules are later imported by worker threads. Fix on-demand if new workers are created.

---

## Testing Checklist

When adding a new worker thread:

- [ ] Worker imports repository **classes**, not singletons
- [ ] Worker creates own `SQLiteDatabase` instance
- [ ] Worker passes database to repository constructors
- [ ] `DB_PATH` environment variable is set before spawning worker
- [ ] Run `npm run dev` and verify:
  - Worker initializes without "Cannot access database singleton" error
  - Worker successfully performs polling/background tasks
  - No database errors in terminal output

---

## Debugging Tips

If you see:

```
Error: Cannot access database singleton from worker thread
```

**Checklist:**

1. Worker is importing a singleton instead of the class?
   - Change: `import { profileRepository }` → `import { ProfileRepository }`
2. Repository still has eager instantiation?
   - Apply lazy Proxy pattern (see Solution section)
3. Worker's own database not passed to repository?
   - Ensure: `new RepositoryClass(workerDatabase)`
4. Service or utility imported by worker is accessing main process database?
   - Services should accept `db` parameter in constructor

---

## Architecture Notes for Future Developers

When creating new repositories:

1. Always export both the **class** and a **lazy singleton**
2. Constructor should accept optional `db` parameter:
   ```typescript
   constructor(private db?: SQLiteDatabase) {
     this.db = db || database.getSQLiteDatabase();
   }
   ```
3. Export lazy Proxy immediately (don't instantiate eagerly):
   ```typescript
   export const myRepository = new Proxy({} as MyRepository, {
     get(_target, prop) {
       if (!_instance) _instance = new MyRepository();
       return _instance[prop];
     },
   });
   ```

This ensures repositories are simultaneously:

- **Safe for worker threads** (deferred initialization)
- **Convenient for main process** (transparent singleton access)
- **Flexible** (can be instantiated with custom database)

---

## Related Files

- `src/main/storage/database.ts` - Main process database singleton with worker detection
- `src/main/storage/sqlite-database.ts` - Low-level database wrapper
- `src/main/modules/ai-video-creation/flow-veo3-apis/workers/veo3-polling.worker.ts` - Worker implementation example
- Migration `028_relax_upscale_foreign_keys.ts` - Related FK constraint fix

---

## Timeline

- **Oct 28, 2025**: Issue identified and fixed. ProfileRepository converted to lazy Proxy.
- **Root Cause**: Eager singleton instantiation triggering database access in worker thread context
- **Solution Applied**: Lazy Proxy pattern for deferred instantiation
- **Current Status**: Worker thread initializes successfully ✅
