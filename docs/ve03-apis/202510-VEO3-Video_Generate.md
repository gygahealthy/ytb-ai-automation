---
created_date: 2025-10-11
modified_date: 2025-10-11
tags: 
cssclasses: 
---

# I. GENERATE VIDEO

## 1. SAMPLE CURL

```curl
curl 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoText' \
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
  --data-raw $'{"clientContext":{"projectId":"3afb1f80-ca7d-4b33-8318-35dd3cf0d714","tool":"PINHOLE","userPaygateTier":"PAYGATE_TIER_ONE"},"requests":[{"aspectRatio":"VIDEO_ASPECT_RATIO_LANDSCAPE","seed":9307,"textInput":{"prompt":"{\\n    \\"prompt\\": \\"A breathtaking cinematic shot of thick, white morning fog rolling slowly and peacefully through a silent forest of tall, dark trees. The fog is so dense it obscures vision beyond a few feet, creating a sense of quiet disorientation but also tranquility. Sunlight filters weakly through the fog from above, giving it a soft, ethereal glow. Hyperrealistic, atmospheric, 8K, wide-angle shot.\\",\\n    \\"style\\": [\\n      \\"cinematic documentary style\\",\\n      \\"hyperrealistic\\",\\n      \\"minimalist\\",\\n      \\"The Resilient Mind\'s \'Calm Authority\' aesthetic\\",\\n      \\"soft, naturalistic lighting\\"\\n    ],\\n    \\"camera_movement\\": [\\n      \\"slow, steady forward dolly\\",\\n      \\"wide shot\\"\\n    ],\\n    \\"audio\\": {\\n      \\"music\\": \\"Calm, ambient, focus-enhancing background music, low in the mix.\\",\\n      \\"ambient_sound\\": \\"complete silence, absence of forest sounds\\",\\n      \\"sound_effects\\": [\\n        \\"none\\"\\n      ]\\n    },\\n    \\"negative_prompt\\": \\"cartoon, animated, stylized, illustration, low-resolution, blurry, morphing artifacts, distorted features, unrealistic movement, fast motion, shaky cam, text, watermark, humans, animals, stressed office workers, corporate stock photos, cluttered backgrounds, jarring colors.\\"\\n  }"},"videoModelKey":"veo_3_0_t2v_fast","metadata":{"sceneId":"a0981b9c-97d8-4959-abf6-0b3ce8542e80"}}]}'
```

This cURL command is the core API call that actually generates a video using Google's Veo 3 model. Unlike the previous requests that were interacting with the web application's own backend, this one calls a powerful, general-purpose Google Cloud API endpoint. It's the most complex and secure of the three.

Here’s the analysis:

## 2. ANALYSIS
---

### The Absolute Core of the Request 🚀

These are the non-negotiable components. Without them, the request is dead on arrival.

- **`authorization: Bearer ya29.a0...`**: **This is the single most important header.** It completely replaces the cookie-based authentication from the previous examples. This is an **OAuth 2.0 Bearer Token**. Think of it as a temporary, high-security key 🔑 that the `labs.google` website gets from Google's authentication system on your behalf. It proves not only _who you are_ but also that you have granted the "Google Labs" application permission to perform this action. This token is short-lived and is the standard for modern, secure API communication.
    
- **`--data-raw '{...}'`**: This is the **payload**, containing the detailed instructions for the video generation. It tells the API everything it needs to know.
    
    - **`clientContext`**: Identifies the user's project (`projectId`), the tool being used (`"PINHOLE"` which is likely the internal name for Flow), and the user's subscription tier.
        
    - **`requests`**: An array allowing multiple videos to be generated in one call.
        
    - **`textInput`**: Contains the full, detailed prompt, including the main description, style guides, camera movements, audio instructions, and a negative prompt to exclude unwanted elements.
        
    - **`videoModelKey`: `"veo_3_0_t2v_fast"`**: This is the explicit instruction to use the **Veo 3 model** (specifically, the "fast" text-to-video version).
        

---

### Headers That Make You Look Human (and Legit) 🎭

These headers are crucial for passing the server's security checks and making the request look like it originated from a legitimate browser session on the `labs.google` website.

- **`origin: https://labs.google`**: Essential for Cross-Origin Resource Sharing (CORS). It tells the `googleapis.com` server that the request is allowed because it's coming from the authorized `labs.google` domain.
    
- **`user-agent`**, **`sec-ch-ua-*`**, **`referer`**: These standard headers identify your browser and the page you were on, providing a consistent and believable client signature.
    
- **`sec-fetch-site: cross-site`**: This is a key detail. Unlike the previous `same-origin` requests, this one is correctly identified as `cross-site` because it's going from `labs.google` to a different domain (`googleapis.com`). This accuracy is important for passing modern browser security checks.
    

---

### Google's Special 'Secret Sauce' Headers 🕵️‍♀️

This request includes several custom `x-*` headers. These are likely part of a sophisticated anti-abuse and client-validation system.

- **`x-client-data`**: A Base64-encoded string that likely contains a wealth of client-side telemetry and identifying information.
    
- **`x-browser-validation`**: This looks like a cryptographic signature or hash. It's probably generated by JavaScript running on the page to create a unique "fingerprint" of the request, proving that it hasn't been tampered with and is coming from the genuine web application.
    

**These `x-*` headers are extremely important.** They are almost certainly generated dynamically. Simply copying and pasting them will likely fail after a short time or if any other part of the request changes. Automating a request like this is very difficult precisely because of these dynamic validation headers.

---

### Summary: The Anatomy of a Modern API Call

To make Google's AI sandbox generate a video for you, a request must have:

1. **A valid, unexpired `Authorization: Bearer` token.** This is your primary key.
    
2. **A correctly formatted JSON `payload`** detailing the exact video you want.
    
3. **A full suite of browser-mimicking headers** (`user-agent`, `origin`, etc.) that are internally consistent (e.g., `sec-fetch-site: cross-site`).
    
4. **Proprietary validation headers (`x-client-data`, `x-browser-validation`)** that are dynamically generated by the client-side application.
    

In essence, this request shows a shift from a simple website session (using cookies) to a formal, secure application-to-API transaction (using an OAuth token and client-side validation).

## 3. REQUIREMENTS
### SEED Number Must random 

The `seed` in Veo 3 works just like a world seed in the game Minecraft.

- Entering a specific seed number will always generate the exact same world, with the same mountains, rivers, and caves in the same locations.
    
- Entering a different seed number will create a completely new, unique world.
    

So, the **`seed`** is your key to controlling the creative randomness of the AI. Use it to either lock in a result you love or explore infinite variations of your idea. 🔑

The maximum seed is typically **2,147,483,647**.

### SCENE ID CREATE BY CLIENT 

2a483b8f-f771-47d3-bb04-e45d5d951d7a

That format is a **Universally Unique Identifier (UUID)**, specifically a **Version 4 UUID**.

It's a standard 128-bit number represented as a 32-character hexadecimal string, broken into five groups with the pattern `8-4-4-4-12`. Version 4 UUIDs are generated from random numbers, making them ideal for client-side creation as they don't require a central authority to avoid collisions.

### AUTHORIZATION KEY GET BY CALLING GET AND PROCESS HTML

The Bearer token to add to this call is by using the cookie and making request to the page https://labs.google/fx/tools/flow
Then do the search for it in the script tag like this:


```json
<script id="__NEXT_DATA__" type="application/json">

{"props":{"pageProps":{"session":{"user":{"name":"Hiếu Nguyễn Quang","email":"hieu2906090@gmail.com","image":"https://lh3.googleusercontent.com/a/ACg8ocJt5RuSUQU-1BJNWQbIODzgzXLvq-S9OiiCaFjr4-MIFbJ12_KE=s96-c"},"expires":"2025-10-12T00:48:19.000Z","access_token":"ya29.a0AQQ_BDQBJdMULeuXrGKiDZ3DGmHkwF5UhxJ1TrnbzEiwOEwtq7NNoVvnf8fwAzlGRhDbyNuxSCofjcYKU6hj9gHj601-F5o5PDdsyjmflIWQy31gCv3AfrLK_rTU2XFY1mW5UUAhv6TcCq3SP6UJjRuINr9zDEAKjFe3XxkGISxOeKx08ltXLZa2TBUIVkuM_IHTmlw4rRtcn51dIXQKsOeZQMNKbRfkhYhTe-QLUeoXozo21ijP9pBiSjej6xAUOZ0OG3lf9O5sxtFHeH_itAEFnaftNpqSS926IO3cXjnkkT_kLiAOcajLWBuhieb8fqCR8m-BhXngtkENvW-3xqYx3fHM3kBcfDW-mo0vVZJ2aCgYKAUsSARYSFQHGX2MidE7hJrcQ3OU2YWkJTPecGQ0371"},"_nextI18Next":{"initialI18nStore":{"en":{"common":{"pinhole_minor_harm_upload_error":{"message":"This image might violate our \u003cFAQLink\u003epolicies\u003c/FAQLink\u003e about harmful content related to minors. Please try a different image or send feedback."}

```
