# Cookie Extraction Service — Design & Implementation Plan

**Status**: Refined & Ready for Implementation

**Date**: October 25, 2025

---

## 📋 Summary

This document proposes extracting the browser cookie extraction responsibilities out of `cookie.service.ts` into a dedicated `CookieExtractionService` while keeping the existing low-level helpers in `src/main/modules/common/cookie/helpers/cookie-extraction.helpers.ts` untouched.

**✨ This plan has been refined and expanded into detailed implementation guides.**

👉 **See the complete implementation documentation in [`docs/feature-plan/cookie-extraction/`](./cookie-extraction/)**

---

## 🚀 Quick Navigation

For detailed implementation guides, refer to:

- **[README.md](./cookie-extraction/README.md)** — Implementation summary & quick start
- **[00_OVERVIEW.md](./cookie-extraction/00_OVERVIEW.md)** — Complete architecture overview
- **[01_SERVICE_IMPLEMENTATION.md](./cookie-extraction/01_SERVICE_IMPLEMENTATION.md)** — Service code implementation
- **[02_MIGRATION_GUIDE.md](./cookie-extraction/02_MIGRATION_GUIDE.md)** — Database migration
- **[03_REPOSITORY_UPDATES.md](./cookie-extraction/03_REPOSITORY_UPDATES.md)** — Repository changes
- **[04_SERVICE_DELEGATION.md](./cookie-extraction/04_SERVICE_DELEGATION.md)** — CookieService updates
- **[05_MANAGER_INTEGRATION.md](./cookie-extraction/05_MANAGER_INTEGRATION.md)** — Manager validation
- **[06_TESTING_PLAN.md](./cookie-extraction/06_TESTING_PLAN.md)** — Comprehensive testing
- **[07_ROLLOUT_CHECKLIST.md](./cookie-extraction/07_ROLLOUT_CHECKLIST.md)** — Deployment checklist

---

## Original Plan (High-Level Overview)

## Goals

- Separate concerns: keep DB CRUD and business rules in `CookieService` and move Puppeteer/browser lifecycle + extraction logic to a focused service.
- Support adaptive extraction per-record: different pages/URLs can specify different required cookie sets.
- Preserve backward compatibility and minimize risk: `CookieService` will delegate to the new service (thin wrapper) so handlers and IPC calls keep working.
- Improve testability and reuse.

## Design overview

1. Layers

   - Helpers: `cookie-extraction.helpers.ts` (existing) — low-level, pure-ish helpers for navigation, polling and formatting. Do NOT change.
   - Extraction service (new): owns browser lifecycle (launch/teardown), calls helpers to navigate + extract, performs validation against a caller-provided `requiredCookies` array and returns structured results.
   - CookieService (existing): keeps DB persistence and high-level orchestration. It will call the extraction service for extraction tasks and will continue to use `CookieRepository` for inserts/updates.
   - CookieManagerDB (existing): runtime manager that loads DB records and runs rotation — will read `requiredCookies` metadata and validate the in-memory jar.

2. Adaptive extraction
   - Each cookie DB record may declare an array of `requiredCookies` (cookie names that must be present for the extraction to be considered valid for that page).
   - Extraction service accepts options including `targetUrl`, `requiredCookies`, `headless`, `maxWaitMs`, `inactivityThresholdMs`.
   - The response contains both the raw extraction (`cookies`, `cookieString`) and a `validation` object: `{ valid: boolean; missing: string[] }`.

## API: CookieExtractionService (proposed)

File: `src/main/modules/common/cookie/services/cookie-extraction.service.ts`

Export: class CookieExtractionService

- async extractCookiesFromBrowser(profile: Profile, options?: ExtractOptions): Promise<ApiResponse<ExtractResult>>

  - ExtractOptions: { targetUrl?: string; headless?: boolean; requiredCookies?: string[]; maxWaitMs?: number; inactivityThresholdMs?: number }
  - ExtractResult: {
    cookieString: string;
    cookies: any[]; // Puppeteer cookie objects
    validation: { valid: boolean; missing: string[] };
    earliestExpiry?: string;
    domains: string[];
    }

- convertCookiesForDb(cookies: any[]): { cookieString: string; earliestExpiry?: string; domains: string[] }

  - Pure helper that uses existing `toCookieString` helper and computes earliest expiry.

- validateCookies(cookies: any[], requiredCookies?: string[]): { valid: boolean; missing: string[] }

## Behavior notes

- `extractCookiesFromBrowser` will: launch the browser via `launchBrowser(profile, headless)`, create/get a page, call `navigateAndExtractCookies(page, targetUrl, headless)` (from helpers), compute `cookieString` + `earliestExpiry`, run `validateCookies`, and always perform robust teardown (close page, close or disconnect browser, kill chromeProcess) in `finally` to avoid leaks.
- It will return the `ExtractResult` even if validation fails (validation flags will indicate missing cookies).
- Default policy for `maxWaitMs` and `inactivityThresholdMs` should be the same as the helpers (or overridden by options).

## Database migration: `requiredCookies`

Proposal: add a JSON/text column to the cookies table to store the array of required cookie names per record.

- Column name: `requiredCookies` (TEXT) — JSON encoded array, e.g. `['__Secure-1PSID','__Secure-1PSIDTS']`.
- Migration behavior:
  - If column missing: run `ALTER TABLE cookies ADD COLUMN requiredCookies TEXT DEFAULT NULL;`.
  - Keep default NULL to preserve legacy permissive behavior.
  - Update repository read/write to parse/stringify JSON when reading/writing `requiredCookies`.
  - Register migration in `src/main/storage/migrations/index.ts` per the project's migration pattern.

## Repository & types

- Update Cookie type (TypeScript): `requiredCookies?: string[]`.
- Update `CookieRepository` read mapping to JSON.parse on read (if non-null) and JSON.stringify on write.

## CookieService changes (minimal delegations)

- Replace the heavy `extractCookiesFromBrowser` implementation with a thin delegator that calls `CookieExtractionService.extractCookiesFromBrowser` and returns the same ApiResponse shape. Keep API stable and mark method as delegating (and add a comment for deprecation if desired).
- Keep `extractAndStoreCookiesFromPage` logic for persistence, but delegate the conversion `cookie array -> cookieString + earliestExpiry` to the new service's `convertCookiesForDb` helper to avoid duplication.

## CookieManagerDB changes

- When loading a DB entity, parse `requiredCookies` into an array and store it on the manager instance.
- When validating or after rotation, manager should run current cookie jar through the same `validateCookies` logic and, on failure, either log/report or optionally trigger a re-extraction attempt.

## Handlers/UI/API

- When creating/updating cookie entities allow optional `requiredCookies` field in the payload (array of cookie names).
- Handlers that trigger extraction should accept `requiredCookies` or read them from the DB record.

## Testing plan

- Unit tests for helpers (existing) — use mock page.cookies() to simulate branches.
- Unit tests for CookieExtractionService:
  - headless extraction returns cookies and valid=true when required cookies present
  - non-headless extraction polls and returns valid=false when required cookies never appear
  - ensure teardown called on success and on exception (mocked browser/page)
- Unit tests for repository changes: ensure `requiredCookies` is read/written correctly (JSON round-trip).
- Integration: admin extraction -> store with requiredCookies -> manager validates on load.

## Rollout & backward compatibility

- Migration adds `requiredCookies` as NULL for existing records. Treat NULL as "no explicit required cookies" to preserve current behavior.
- Start by delegating in `CookieService` to the new extraction service (no handler changes). Add UI support for editing `requiredCookies` later and opt-in for records that need it.

## Security and logging

- Cookie strings are sensitive. Keep logs minimal for production (avoid printing raw cookieString). Use summary logs already present in helpers.

## Estimated effort

- Service file + delegations: 30–60 minutes
- Migration + repository updates: 20–40 minutes
- Unit + integration tests: 60–120 minutes
- UI/handler wiring: 30–60 minutes (optional)

## Next steps (pick one)

1. I draft the `CookieExtractionService` TypeScript file and update `cookie.service.ts` to delegate (I will run quick lint/build checks). I will NOT modify `cookie-extraction.helpers.ts`.
2. I produce a migration scaffold file for `requiredCookies` and a repository change plan only (no service code edits).
3. You apply the design manually; I provide a detailed PR checklist.

Choose which action you want me to take next.
