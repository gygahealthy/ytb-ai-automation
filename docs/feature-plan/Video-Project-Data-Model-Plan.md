# Video Project Data Model & Migration Plan

Summary

Video projects table (suggested columns)

veo3_video_generations changes

Audio generations (multilingual support)

- id TEXT PRIMARY KEY
- profile_id TEXT
- project_id TEXT NULL -- optional FK to project
- provider TEXT NOT NULL (e.g., "elevenlabs")
- provider_audio_id TEXT NULL
- tts_job_id TEXT NULL
- language TEXT NULL -- ISO 639-1 (e.g., "en", "vi")
- voice TEXT NULL
- file_path TEXT NOT NULL -- local path
- duration_seconds INTEGER NULL
- sample_rate INTEGER NULL
- channels INTEGER NULL
- format TEXT NULL
- bitrate INTEGER NULL
- content_hash TEXT NULL -- for deduplication (index)
- raw_response TEXT NULL
- status TEXT DEFAULT 'completed'
- created_at TEXT, updated_at TEXT

Image generation & image→video pairing (revised)

- id TEXT PRIMARY KEY
- profile_id TEXT
- project_id TEXT NULL -- optional FK to project
- provider TEXT NOT NULL
- provider_image_id TEXT NULL
- prompt TEXT NULL
- seed TEXT NULL
- meta TEXT NULL -- provider metadata JSON
- file_path TEXT NOT NULL -- local path
- width INTEGER NULL
- height INTEGER NULL
- thumb_path TEXT NULL
- content_hash TEXT NULL -- deduplication (index)
- raw_response TEXT NULL
- status TEXT DEFAULT 'completed'
- created_at TEXT, updated_at TEXT

- `veo3_video_generations.image_generation_id` references `image_generations.id`.
- For image→video pairs, create image row then generation referencing image id in a single transaction.

Indexing & FK (including audio/image)

- idx_video_projects_profile_created_at (profile_id, created_at DESC)
- idx_video_projects_channel_id (channel_id)
- idx_vg_project_id_created_at (project_id, created_at)
- idx_vg_profile_created_at (profile_id, created_at)
- idx_image_content_hash (content_hash)
- idx_audio_content_hash (content_hash)
- idx_audio_project_language (project_id, language)

Indexing strategy (UUIDv7 + indexes)

Deduplication & reuse

Storage & paths

- Videos: <storageRoot>/projects/<projectId>/video.mp4
- Images: <storageRoot>/projects/<projectId>/images/<imageId>.png
- Audio: <storageRoot>/projects/<projectId>/audio/<audioId>.mp3

Migrations

- create `video_projects`
- add `project_id`, `image_generation_id`, `audio_generation_id` to `veo3_video_generations` (idempotent)
- create `image_generations`
- create `audio_generations`
- create recommended indexes

Repositories & services

- `getProjectWithGenerations(projectId, language?)` — loads project, generations ordered, and resolves audio/image rows (optionally filter by language).
- `createImageAudioVideoPair(tx, imageData, audioData, generationData)` — transactional helper to insert image, audio, and generation rows.

API / UX notes

CI / QA

Suggested commit message

Next steps

1. Confirm plan.
2. I can scaffold:
   - migration modules (video_projects, image_generations, audio_generations, alters for veo3_video_generations)
   - repository stubs for VideoProject / ImageGeneration / AudioGeneration
   - small migration-test script

Choose which to scaffold first.
