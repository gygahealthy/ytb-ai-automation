## UPSCALE STATUS CHEK OK

```bash
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchCheckAsyncVideoGenerationStatus' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'authorization: Bearer ya29.a0ATi6K2uu5rskYAlLvMN9UroPiP67Q64EBmpsl8tV1Zn6fptZQ8zU_lLwYF7vI9n_u723eUSUr_j2uM3-4GncAmmHZ77cRNtYpvyrmROvqO0Nt38ZkRBo-Aolsuq7nEyLwkAX0SaUKmnMExhosleIMEYTNGpRdqqMx97CHuzxaa1bv5wQm8HEPzgybeeUT3RbN7DzaK6iEftuTfxF1yFCDBl-4Et2rzLWZzJX5oTpvtMTid1eeuHD8Pdf5Bg9a6rumZ128K85OthAnBmvBtFLb8vRvXj1_XUcbVUzlvtsLLIqMjjR8JP2QlHsTawzQf3F1nxVcxN5ZsId3vWGWtxdM6HnqL5BIE56OM5_dehU0cIaCgYKAdsSARUSFQHGX2MiAKVBmbCxinKvPXhHhJPcyw0370' \
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
  -H 'x-client-data: CJK2yQEIpbbJAQipncoBCKLcygEIlKHLAQiwpMsBCIWgzQEI7I7PAQj4kM8B' \
  --data-raw '{"operations":[{"operation":{"name":"7981a41a8620a6a9799c04d29ec440c2"},"sceneId":"2100754a-5af1-45fd-a67c-034c1864a34b","status":"MEDIA_GENERATION_STATUS_PENDING"}]}'

```

NOK RESPONSE

```json
{
  "operations": [
    {
      "operation": {
        "name": "7981a41a8620a6a9799c04d29ec440c2"
      },
      "sceneId": "2100754a-5af1-45fd-a67c-034c1864a34b",
      "status": "MEDIA_GENERATION_STATUS_ACTIVE"
    }
  ]
}
```

OK RESPONSE

```json
{
  "operations": [
    {
      "operation": {
        "name": "7981a41a8620a6a9799c04d29ec440c2",
        "metadata": {
          "@type": "type.googleapis.com/google.internal.labs.aisandbox.v1.Media",
          "name": "CAUSJDkyMWIxNTM2LTM2NzItNDAyNS05ODNjLTBiYzc4ZTYyZmU3NBokYTM2ZjRhMGUtNzU0MS00NGViLThkNTEtYzk4MTNkYTMxZWYzIgNDQUUqLmMyNTdkMmZiLWJiNzYtNDkyNC05NzkyLTgwOWExNjBlODBjOV91cHNhbXBsZWQ",
          "video": {
            "seed": 342697,
            "mediaGenerationId": "CAUSJDkyMWIxNTM2LTM2NzItNDAyNS05ODNjLTBiYzc4ZTYyZmU3NBokYTM2ZjRhMGUtNzU0MS00NGViLThkNTEtYzk4MTNkYTMxZWYzIgNDQUUqLmMyNTdkMmZiLWJiNzYtNDkyNC05NzkyLTgwOWExNjBlODBjOV91cHNhbXBsZWQ",
            "fifeUrl": "https://storage.googleapis.com/ai-sandbox-videofx/video/c257d2fb-bb76-4924-9792-809a160e80c9_upsampled?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761578456&Signature=bAm2W0szLMZLR8g3uFuCP0zSz8K9fT%2BE4H1xrIl7u2z97VRsy0tltg6sO%2B7oyDEBAE%2BLD40%2BWwu8a5gee5wdQkk9N%2B5f32pPNm%2BoX%2B1WZJe0u%2BpUeKMwwgG%2BsKIhByTaJrIwiNT80EQ6ZkpMRVffEMGsXp5sPLZZjl7pTHfDeNjE8QYwsNfkxMKgXEZw1llHYI1kEeCiHEeyFnMqvUtsCQP0swlRZ0REJXjeDCNZCeGr8ifNJduwYR99I43uv0gqJt%2Fug7v%2FminNW9GsE%2BngHhbsr782i2992vT4Vu0dY20hXKEWQpwo07DfaHkLWutWqjJJelebfSQ2FtVtLgSF0A%3D%3D",
            "mediaVisibility": "PRIVATE",
            "servingBaseUri": "https://storage.googleapis.com/ai-sandbox-videofx/image/c257d2fb-bb76-4924-9792-809a160e80c9_upsampled?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1761578457&Signature=wwfq%2F3tdc5sU6wz9MZfTJL8Zv10qd%2FJU2Wjd8HJh45dV0ElIrBRVAHcjRjOrlqPLB5ml1qL%2FWAmc4F%2BbG%2FnHN6NCr91wnmkp5hzhQqFovJjkWkD1cC4kV6aSl1RFr68yVAXX2xGQelV0n7S4lQ6tlAEPyBqXuZGWqHImJlOfJGpoNre%2FNuqpTl96jWhxLJj2l3s46pXJgn14h4PKdSBW2YOVq1sLA42HglAl62lopH2aa%2Fxx2YppIOt6a4yAIUvKMwI6oKk8nh01Qwb%2FdJLXjCXsBUuXZoQj1o6xCseqMTjXMhRr67hBJUKVCEuLHuF4WzMCcaxsoLvcIQcaE1wgtA%3D%3D",
            "model": "veo_2_1080p_upsampler_8s",
            "isLooped": false,
            "aspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE"
          }
        }
      },
      "sceneId": "2100754a-5af1-45fd-a67c-034c1864a34b",
      "mediaGenerationId": "CAUSJDkyMWIxNTM2LTM2NzItNDAyNS05ODNjLTBiYzc4ZTYyZmU3NBokYTM2ZjRhMGUtNzU0MS00NGViLThkNTEtYzk4MTNkYTMxZWYzIgNDQUUqLmMyNTdkMmZiLWJiNzYtNDkyNC05NzkyLTgwOWExNjBlODBjOV91cHNhbXBsZWQ",
      "status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"
    }
  ],
  "remainingCredits": 300
}
```
