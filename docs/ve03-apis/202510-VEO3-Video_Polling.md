---
created_date: 2025-10-12
modified_date: 2025-10-12
tags: 
cssclasses: 
---


# II. CHECKING FOR GENERATION PROGRESS

This call get the generation status (pending or complete)

```
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchCheckAsyncVideoGenerationStatus' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'authorization: Bearer ya29.a0AQQ_BDQBJdMULeuXrGKiDZ3DGmHkwF5UhxJ1TrnbzEiwOEwtq7NNoVvnf8fwAzlGRhDbyNuxSCofjcYKU6hj9gHj601-F5o5PDdsyjmflIWQy31gCv3AfrLK_rTU2XFY1mW5UUAhv6TcCq3SP6UJjRuINr9zDEAKjFe3XxkGISxOeKx08ltXLZa2TBUIVkuM_IHTmlw4rRtcn51dIXQKsOeZQMNKbRfkhYhTe-QLUeoXozo21ijP9pBiSjej6xAUOZ0OG3lf9O5sxtFHeH_itAEFnaftNpqSS926IO3cXjnkkT_kLiAOcajLWBuhieb8fqCR8m-BhXngtkENvW-3xqYx3fHM3kBcfDW-mo0vVZJ2aCgYKAUsSARYSFQHGX2MidE7hJrcQ3OU2YWkJTPecGQ0371' \
  -H 'cache-control: no-cache' \
  -H 'content-type: text/plain;charset=UTF-8' \
  -H 'origin: https://labs.google' \
  -H 'pragma: no-cache' \
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
  -H 'x-client-data: CJK2yQEIpbbJAQipncoBCKLcygEIkqHLAQiwpMsBCIWgzQEI7I7PAQ==' \
  --data-raw '{"operations":[{"operation":{"name":"895377fb0691f831b227b996abfdd366"},"sceneId":"a0981b9c-97d8-4959-abf6-0b3ce8542e80","status":"MEDIA_GENERATION_STATUS_PENDING"}]}'
```

Of course. This cURL command is the follow-up to the video generation request. Its job is to ask the server, "How's that video I asked for coming along?" ⏳.

This is a classic **polling** request, designed to check the status of a long-running, asynchronous task.

---

### 🕵️‍♂️ The "Must-Haves" for the Request to Work

These components are absolutely essential. Without them, the server won't know who you are or what you're asking about.

- **`authorization: Bearer ya29.a0...`**: Just like the generation request, this **OAuth 2.0 Bearer Token** is your high-security key 🔑. It's the primary way you prove your identity and authorization to the Google API. The token must be valid and unexpired.
    
- **`--data-raw '{...}'`**: This is the payload, which tells the server _which specific job_ you're asking about.
    
    - **`operation.name`: `"895377fb..."`**: This is the **job ID**. When you first asked the server to create a video, it responded with this unique identifier. Now, you're sending it back to ask for an update on that specific task.
        
    - **`sceneId`: `"a0981b9c..."`**: This is likely an ID used by the front-end application (`labs.google`) to keep track of the video in the user interface.
        

---

### 🎭 Looking Like a Legitimate Browser

These headers are crucial for ensuring the request is seen as a valid call from the `labs.google` web application and not an unauthorized script.

- **`origin: https://labs.google`**: Vital for CORS security. It tells `googleapis.com` that the request is coming from an approved source.
    
- **`user-agent`** and **`sec-ch-ua-*`**: These headers identify your client as a standard Chrome browser on Windows.
    
- **`referer: https://labs.google/`**: Provides the context that the request was initiated from the Google Labs website.
    
- **`sec-fetch-site: cross-site`**: Correctly flags the request as going from one domain (`labs.google`) to another (`googleapis.com`).
    

---

### 🔒 Google's Anti-Abuse and Validation Headers

These proprietary `x-*` headers are part of Google's security system to prevent bots and ensure the integrity of the request.

- **`x-client-data`** and **`x-browser-validation`**: These headers contain dynamically generated, encoded data that acts as a fingerprint of your browser session. They are extremely difficult to replicate and are essential for your request to be trusted by the server.
    

---

### Summary: The "Are We There Yet?" Request

This cURL command is nearly identical in structure to the one that started the video generation, but with a different purpose.

1. It uses the same powerful **Bearer Token** for authentication.
    
2. It sends a payload containing the **Job ID** to identify the specific task.
    
3. It uses the same set of **browser-mimicking headers** and **custom validation headers** to pass security checks.
    

Essentially, after you submit a video prompt, the web application will send a request like this every few seconds to the `batchCheckAsyncVideoGenerationStatus` endpoint until the server responds that the video is `COMPLETED` or has `FAILED`.

## REQUIREMENTS

Return result of process still pending:

```json
{
    "operations": [
        {
            "operation": {
                "name": "d7c7627359c37b6c5c1b0baf4948831f"
            },
            "sceneId": "663421df-ad82-4977-99bb-6abed60d323a",
            "status": "MEDIA_GENERATION_STATUS_ACTIVE"
        }
    ]
}
```

Need process of return result:

```json
{

    "operations": [

        {

            "operation": {

                "name": "db3c2bde968b81655c1b0baf4948831f",

                "metadata": {

                    "@type": "type.googleapis.com/google.internal.labs.aisandbox.v1.Media",

                    "name": "CAUSJDNhZmIxZjgwLWNhN2QtNGIzMy04MzE4LTM1ZGQzY2YwZDcxNBokM2Q0YjgxM2UtZGNkZC00MWRmLWE2YmYtMDY3ZmFjZmYzOTZjIgNDQUUqJDI2MzhjYTFmLWM3ZmUtNDA4ZS04NTFlLTI2NDNiZDhhNjg0OA",

                    "video": {

                        "seed": 0,

                        "mediaGenerationId": "CAUSJDNhZmIxZjgwLWNhN2QtNGIzMy04MzE4LTM1ZGQzY2YwZDcxNBokM2Q0YjgxM2UtZGNkZC00MWRmLWE2YmYtMDY3ZmFjZmYzOTZjIgNDQUUqJDI2MzhjYTFmLWM3ZmUtNDA4ZS04NTFlLTI2NDNiZDhhNjg0OA",

                        "prompt": "{\n  \"prompt\": \"Cinematic extreme close-up of dust motes drifting hypnotically through a single, sharp beam of Earthen Gold afternoon light cutting through a dark room. The background is steeped in deep Prussian Blue shadow. The motes move with an extreme slow-motion grace, evoking a profound sense of stillness, silence, and time slowing down. Hyperrealistic, 8K, shallow depth of field.\",\n  \"style\": [\n    \"cinematic documentary style\",\n    \"hyperrealistic\",\n    \"minimalist\",\n    \"The Resilient Mind's 'Calm Authority' aesthetic\",\n    \"soft, naturalistic lighting\"\n  ],\n  \"camera_movement\": [\n    \"static\",\n    \"extreme close-up\"\n  ],\n  \"audio\": {\n    \"music\": \"Calm, ambient, focus-enhancing background music, low in the mix.\",\n    \"ambient_sound\": \"faint, almost imperceptible room tone\",\n    \"sound_effects\": [\n      \"none\"\n    ]\n  },\n  \"negative_prompt\": \"cartoon, animated, stylized, illustration, low-resolution, blurry, morphing artifacts, distorted features, unrealistic movement, fast motion, shaky cam, text, watermark, humans, stressed office workers, corporate stock photos, cluttered backgrounds, jarring colors.\"\n}",

                        "fifeUrl": "https://storage.googleapis.com/ai-sandbox-videofx/video/2638ca1f-c7fe-408e-851e-2643bd8a6848?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1760184851&Signature=GeHjyM0%2BT%2BJiVwu9Knjar0B0%2FXfq4gd6vj5%2BThuIw8rgX1Dli2vxRn07R%2BNenIvU1JsVhCiBAF6VojZ23NQxpOQGti5coBgsFim4e1P0SRP%2FsmWV%2FiC8egVBeVzzNm1G0agQp%2FJYa7%2FTfUMdWO5zP34%2FyrhJCfsckvy2JLOT8asrz52QsVitoAGD34v%2FDfeQ6ySn4k%2B2sENdC%2Bh7FVFvanEdHQaPYI8ueOEJ%2BrzZT1ixCWGEUfNz1kyzEaO10Aqi%2BfKRGj6aTIPyTsCx1ScrGPe6hDK7ac%2FyoeQj9FPACRDSpfufRN9Vrz6wVoQWrBVbNaj4DP%2BeFFrQKasnF93p2w%3D%3D",

                        "servingBaseUri": "https://storage.googleapis.com/ai-sandbox-videofx/image/2638ca1f-c7fe-408e-851e-2643bd8a6848?GoogleAccessId=labs-ai-sandbox-videoserver-prod@system.gserviceaccount.com&Expires=1760184851&Signature=4NACIN3YmU%2BIsK2DgOScyW66Ei0sSIqMxEeWaFWe700Z3wc13s3zPZf11G5Sl7lyxnkwvBe%2FClnrJgCaNMxVsErCYZ64okQu6CRgSTY17t2Jifx8WKp4mjVekPRwffdlA2XeBJstAhK1IZIwDnWmwlrunKu394MwMffw9AK2UYl81u5yD3YKQBmZXaGo2oeubItd9QN58zAsa0Tv9GKtZ1YY9lTaOPP8OHGsu%2F3RX0izgcD5fh%2Fib3egTEs0Jfe95y3%2BpPTwTc7B9FaeZ2D1Lt7VjsYkP6TEi7A9LVtW7cyXuATACTQQXTjWWI7gHH45e%2FUHivVn4SXw6xdxBFYtEA%3D%3D",

                        "model": "veo_3_0_t2v_fast",

                        "aspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE"

                    },

                    "requestData": {

                        "videoGenerationRequestData": {

                            "videoModelControlInput": {

                                "videoModelName": "veo_3_0_t2v_fast",

                                "videoGenerationMode": "VIDEO_GENERATION_MODE_TEXT_TO_VIDEO",

                                "videoAspectRatio": "VIDEO_ASPECT_RATIO_LANDSCAPE"

                            }

                        },

                        "promptInputs": [

                            {

                                "textInput": "{\n  \"prompt\": \"Cinematic extreme close-up of dust motes drifting hypnotically through a single, sharp beam of Earthen Gold afternoon light cutting through a dark room. The background is steeped in deep Prussian Blue shadow. The motes move with an extreme slow-motion grace, evoking a profound sense of stillness, silence, and time slowing down. Hyperrealistic, 8K, shallow depth of field.\",\n  \"style\": [\n    \"cinematic documentary style\",\n    \"hyperrealistic\",\n    \"minimalist\",\n    \"The Resilient Mind's 'Calm Authority' aesthetic\",\n    \"soft, naturalistic lighting\"\n  ],\n  \"camera_movement\": [\n    \"static\",\n    \"extreme close-up\"\n  ],\n  \"audio\": {\n    \"music\": \"Calm, ambient, focus-enhancing background music, low in the mix.\",\n    \"ambient_sound\": \"faint, almost imperceptible room tone\",\n    \"sound_effects\": [\n      \"none\"\n    ]\n  },\n  \"negative_prompt\": \"cartoon, animated, stylized, illustration, low-resolution, blurry, morphing artifacts, distorted features, unrealistic movement, fast motion, shaky cam, text, watermark, humans, stressed office workers, corporate stock photos, cluttered backgrounds, jarring colors.\"\n}"

                            }

                        ]

                    }

                }

            },

            "sceneId": "2a483b8f-f771-47d3-bb04-e45d5d951d7a",

            "mediaGenerationId": "CAUSJDNhZmIxZjgwLWNhN2QtNGIzMy04MzE4LTM1ZGQzY2YwZDcxNBokM2Q0YjgxM2UtZGNkZC00MWRmLWE2YmYtMDY3ZmFjZmYzOTZjIgNDQUUqJDI2MzhjYTFmLWM3ZmUtNDA4ZS04NTFlLTI2NDNiZDhhNjg0OA",

            "status": "MEDIA_GENERATION_STATUS_SUCCESSFUL"

        }

    ],

    "remainingCredits": 920

}
```



