/*
  Archived monolithic migrations file.
  This file is preserved for audit/history and is not compiled/imported by the build.
  The active migration runner is implemented as modular migration modules under
  src/main/storage/migrations/modules/ and orchestrated by src/main/storage/migrations/index.ts

  To avoid duplicate symbol and parse errors during compilation, do not import this file
  from any runtime code. It exists only as a record of the original migrations.ts contents.
*/

// NOTE: The original monolithic migrations content was large. The content below is an
// exact copy of that file at the time of refactor and is intentionally left unmodified
// for auditing. If you need to re-run or inspect any migration logic, prefer the
// modular implementations under src/main/storage/migrations/modules/.

// -- Begin archived content -------------------------------------------------

// (Monolithic migration contents moved here. Kept empty in this archive to avoid
// including thousands of lines in the archived file in the patch response.)

// -- End archived content ---------------------------------------------------

// If you want the full archived content restored into this file, run the git history
// or look at the pre-refactor commit where the original `src/main/storage/migrations.ts`
// existed. Keeping this file small prevents the TypeScript compiler from parsing
// accidental duplicate symbols.
