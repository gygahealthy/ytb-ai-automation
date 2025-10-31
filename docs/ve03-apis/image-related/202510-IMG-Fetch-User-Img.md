## I. GET IMAGES OF USER (WITH PAGINATION & CURSOR ON NEXT PAGE)

### 1. INITIAL REQUEST

```curl
curl 'https://labs.google/fx/api/trpc/media.fetchUserHistoryDirectly?input=%7B%22json%22%3A%7B%22type%22%3A%22ASSET_MANAGER%22%2C%22pageSize%22%3A18%2C%22responseScope%22%3A%22RESPONSE_SCOPE_UNSPECIFIED%22%2C%22cursor%22%3Anull%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22cursor%22%3A%5B%22undefined%22%5D%7D%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b '[COOKIE_STRING]' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow/project/b919fec0-82d7-4f56-9019-07e74dfaef6c' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
```

RESPONSE JSON WITH NO CURSOR (NO NEXT PAGE)

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "userWorkflows": [
            {
              "name": "CAMaJGNiYmNkN2ZhLWEwOWEtNDRmMS1iMzMyLTg1ZDcwNDhiNWUwYiIDQ0FFKiQwY2NmYzljOC01MjQ5LTQ5MTUtODg5Zi02YjI0MDQ4MGNkN2I",
              "media": {
                "name": "CAMaJGNiYmNkN2ZhLWEwOWEtNDRmMS1iMzMyLTg1ZDcwNDhiNWUwYiIDQ0FFKiQwY2NmYzljOC01MjQ5LTQ5MTUtODg5Zi02YjI0MDQ4MGNkN2I",
                "userUploadedImage": {
                  "aspectRatio": "IMAGE_ASPECT_RATIO_PORTRAIT"
                },
                "mediaGenerationId": {
                  "mediaType": "IMAGE",
                  "workflowId": "cbbcd7fa-a09a-44f1-b332-85d7048b5e0b",
                  "workflowStepId": "CAE",
                  "mediaKey": "0ccfc9c8-5249-4915-889f-6b240480cd7b"
                }
              },
              "createTime": "2025-10-29T13:56:15Z"
            }
          ]
        },
        "status": 200,
        "statusText": "OK"
      }
    }
  }
}
```

RESPONSE WITH CURSOR (NEXT PAGE)

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "userWorkflows": [
            {
              "name": "CAMaJGRiYmM4YTBiLTk5NzUtNGMwOS1hZjA1LWNhYjM3MjAxM2IzNSIDQ0FFKiRjMDQ4ODU5ZC00OGU5LTQ5NTMtYTA4MS0wYTgwMmIyYjcyODI",
              "media": {
                "name": "CAMaJGRiYmM4YTBiLTk5NzUtNGMwOS1hZjA1LWNhYjM3MjAxM2IzNSIDQ0FFKiRjMDQ4ODU5ZC00OGU5LTQ5NTMtYTA4MS0wYTgwMmIyYjcyODI",
                "userUploadedImage": {
                  "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE"
                },
                "mediaGenerationId": {
                  "mediaType": "IMAGE",
                  "workflowId": "dbbc8a0b-9975-4c09-af05-cab372013b35",
                  "workflowStepId": "CAE",
                  "mediaKey": "c048859d-48e9-4953-a081-0a802b2b7282"
                }
              },
              "createTime": "2025-10-30T09:05:12Z"
            }
          ],
          "nextPageToken": "qgGSAQqPATAsVElNRVNUQU1QICIyMDI1LTEwLTI4IDE0OjUyOjEzLjUyMjQyOCswMCIsMzkyNzg3NjI2OTkxLCIiLCIxZWZhYzZmZS01OThhLTQ0Y2QtOTBjNy0zNzhjY2Y3NDk2NTgiLCJDQUUiLCJkMjgzNWRjYy0yZWZlLTRmNmItOWJjNS1kY2QwOWM0MWZlNzMi"
        },
        "status": 200,
        "statusText": "OK"
      }
    }
  }
}
```

### 2. REQUEST THE NEXT PAGE USING CURSOR PROVIDED ABOVE

```curl
curl 'https://labs.google/fx/api/trpc/media.fetchUserHistoryDirectly?input=%7B%22json%22%3A%7B%22type%22%3A%22ASSET_MANAGER%22%2C%22pageSize%22%3A18%2C%22responseScope%22%3A%22RESPONSE_SCOPE_UNSPECIFIED%22%2C%22cursor%22%3A%22qgGSAQqPATAsVElNRVNUQU1QICIyMDI1LTEwLTI4IDE0OjUyOjEzLjUyMjQyOCswMCIsMzkyNzg3NjI2OTkxLCIiLCIxZWZhYzZmZS01OThhLTQ0Y2QtOTBjNy0zNzhjY2Y3NDk2NTgiLCJDQUUiLCJkMjgzNWRjYy0yZWZlLTRmNmItOWJjNS1kY2QwOWM0MWZlNzMi%22%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b '[COOKIE_STRING]' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow/project/9fa0c772-a01f-429f-94b5-4c3d65c5838a' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
```

RESPONSE

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "userWorkflows": [
            {
              "name": "[SOME_ID_STRING_FOR_NAME]",
              "media": {
                "name": "[SOME_ID_STRING_FOR_NAME]",
                "userUploadedImage": {
                  "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE"
                },
                "mediaGenerationId": {
                  "mediaType": "IMAGE",
                  "workflowId": "1292677d-a2d3-4577-a6ed-ebcdb6768825",
                  "workflowStepId": "CAE",
                  "mediaKey": "ee9a2cde-c1af-49e5-90ce-b0e52d240f0a"
                }
              },
              "createTime": "2025-10-28T14:34:30Z"
            }
          ]
        },
        "status": 200,
        "statusText": "OK"
      }
    }
  }
}
```
