## I. GET IMAGES OF USER (WITH PAGINATION & CURSOR ON NEXT PAGE)

### 1. INITIAL REQUEST

```curl
curl 'https://labs.google/fx/api/trpc/media.fetchUserHistoryDirectly?input=%7B%22json%22%3A%7B%22type%22%3A%22ASSET_MANAGER%22%2C%22pageSize%22%3A18%2C%22responseScope%22%3A%22RESPONSE_SCOPE_UNSPECIFIED%22%2C%22cursor%22%3Anull%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22cursor%22%3A%5B%22undefined%22%5D%7D%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b '[SECRET]' \
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
  -b '_ga=GA1.1.1097168293.1761644050; EMAIL=%22admin%401gyga.com%22; __Host-next-auth.csrf-token=5fd0d21e4194975a81aa962e077916ca8d199751add1dff2b00a5035a6d6cc44%7Cb3aef9e7d4601653eb3ea87fea82ea9c4565b677b3fb939c31986221acc56ff7; __Secure-next-auth.callback-url=https%3A%2F%2Flabs.google%2Ffx%2Ftools%2Fflow%2Fproject%2F9fa0c772-a01f-429f-94b5-4c3d65c5838a; email=admin%401gyga.com; _ga_5K7X2T4V16=GS2.1.s1761815292$o7$g0$t1761815294$j58$l0$h0; _ga_X2GNH8R5NS=GS2.1.s1761814376$o7$g1$t1761815307$j49$l0$h760790782; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..pRpA_xkpexiJyzVw.XCexMzwvL39ST80Mybx8XkaHOqqmczk8b8JZNwASdgv9Y3MtrElaLzFC58-W4mUTXbHMdWBlxTAUycUVvjVglM6vQLnZI7ZqW73HALxW_IaIe6xQVh07zUv8iBcwDL8LmiyWrdrH0oC6CFCEXXSW8CiwU2igxKzMPWJuqXXi2rXlgz5TFuByKW2Umx2wO92fUtWuGCaSbQFRt43JjjHWOTK7hWVP0-Ju5tu_rLrpBxm35CNgZE2qni_TQCy17M55lVYwaQteAte8gdl4WBy5yKEPgyYjjUIlmu79_48ai2uHIe_KkEsr7PjHTzz9V9jYBTz1JuO_s5R__2VBhNUzoaTuYIGGi7H48TBv5buq4YGNoFTb-4aLgTxzaK7lGe5nMqhEHpxhSi46NBqcy4YqKZIJ_7y_S09Ingz41i7M60l-Hn_L2FMecVXGj47IBshBjLxT3nio5FKTL-nug_x-uH0XbQDUJ8W6kl7_xvyfh9k6zLrimb1FvpbwhH9BjGWR8I4mquXCVfQuDPxF17GQH8DoanIazackHMP1bCxl_C6I8o-y16opVdgOjXKB_NRt9LPsJLooAxnvYtBxX0nBwuPc4697CficecsLryWn0tYngqAem1mc99YYn3OyfEPgomfXaizXbamuzz9w0ihJ7M6di7_645j4behgKly-srANdZfoLJgLOnWGlCn3A0UxV8hUACWP6_OeBxkDA0lme1hZfvEl7gCrZoO0J2dbYxEfKEtR2S9XWzVwEIeidzSFd8KjLqNZn0QDFBU9Jv0Ig8XOFZjr7L4ULrA_BF2ieRGfDhpRlK3PCFuoh245Mc1XEIv82NiRqmm9ROfKi5qI8CYcGFvFu8-gSpNuRa7X5VDsvffLJ0Y5oM2lecmHyRWAYeQLsQCvbWX7eNpnqLdqLRbpMJzOCvWnjbeEHZilj9vyAPEPHr4gD2wZBbWS_xz9RaHOFIRh3X-iC5BCIUfI.wKuWmM5w2T25KTRXZa_jEw' \
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
              "name": "CAMaJDEyOTI2NzdkLWEyZDMtNDU3Ny1hNmVkLWViY2RiNjc2ODgyNSIDQ0FFKiRlZTlhMmNkZS1jMWFmLTQ5ZTUtOTBjZS1iMGU1MmQyNDBmMGE",
              "media": {
                "name": "CAMaJDEyOTI2NzdkLWEyZDMtNDU3Ny1hNmVkLWViY2RiNjc2ODgyNSIDQ0FFKiRlZTlhMmNkZS1jMWFmLTQ5ZTUtOTBjZS1iMGU1MmQyNDBmMGE",
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
            },
            {
              "name": "CAMaJGM0YWMzNTVmLWVjZWEtNDE0NS04NDE0LWIzNThiZGQ1MTViZSIDQ0FFKiRhNzY2N2NmMi03OTNmLTQ2ZGYtYjE3Ny05ZTg3NjNmYmY0ZmU",
              "media": {
                "name": "CAMaJGM0YWMzNTVmLWVjZWEtNDE0NS04NDE0LWIzNThiZGQ1MTViZSIDQ0FFKiRhNzY2N2NmMi03OTNmLTQ2ZGYtYjE3Ny05ZTg3NjNmYmY0ZmU",
                "userUploadedImage": {
                  "aspectRatio": "IMAGE_ASPECT_RATIO_LANDSCAPE"
                },
                "mediaGenerationId": {
                  "mediaType": "IMAGE",
                  "workflowId": "c4ac355f-ecea-4145-8414-b358bdd515be",
                  "workflowStepId": "CAE",
                  "mediaKey": "a7667cf2-793f-46df-b177-9e8763fbf4fe"
                }
              },
              "createTime": "2025-10-28T14:34:11Z"
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

## II. FETCH AN IMAGE

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/media/CAMaJDdkOWU0Zjk0LTg3MGYtNDUwZS05NjllLTE3MzdjNTA2YTRlYiIDQ0FFKiQ5ZDNlNmQ2ZS01N2NhLTQ4YzYtOTE0Zi1hZDkyZjExNTI1M2U?key=[SECRET]&clientContext.tool=PINHOLE' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Authorization: Bearer [SECRET]' \
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
