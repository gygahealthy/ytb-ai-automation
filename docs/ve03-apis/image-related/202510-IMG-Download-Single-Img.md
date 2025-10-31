## II. FETCH AN IMAGE

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/media/CAMaJDdkOWU0Zjk0LTg3MGYtNDUwZS05NjllLTE3MzdjNTA2YTRlYiIDQ0FFKiQ5ZDNlNmQ2ZS01N2NhLTQ4YzYtOTE0Zi1hZDkyZjExNTI1M2U?key=[FLOW_SECRET_KEY]&clientContext.tool=PINHOLE' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Authorization: Bearer [BEARER_TOKEN]' \
  -H 'Referer: https://labs.google/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0'

```

RESPONSE

```json
{
  "name": "CAMaJDdkOWU0Zjk0LTg3MGYtNDUwZS05NjllLTE3MzdjNTA2YTRlYiIDQ0FFKiQ5ZDNlNmQ2ZS01N2NhLTQ4YzYtOTE0Zi1hZDkyZjExNTI1M2U",
  "userUploadedImage": {
    "image": "[BASE64_STRING]",
    "mediaGenerationId": "CAMaJDdkOWU0Zjk0LTg3MGYtNDUwZS05NjllLTE3MzdjNTA2YTRlYiIDQ0FFKiQ5ZDNlNmQ2ZS01N2NhLTQ4YzYtOTE0Zi1hZDkyZjExNTI1M2U",
    "fifeUrl": "https://storage.googleapis.com/ai-sandbox-videofx/image/9d3e6d6e-57ca-48c6-914f-ad92f115253e?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761835997&Signature=[SIGNATURE]",
    "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE"
  },
  "mediaGenerationId": {
    "mediaType": "IMAGE",
    "workflowId": "7d9e4f94-870f-450e-969e-1737c506a4eb",
    "workflowStepId": "CAE",
    "mediaKey": "9d3e6d6e-57ca-48c6-914f-ad92f115253e"
  }
}
```
