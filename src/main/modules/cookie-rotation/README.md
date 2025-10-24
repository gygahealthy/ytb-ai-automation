# Cookie Rotation module

## Purpose

This module owns background cookie rotation workers, rotation configuration, and rotation monitors. It is intentionally separated from chat-related logic so its lifecycle, workers, and persistence can be managed independently.

Files created (scaffold)

- `manifest.json` — module manifest consumed by module-loader.
- `index.ts` — exports `manifest` and `registrations`.
- `handlers/registrations.ts` — IPC handler registrations (public API).
- `services/` — rotation services (config & worker manager).
- `repository/` — rotation monitor repository (DB access stubs).
- `helpers/` — small helper utilities.
- `workers/` — rotation worker stubs.
- `types/` — module types.

## Notes

- This scaffold is a non-invasive starting point. It intentionally uses permissive typing for IPC registrations to avoid tight coupling while migrating.
- Next steps: move rotation implementation files from `gemini-apis` into this module in small commits, update imports, add tests, and run build/lint.
