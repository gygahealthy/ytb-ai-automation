```curl

curl 'https://aisandbox-pa.googleapis.com/v1:uploadUserImage' \
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
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: YhCWto9FTWHJTRZMN+N6HDWpD1I=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: CJC2yQEIo7bJAQipncoBCNOLywEIk6HLAQi5pMsBCIagzQEIjY7PAQ==' \
  --data-raw '{"imageInput":{"rawImageBytes":"[IMAGE_BASE64_STRING]","mimeType":"image/jpeg","isUserUploaded":true,"aspectRatio":"IMAGE_ASPECT_RATIO_LANDSCAPE"},"clientContext":{"sessionId":";1761810250843","tool":"ASSET_MANAGER"}}'
```

RESPONSE

```json
{
  "mediaGenerationId": {
    "mediaGenerationId": "CAMaJDdkOWU0Zjk0LTg3MGYtNDUwZS05NjllLTE3MzdjNTA2YTRlYiIDQ0FFKiQ5ZDNlNmQ2ZS01N2NhLTQ4YzYtOTE0Zi1hZDkyZjExNTI1M2U"
  },
  "width": 1094,
  "height": 616
}
```
