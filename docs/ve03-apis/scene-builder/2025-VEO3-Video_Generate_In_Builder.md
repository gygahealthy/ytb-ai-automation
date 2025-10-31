## I. GENERATE VIDEO API

### 1. GENERATE VIDEO IN SCENE BUILDER

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoText' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'authorization: Bearer [SECRET]' \
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
  -H 'x-client-data: CIS2yQEIpLbJAQipncoBCPjeygEIk6HLAQiGoM0BCI2OzwE=' \
  --data-raw '{"clientContext":{"projectId":"bda2c9bf-0cf7-46fa-92ec-988eda900635","tool":"PINHOLE","userPaygateTier":"PAYGATE_TIER_ONE"},"requests":[{"aspectRatio":"VIDEO_ASPECT_RATIO_LANDSCAPE","seed":7533,"textInput":{"prompt":"generate beautiful girl walking in the street"},"videoModelKey":"veo_3_1_t2v_fast","metadata":{"sceneId":"072e4486-504a-45ce-b0e3-9f48ce6cd247"}}]}'
```

RESPONSE

```json
{
  "operations": [
    {
      "operation": {
        "name": "ef09aa3fef2da6ac4d3546f4e0aba89c"
      },
      "sceneId": "072e4486-504a-45ce-b0e3-9f48ce6cd247",
      "status": "MEDIA_GENERATION_STATUS_PENDING"
    }
  ],
  "remainingCredits": 20
}
```

### 2. CALL GEN ON NEXT SCENE

#### 2.1. UPLOAD IMAGE FIRST FOR NETXT SCENE

## II. UPDATE SCENE API (CALL AFTER UPLOAD IMAGE & GEN 2nd )

```curl
curl 'https://labs.google/fx/api/trpc/project.updateScene' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'content-type: application/json' \
  -b '[SECRET]' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow/project/bda2c9bf-0cf7-46fa-92ec-988eda900635/scenes/dd99095c-96dc-4021-bb20-bd9b486480ef' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  --data-raw '{"json":{"projectId":"bda2c9bf-0cf7-46fa-92ec-988eda900635","scene":{"sceneId":"dd99095c-96dc-4021-bb20-bd9b486480ef","clips":[{"clipId":"CAUSJGJkYTJjOWJmLTBjZjctNDZmYS05MmVjLTk4OGVkYTkwMDYzNRokM2Y1ODFjYjItNmE3Zi00MWIwLTliMjQtY2FkYTQ0NDk1M2Q1IgNDQUUqJDc3NWU4NjkyLTIxYzUtNDE1NS04ODA0LWMzZWY2YTAxNjM0MA","startTime":"0.000000000s","endTime":"8.000000000s","prompt":"generate beautiful girl walking in the street"}]},"toolName":"PINHOLE","updateMasks":["clips"]}}'
```

RESPONSE

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "sceneId": "dd99095c-96dc-4021-bb20-bd9b486480ef",
          "sceneName": "Initial Scene - 12:03:41 PM",
          "clips": [
            {
              "clipId": "CAUSJGJkYTJjOWJmLTBjZjctNDZmYS05MmVjLTk4OGVkYTkwMDYzNRokM2Y1ODFjYjItNmE3Zi00MWIwLTliMjQtY2FkYTQ0NDk1M2Q1IgNDQUUqJDc3NWU4NjkyLTIxYzUtNDE1NS04ODA0LWMzZWY2YTAxNjM0MA",
              "startTime": "0s",
              "endTime": "8s"
            }
          ],
          "createTime": "2025-10-30T05:03:42.262923Z"
        },
        "status": 200,
        "statusText": "OK"
      }
    }
  }
}
```

## II. MANAGEMENT APIs

### 1. PROJECT SEARCH SCENE API

```curl
curl 'https://labs.google/fx/api/trpc/project.searchProjectScenes?input=%7B%22json%22%3A%7B%22projectId%22%3A%22bda2c9bf-0cf7-46fa-92ec-988eda900635%22%2C%22toolName%22%3A%22PINHOLE%22%2C%22pageSize%22%3A10%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.1.208900459.1761586137; EMAIL=%22hieu2906090%40gmail.com%22; __Host-next-auth.csrf-token=200ae820fe593cff6e3f7dfef08a8d05aedfd9ca5b8d33abad5390d0eab493f9%7C182c18027ecd0e2b209fa6b14425ac2454b20f658db10da0f1e593ceb5272d21; __Secure-next-auth.callback-url=https%3A%2F%2Flabs.google%2Ffx%2Ftools%2Fflow; email=hieu2906090%40gmail.com; _ga_X2GNH8R5NS=GS2.1.s1761800607$o5$g1$t1761800860$j60$l0$h453048261; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..PpC89R-S1OAUIX2v.7_ArRfzE7b_W-3oMm2trkD4ZdFgQcWnEfqO6LEdCAcDF1lb1SLn1vXjdLZp3j0SbW8Qmfm9HjJGLmHBUW2R8qTaCIaQ-QK0wWICb6ck8t5vmU24cWneeZmzzvNmWpGo6Ud6db_CtFPgPEH-KNCgq6kal2rETXSts0HqftN_ajzdCszgvd3OyP7rrL8q-yEgqoEklQXfbyFltIMda7-FeW-efut1GWMU2hgOx7OsAVd0298w3dYCaTltZE48FvKYC0u6TDUkV45MzJ_TR3fMfoldbMW68SFsLKkrq_rEogC80NLuNI8EWiSdUIToKO-7ROIv9omMZQISbT9uK4CP17WIRGnKMoQq1np3nx4llii1vbODvlGVgg8iqHRXG3GmZwNR8C7txcIM4DOQrmhAdnb0Tji1ATGh4AxWURKziBTrx5jZbjjHSJB7AH30zxcMTvdsMB7FS0CiibCcavqbxHMPcKcPgumta7L1Uz4ka6dMG_juP4utrugdBt1Qk_EzaR0DIsR_2D_Nsk8c386vCqbWDzXKFuQ36nAA_bQ7j9Ip95jht6L23c70ZpHNETpSmBUVoOh7qcTWROqIBJXBKXwlcEkPqbW0-PBHbaQPTFpfNWaXMjDhMPuywU-Z-hY4wd6bVfl4tFlaO8Jl9fK_se7WBjDQoGneDnUcA2S1U8amdFyeYJY8NdRQcK1ZqUdqiWMW-psrqpVA-EndHLZEIIAg9TrpdsAInjkdjoyNpe2z23bXxi9KKctykE__GxgWUgQ-dHlAAHL2s-3oOmSOgcOuQ4m0YzbVhP_kZK2GLIGCUSg2m1UNpZjGkGw7vqJiJWOJMoKWNT-9tHOTswvB4Ab56HJgvmMQay_PR_wChA0vALk8vOZT2LSCqTGZCTw0kVzz_Eri75EY2ZUV32GTzUM9w20KCQGwkplqhg-GKC52OAp8vgYhsfE1gHKlpySUFjLl09_7cQxNFc9Je1z5OYBUJTPAo6I5WjuReLvvdeEjgbCjI.KMwYc0gCB9cpZHks9vA1zw' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow/project/bda2c9bf-0cf7-46fa-92ec-988eda900635/scenes/dd99095c-96dc-4021-bb20-bd9b486480ef' \
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
          "scenes": [
            {
              "sceneId": "dd99095c-96dc-4021-bb20-bd9b486480ef",
              "sceneName": "Initial Scene - 12:03:41 PM",
              "clips": [
                {
                  "clipId": "CAUSJGJkYTJjOWJmLTBjZjctNDZmYS05MmVjLTk4OGVkYTkwMDYzNRokM2Y1ODFjYjItNmE3Zi00MWIwLTliMjQtY2FkYTQ0NDk1M2Q1IgNDQUUqJDc3NWU4NjkyLTIxYzUtNDE1NS04ODA0LWMzZWY2YTAxNjM0MA",
                  "startTime": "0s",
                  "endTime": "8s"
                }
              ],
              "createTime": "2025-10-30T05:03:42.262923Z"
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

##
