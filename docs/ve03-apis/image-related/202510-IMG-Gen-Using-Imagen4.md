```curl
curl 'https://aisandbox-pa.googleapis.com/v1:runImageFx' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'Authorization: Bearer [BEARER_TOKEN]' \
  -H 'Referer: https://labs.google/' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'Content-Type: text/plain;charset=UTF-8' \
  -H 'sec-ch-ua-mobile: ?0' \
  --data-raw '{"clientContext":{"sessionId":";1761914327649","tool":"PINHOLE","projectId":"68de0c97-2c46-4b34-82e1-bba9f941e07d"},"userInput":{"candidatesCount":4,"seed":731524,"prompts":["create dog with the \"hoat hinh\" style"],"referenceImageInput":{"referenceImages":[]}},"aspectRatio":"IMAGE_ASPECT_RATIO_LANDSCAPE","modelInput":{"modelNameType":"IMAGEN_3_5"}}'
```

RESPONSE

```json
{
  "imagePanels": [
    {
      "prompt": "create dog with the \"hoat hinh\" style",
      "generatedImages": [
        {
          "encodedImage": "[BASE64_ENCODED_IMAGE]",
          "seed": 731527,
          "mediaGenerationId": "CAMaJDBjMDdkM2YyLTFlNWItNGFlOC05NDIwLTNiZDZhNjBlOWRlYiIDQ0FFKiRkZTZmN2VjZi0xZjViLTQ0OTEtYWU5OS1mN2MxNjk4NDcwZDY",
          "prompt": "create dog with the \"hoat hinh\" style",
          "modelNameType": "IMAGEN_3_5",
          "workflowId": "0c07d3f2-1e5b-4ae8-9420-3bd6a60e9deb",
          "fingerprintLogRecordId": "75559c23a80000000000000000000000",
          "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE",
          "requestData": {
            "promptInputs": [
              {
                "textInput": "create dog with the \"hoat hinh\" style"
              }
            ],
            "imageGenerationRequestData": {}
          }
        }
      ]
    }
  ]
}
```

## II. USE IMAGE AS INGREDIENT

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
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: AGaxImjg97xQkd0h3geRTArJi8Y=' \
  -H 'x-browser-year: 2025' \
  -H 'x-client-data: CJK2yQEIpbbJAQipncoBCKLcygEIlqHLAQiwpMsBCIWgzQEI7I7PAQj4kM8B' \
  --data-raw '{"imageInput":{"rawImageBytes":"[BASE64_ENCODED_IMAGE]","mimeType":"image/jpeg","isUserUploaded":false,"aspectRatio":"IMAGE_ASPECT_RATIO_LANDSCAPE"},"clientContext":{"sessionId":";1761914327649","tool":"ASSET_MANAGER"}}'
```

RESPONSE

```json
{
  "mediaGenerationId": {
    "mediaGenerationId": "CAMaJDU0ZmM3OTE4LWRkODktNDg4YS05ZmRiLTI1NWFlM2I4OTJlOSIDQ0FFKiQ5NzY1OGFhYS0xMGFhLTRhZjMtYjBiYy0wNmY1YWNiODJmMmY"
  },
  "width": 960,
  "height": 540
}
```
