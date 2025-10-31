### CURL FOR IMAGE REFERNECE (INGREDIENTS) GENERATION

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoReferenceImages' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer [BEARER_TOKEN]' \
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
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: qSH0RgPhYS+tEktJTy2ahvLDO9s=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: CIS2yQEIpLbJAQipncoBCPjeygEIlqHLAQiGoM0BCI2OzwE=' \
  --data-raw '{"clientContext":{"projectId":"9fa0c772-a01f-429f-94b5-4c3d65c5838a","tool":"PINHOLE","userPaygateTier":"PAYGATE_TIER_TWO"},"requests":[{"aspectRatio":"VIDEO_ASPECT_RATIO_LANDSCAPE","metadata":{"sceneId":"eab46960-4b24-421a-91c9-48a4e9998d66"},"referenceImages":[{"imageUsageType":"IMAGE_USAGE_TYPE_ASSET","mediaId":"CAMaJGZlZGVhYTQwLWE1ZDYtNDRiYi1hNzdlLWE1ZjhkMDc4NGZmZSIDQ0FFKiQ0YzQ3NDc5Yi0wMjQyLTQ2OWQtYmNhOS01YmNmZmQwNWI2NjU"},{"imageUsageType":"IMAGE_USAGE_TYPE_ASSET","mediaId":"CAMaJDYwYjRkZjM2LWU4N2EtNGFiYi1iY2JjLTdjZjhlNDA4ZGI2ZSIDQ0FFKiRiNjc4NWYxOC00ZDIwLTRlMjktYWVkZi0yYTFhMzRlMWIxOTE"},{"imageUsageType":"IMAGE_USAGE_TYPE_ASSET","mediaId":"CAMaJDc2NWJlODBjLWI2N2QtNGI5ZC05NTdkLWVlNzkwMGZlNTZjYiIDQ0FFKiQyN2NkMmViZS1mMGI2LTQzZGUtODk5OC0wOWJhMTdiNTM4NDE"}],"seed":21526,"textInput":{"prompt":"make them to be inside a class talking to each other with the girl to be the teacher"},"videoModelKey":"veo_3_0_r2v_fast_ultra"}]}'
```

PAYLOAD:

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
            "metadata": {
                "sceneId": "eab46960-4b24-421a-91c9-48a4e9998d66"
            },
            "referenceImages": [
                {
                    "imageUsageType": "IMAGE_USAGE_TYPE_ASSET",
                    "mediaId": "CAMaJGZlZGVhYTQwLWE1ZDYtNDRiYi1hNzdlLWE1ZjhkMDc4NGZmZSIDQ0FFKiQ0YzQ3NDc5Yi0wMjQyLTQ2OWQtYmNhOS01YmNmZmQwNWI2NjU"
                },
                {
                    "imageUsageType": "IMAGE_USAGE_TYPE_ASSET",
                    "mediaId": "CAMaJDYwYjRkZjM2LWU4N2EtNGFiYi1iY2JjLTdjZjhlNDA4ZGI2ZSIDQ0FFKiRiNjc4NWYxOC00ZDIwLTRlMjktYWVkZi0yYTFhMzRlMWIxOTE"
                },
                {
                    "imageUsageType": "IMAGE_USAGE_TYPE_ASSET",
                    "mediaId": "CAMaJDc2NWJlODBjLWI2N2QtNGI5ZC05NTdkLWVlNzkwMGZlNTZjYiIDQ0FFKiQyN2NkMmViZS1mMGI2LTQzZGUtODk5OC0wOWJhMTdiNTM4NDE"
                }
            ],
            "seed": 21526,
            "textInput": {
                "prompt": "make them to be inside a class talking to each other with the girl to be the teacher"
            },
            "videoModelKey": "veo_3_0_r2v_fast_ultra"
        }
    ]
}
`
```
