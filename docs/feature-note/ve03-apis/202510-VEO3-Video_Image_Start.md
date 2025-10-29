# ALL OF GENERATE IMAGE

## UP IMAGE

```json
curl 'https://aisandbox-pa.googleapis.com/v1:uploadUserImage' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer [REDACTED_GOOGLE_OAUTH_TOKEN]' \
  -H 'content-type: text/plain;charset=UTF-8' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: YhCWto9FTWHJTRZMN+N6HDWpD1I=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: [REDACTED_LONG_TOKEN]==' \
  --data-raw '{"imageInput":{"rawImageBytes":"/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==","mimeType":"image/jpeg","isUserUploaded":true,"aspectRatio":"IMAGE_ASPECT_RATIO_PORTRAIT"},"clientContext":{"sessionId":";1761745563370","tool":"ASSET_MANAGER"}}'
```

RESPONSE

```json
{
  "mediaGenerationId": {
    "mediaGenerationId": "[REDACTED_LONG_TOKEN]"
  },
  "width": 439,
  "height": 780
}
```

## GENERATE WITH IMAGE START

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoStartImage' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer [REDACTED_GOOGLE_OAUTH_TOKEN]' \
  -H 'content-type: text/plain;charset=UTF-8' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: YhCWto9FTWHJTRZMN+N6HDWpD1I=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: [REDACTED_LONG_TOKEN]==' \
  --data-raw '{"clientContext":{"projectId":"9fa0c772-a01f-429f-94b5-4c3d65c5838a","tool":"PINHOLE","userPaygateTier":"PAYGATE_TIER_TWO"},"requests":[{"aspectRatio":"VIDEO_ASPECT_RATIO_LANDSCAPE","seed":17071,"textInput":{"prompt":"the poseidon doing his normal job, walking round using his seahorse "},"videoModelKey":"veo_3_1_i2v_s_fast_ultra","startImage":{"mediaId":"[REDACTED_LONG_TOKEN]"},"metadata":{"sceneId":"d5fa5147-8c65-4dd3-8650-03405f0ed7fe"}}]}'
```

sample body

```json
{
  "clientContext": {
    "projectId": "9fa0c772-a01f-429f-94b5-4c3d65c5838a",
    "tool": "PINHOLE",
    "userPaygateTier": "PAYGATE_TIER_TWO"
  },
  "requests": [
    {
      "aspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE",
      "seed": 17071,
      "textInput": {
        "prompt": "the poseidon doing his normal job, walking round using his seahorse "
      },
      "videoModelKey": "veo_3_1_i2v_s_fast_ultra",
      "startImage": {
        "mediaId": "[REDACTED_LONG_TOKEN]"
      },
      "metadata": {
        "sceneId": "d5fa5147-8c65-4dd3-8650-03405f0ed7fe"
      }
    }
  ]
}
```

### Sample JSON response

```json
{
  "operations": [
    {
      "operation": {
        "name": "52a55a4296c947d408fe559ba76c353c"
      },
      "sceneId": "d5fa5147-8c65-4dd3-8650-03405f0ed7fe",
      "status": "MEDIA_GENERATION_STATUS_PENDING"
    }
  ],
  "remainingCredits": 44440
}
```

## CHECK VIDEO GENERATION STATUS

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchCheckAsyncVideoGenerationStatus' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer [REDACTED_GOOGLE_OAUTH_TOKEN]' \
  -H 'content-type: text/plain;charset=UTF-8' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: YhCWto9FTWHJTRZMN+N6HDWpD1I=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: [REDACTED_LONG_TOKEN]==' \
  --data-raw '{"operations":[{"operation":{"name":"52a55a4296c947d408fe559ba76c353c"},"sceneId":"d5fa5147-8c65-4dd3-8650-03405f0ed7fe","status":"MEDIA_GENERATION_STATUS_PENDING"}]}'
```

RESPONSE

```json
{
  "operations": [
    {
      "operation": {
        "name": "52a55a4296c947d408fe559ba76c353c"
      },
      "sceneId": "d5fa5147-8c65-4dd3-8650-03405f0ed7fe",
      "status": "MEDIA_GENERATION_STATUS_ACTIVE"
    }
  ]
}
```

RSPONSE SUCCESS

```json
{
  "operations": [
    {
      "operation": {
        "name": "52a55a4296c947d408fe559ba76c353c",
        "metadata": {
          "@type": "type.googleapis.com/google.internal.labs.aisandbox.v1.Media",
          "name": "[REDACTED_LONG_TOKEN]",
          "video": {
            "seed": 17071,
            "mediaGenerationId": "[REDACTED_LONG_TOKEN]",
            "prompt": "the poseidon doing his normal job, walking round using his seahorse ",
            "fifeUrl": "https://storage.googleapis.com/ai-sandbox-videofx/video/e6ba4f15-15a6-4215-b073-d7cac0584189?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761767347&Signature=g%[REDACTED_LONG_TOKEN]%2FQcPZtijSncTC1xwV32L8FQVctCmBuH%2Bq%2BiPiwY6kyi%2BaszZ4g3T9ojtLwjkukJWtU%[REDACTED_LONG_TOKEN]%2F1wVKCZO2E8%2BLEgog2qzm%2BCGNaMCPyk2SMZP%2BWQH4GWtBzxvqsQgO%2F6HZBJuM0ILGELTQCOXdA9%2F1KnRLjL%[REDACTED_LONG_TOKEN]%2FABqzBYK%2F6LuoO5Lzqoii%2FeKICWIDJIKWELQGTMLSPyC8QGzg%3D%3D",
            "mediaVisibility": "PRIVATE",
            "servingBaseUri": "https://storage.googleapis.com/ai-sandbox-videofx/image/e6ba4f15-15a6-4215-b073-d7cac0584189?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761767349&Signature=uk5ZBmqygAX0w%2F1Ll%2BQjaaD99heyoPhImzeJ0N%[REDACTED_LONG_TOKEN]%2BngJfAd%[REDACTED_LONG_TOKEN]%2FXExdcvKnAu%2BoDZ%[REDACTED_LONG_TOKEN]%2Bt4q8KIBrebUgYgFyJRsaJ5c28VtL%[REDACTED_LONG_TOKEN]%2FEBImuymR7MN2p2dRObGz5EGGL9K%2BxikA%3D%3D",
            "model": "veo_3_1_i2v_s_fast_ultra",
            "isLooped": false,
            "aspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE"
          }
        }
      },
      "sceneId": "d5fa5147-8c65-4dd3-8650-03405f0ed7fe",
      "mediaGenerationId": "[REDACTED_LONG_TOKEN]",
      "status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"
    }
  ],
  "remainingCredits": 44440
}
```
