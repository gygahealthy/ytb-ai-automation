# Prompt Component Registration — Design Note

Date: 2025-10-26

This note captures a design for a hook-based system that allows components (buttons, inputs, or custom components) to register themselves and be mapped to "master prompts" at the page level. The mapping is persisted to the app database so non-developers can rewire which component triggers which prompt.

## Summary

- Components call a hook to register and receive a generated stable id and helper props.
- A page-level mapping UI lets an admin assign a registered component to a master prompt.
- Mappings are stored in the database (authoritative). The hook keeps a runtime registry and merges with DB records on page load.

## Contract (inputs / outputs / behavior)

- Inputs: registration spec { type, suggestedPromptIds?, inputSchema?, meta?, requestedId? }
- Outputs: { id, propsToAttach, unregister }, plus helpers: getMapping(id), invokePrompt(id, payload), listRegisteredForPage()
- Behavior: registration is ephemeral until saved by the mapping UI. DB is authoritative; hook reconciles DB ↔ runtime.

## Hook API (suggestion)

- usePromptRegistration(pageId: string)
  - registerComponent(spec) => { id, props, unregister }
  - getMapping(id)
  - invokePrompt(id, runtimePayload)
  - listRegisteredForPage()

Implementation notes:

- Register/unregister on mount/unmount (useEffect). Prefer deterministic ids when possible (page + component name + index). Allow client-specified id to preserve mappings across builds.
- For inputs, provide an extraction helper (or allow input_binding to be a small JS expression/templating string).

## Database model (recommended)

- Table: prompt_component_regs
  - id: TEXT PRIMARY KEY
  - page_id: TEXT NOT NULL
  - component_type: TEXT
  - prompt_id: TEXT NULL
  - input_binding: TEXT NULL (JSON or templated expression)
  - meta: JSON NULL
  - version: INTEGER DEFAULT 1
  - updated_at: INTEGER

Notes:

- Follow existing migration pattern (create module in `src/main/storage/migrations/modules` and register it in the migrations index).
- DB is authoritative: on page load, hook fetches all regs for page and merges with runtime registered components.

## Page-level Mapping UI (UX)

- Left: list of registered components (id, label, type, meta).
- Right: searchable prompt list for assignment. Row-level assign/unassign and a Test button to run prompt with sample payload.
- Validation: show schema mismatches between component input and prompt input schema.
- Optimistic UI with versioned save to detect concurrent edits.

## Runtime execution flow

1. User interacts with component (e.g., click).
2. Hook resolves mapping for id → prompt_id.
3. Build payload using input_binding (extract value or transform) and page/context metadata.
4. Call prompt runner (IPC or in-renderer) and handle result (toast, store result, UI update).

## Edge cases & mitigations

- Dynamic mount/unmount: keep runtime registry ephemeral; mappings saved explicitly.
- Duplicate ids: detect and warn; prefer unique deterministic ids.
- Concurrent edits: use `version` column and optimistic concurrency; merge or prompt user on conflicts.
- Offline DB: read-only mode with client cache (IndexedDB) for queued saves.

## Security & permissions

- Only surface prompts the user is allowed to invoke. Validate payloads server-side/main process. Audit runs for tracing and compliance.

## Developer ergonomics

- Devtools overlay showing registered components with ids and mappings.
- `suggestedPromptIds` metadata for auto-assign helpers.
- Programmatic API to register test components in unit/integration tests.

## Tests & rollout

- Unit tests for register/unregister, mapping merge, and invokePrompt payload building.
- Integration tests for mapping UI and end-to-end prompt invocation.
- Rollout behind feature flag; monitor unmapped components and invocation errors.

## Minimal incremental implementation plan

1. Implement runtime hook + dev overlay (no DB) to validate registration flow.
2. Add DB migration & sync logic (merge DB ↔ runtime at load).
3. Implement simple mapping UI (assign/unassign, test-run).
4. Add optimistic saves, versioning, and conflict handling.
5. Add tests and enable feature flag for staged rollout.

## Extras (optional but recommended)

- Allow templated transformations (JSONata/handlebars) for input_binding.
- Store mapping history and allow rollback.
- Support global vs page-scoped mappings.

---

For implementation details (interfaces, validation rules, migration stub) I can draft the TypeScript types and a migration file next — tell me if you want that drafted into the repo or just the design notes.
