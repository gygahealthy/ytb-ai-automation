```curl
curl 'https://aisandbox-pa.googleapis.com/v1/media/CAUSJDlmYTBjNzcyLWEwMWYtNDI5Zi05NGI1LTRjM2Q2NWM1ODM4YRokNGQzMjZhYjgtZTNlNi00NjU0LTk0MjItNjE4YmU5MGNjNzJjIgNDQUUqJDNhZGY0YzY4LTVhNGUtNDRjYS04NzA3LTk5ZjU1NDdkY2U5NA?key=[SECRET]&clientContext.tool=PINHOLE' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer [SECRET]' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: qSH0RgPhYS+tEktJTy2ahvLDO9s=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: CIS2yQEIpLbJAQipncoBCPjeygEIlaHLAQiGoM0BCI2OzwE='
```

RESPONSE

```json
{
  "name": "CAUSJDlmYTBjNzcyLWEwMWYtNDI5Zi05NGI1LTRjM2Q2NWM1ODM4YRokNGQzMjZhYjgtZTNlNi00NjU0LTk0MjItNjE4YmU5MGNjNzJjIgNDQUUqJDNhZGY0YzY4LTVhNGUtNDRjYS04NzA3LTk5ZjU1NDdkY2U5NA",
  "video": {
    "encodedVideo": "[BASE64_STRING]",
    "seed": 24777,
    "mediaGenerationId": "CAUSJDlmYTBjNzcyLWEwMWYtNDI5Zi05NGI1LTRjM2Q2NWM1ODM4YRokNGQzMjZhYjgtZTNlNi00NjU0LTk0MjItNjE4YmU5MGNjNzJjIgNDQUUqJDNhZGY0YzY4LTVhNGUtNDRjYS04NzA3LTk5ZjU1NDdkY2U5NA",
    "prompt": "{\n  \"prompt\": \"A 3D animated scene. Wide establishing shot of a playroom dominated by calm blues and greens. The camera slowly and gently pushes in to a medium shot of Leo the Lion, who is meticulously focused, content, and humming softly. He is placing each block with extreme care to build a tall tower. His expression is one of calm concentration.\",\n  \"style\": [\n    \"high-quality 3D animation\",\n    \"mindful media aesthetic\",\n    \"calm and deliberate pace\",\n    \"soft, cinematic lighting\",\n    \"expressive character faces\"\n  ],\n  \"brand_identity\": {\n    \"color_palette\": {\n      \"primary_calm\": \"Calming Blue (#AEC6CF)\",\n      \"secondary_growth\": \"Growing Green (#B5C18E)\",\n      \"accent_emotional_cue\": \"Emotional Red (#D9534F)\",\n      \"text\": \"Dark Gray (#36454F)\"\n    },\n    \"typography\": {\n      \"font_family\": \"Clean, Rounded Sans-Serif\",\n      \"examples\": [\"Nunito\", \"Quicksand\"]\n    },\n    \"strategic_color_rule\": \"The 'accent_emotional_cue' (Red) is RESERVED EXCLUSIVELY for the 'Paws Moment' to visualize a character's frustration or anger.\"\n  },\n  \"camera_movement\": [\n    \"slow, gentle push-in\",\n    \"wide shot to medium shot\"\n  ],\n  \"audio\": {\n    \"music\": \"Gentle, constructive acoustic piano and ukulele music.\",\n    \"narrator_voice\": \"Warm, calm, patient, and reassuring. Slower pace with clear diction.\",\n    \"sound_effects\": [\n      \"soft 'clink' as blocks are placed\",\n      \"Leo's soft humming\"\n    ]\n  },\n  \"negative_prompt\": \"frenetic pace, fast motion, jump cuts, whip pans, shaky cam, loud synthesized pop music, jarring colors, low-quality 3D rendering, expressionless faces, text or captions at the bottom of the screen, blurry, watermark, morphing artifacts, unrealistic movement\"\n}",
    "fifeUrl": "https://storage.googleapis.com/ai-sandbox-videofx/video/3adf4c68-5a4e-44ca-8707-99f5547dce94?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761836345&Signature=NL5R9AJPFd%2FgTPyL7ryaAoP0y0dOLvGTyjGfS6q263tgKXk5QMX4nOaDWZkjrdXNYCl%2BeVRUcAN97HVcuWNKwPw6019sgOT%2FDWlQglikfWWd5uoTB3pK3Ac6o8vA3rlQSiU3oeYcUzGtFgEpgbxAIiAB4tZ%2FOC62ifCSDUF7W049l2ALfgCEpBUSmEeLRtrXCL4bs1hXun6BH0hryGY4WpW6t1eHBZGFWFx4wCH66UrxO9bItvCvxxjRTUzyOUhS4%2BaSZlyexxoegB05oMLe1kDtsYhuDte%2BSconCNe7zsusHMFbRma%2BxamfjLsNs5UqGH53SlixKotoM4Fjv0cdKQ%3D%3D",
    "mediaVisibility": "PRIVATE",
    "servingBaseUri": "https://storage.googleapis.com/ai-sandbox-videofx/image/3adf4c68-5a4e-44ca-8707-99f5547dce94?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761836346&Signature=iLbalcltGq92DAx0aSXXsa2r%2Btc7PAYJiqu2n%2FPYF%2BeVbe7BseP0d%2Fpkax63Aiv6rWmnGnZMa275iEjpRfQeB4Q33zVLp675CS%2BSF%2FMZzW1b%2B14W46HcpertfXRwMTrEqEOBrNnQSkuMs5xbyE8NCX3JQGhMC%2BjCyp23yF4LOwibYp8dD%2Bc9QNgdHLCjnlAGLl8CgandBUu8fPGXU9air4POEz6%2BYNlMQxVBS6QREnx%2Fz2BCADc1iU7vEPvxuxj9xRsJLKBDthlCPE0dPaBzI1EdxFEBpZc5Qgt28%2BovSCjZo1gcIjm7PNwKKMP5MX0hQ1OhFtXH6zT9DdKGWuE8Jg%3D%3D",
    "model": "veo_3_1_t2v_fast_portrait_ultra",
    "isLooped": false,
    "aspectRatio": "VIDEO_ASPECT_RATIO_PORTRAIT"
  },
  "mediaGenerationId": {
    "mediaType": "VIDEO",
    "projectId": "9fa0c772-a01f-429f-94b5-4c3d65c5838a",
    "workflowId": "4d326ab8-e3e6-4654-9422-618be90cc72c",
    "workflowStepId": "CAE",
    "mediaKey": "3adf4c68-5a4e-44ca-8707-99f5547dce94"
  }
}
```
