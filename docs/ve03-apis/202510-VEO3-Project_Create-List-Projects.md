---
created_date: 2025-10-11
modified_date: 2025-10-11
tags:
cssclasses:
---

# I. CREATE PROJECT

CURL create:

```curl
give me idea of those request heder:

curl 'https://labs.google/fx/api/trpc/project.createProject' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b '[REDACTED_COOKIES_AND_SESSION_TOKENS]' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36' \
  --data-raw '{"json":{"projectTitle":"Oct 11 - 09:48","toolName":"PINHOLE"}}'

what is important, what should i kept to make google know i am currently on a browser
```

This cURL command is an API request to create a project in a Google Labs tool, likely "Flow." Let's break down what these headers do and which ones are most important for making the request look like it's coming from a real browser.

---

### What's Important and Why

The headers can be grouped into a few categories. Some are absolutely essential, while others are important for mimicking a browser and avoiding being blocked.

#### 🕵️‍♂️ The "Must-Haves" for Authentication and Functionality

These are the parts you absolutely cannot remove, or the request will fail immediately. They are your digital ID card and key.

- **`Cookie` (-b flag):** **This is the single most important part.** It contains your session information. Think of it as the temporary keycard you get after logging in.
  - `__Secure-next-auth.session-token`: This is your **authentication token** 🔑. It's the primary piece of data that proves to Google you are a logged-in user. Without a valid and unexpired token, the server will reject your request with a "401 Unauthorized" error.
  - `__Host-next-auth.csrf-token`: This is a **Cross-Site Request Forgery** token. It's a security measure to ensure the request is coming from Google's own web application and not a malicious third-party site.
- **`content-type: application/json`:** This tells the server that the data you're sending in the request body (`--data-raw`) is in JSON format. The server needs this to understand and process your request correctly.
- **`--data-raw '{"json":{...}}'`:** This is the payload, the actual information for the project you want to create. It's not a header, but it's essential for the request's purpose.

---

### How to Look Like a Real Browser

These headers help you mimic a legitimate browser session. If you remove them, an automated system might flag your request as coming from a bot or a script.

#### Highly Recommended to Keep:

- **`user-agent`:** This string identifies your browser and operating system (in this case, Chrome 140 on Windows 10). It's one of the first things a server checks to see what kind of client is making the request.
- **`origin: https://labs.google`:** This header indicates that the request is originating from the `labs.google` website itself. This is a crucial security check for APIs (related to CORS).
- **`referer: https://labs.google/fx/tools/flow`:** This tells the server which page you were on when you made the request. It provides context and is often checked as part of security validation.
- **`sec-ch-ua-*` Headers (Client Hints):**
  - `sec-ch-ua: "Google Chrome";v="141", ...`
  - `sec-ch-ua-mobile: ?0`
  - `sec-ch-ua-platform: "Windows"`
  - These are a more modern and detailed version of the `user-agent`. They provide structured information about the browser. It's important that these headers **are consistent** with your `user-agent` string.

#### Good to Keep for Consistency:

- **`sec-fetch-*` Headers:**
  - `sec-fetch-dest: empty`
  - `sec-fetch-mode: cors`
  - `sec-fetch-site: same-origin`
  - These headers give the server context about the request's intent. For example, `same-origin` confirms the request is being made to the same site you're supposedly on, and `cors` indicates it's a cross-origin request handled by JavaScript's `fetch` API. They are part of a modern security feature called Fetch Metadata.
- **`accept` & `accept-language`:** These tell the server what kind of content you can handle (`*/*` means anything) and your preferred language (`en-US`). While less critical for authentication, removing them makes your request look less like a real browser's.

### Summary: What to Keep to Mimic a Browser

To make Google believe this request is coming from a real browser session, you must keep the following:

1. **The entire `Cookie` string:** Most importantly, the `__Secure-next-auth.session-token`. This is non-negotiable.
2. **`user-agent`:** A standard and believable browser string.
3. **The `sec-ch-ua-*` headers:** They must be consistent with the `user-agent`.
4. **`origin` and `referer`:** These are critical for passing security checks.
5. **`content-type`:** Required for the server to understand your data payload.

# II. LIST PROJECTS

```curl
curl 'https://labs.google/fx/api/trpc/project.searchUserProjects?input=%7B%22json%22%3A%7B%22pageSize%22%3A20%2C%22toolName%22%3A%22PINHOLE%22%2C%22cursor%22%3Anull%7D%2C%22meta%22%3A%7B%22values%22%3A%7B%22cursor%22%3A%5B%22undefined%22%5D%7D%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.1.208900459.1761586137; EMAIL=%22hieu2906090%40gmail.com%22; __Secure-next-auth.callback-url=https%3A%2F%2Flabs.google; __Host-next-auth.csrf-token=849f6a53f247e625d29ceef28de1e98e985e26fec68d001d66bdb830a67d9112%7C780a5ac7b553e7021dbaf04d997ded10155ff27b92dc4eb16c308cc057da10b0; _ga_X2GNH8R5NS=GS2.1.s1761728601$o4$g1$t1761730708$j60$l0$h787703525; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..B0jhFTieWrXOLC_d.HuwRJojD-54zCO7KZinEVBUTasOq2XaUYiGAmOJN_wbmU7wwnffqBONIsoTV8rANpZtWW1qqF0tobc6agRG2E41dBeTwij2AWuGn7WEoBWQ6j8DW1q24fS-mLcFJ5I-EKCuM1ZJai97BtQbFZHB5m3eM7eEbFAPlU03WQ4teQxexjaXC7VUp15WfyGT8eZQrQ5WdS7XK9UqSIklFgEGxeiAnHhqcnLgqzpdBzvOss3PZww8NAFXX551zCLvpbbyVwA6Ab-YvLVUFtHf04FNMtG5nvG8axhefXaQKJlPcNOo6wGb8M2DEIB6EvErSSN6NCaUuIVSQOveg3o3_UK3ZMF5llZLXnOU32fTFZZtNYhHrFcSv1QiJzhtiLpsvjz9fxquIsJyL5uhw9HXfBUvH2QDWnuNSrsgDKIvdMMu6i1XGyx0W8h6Hiui-oyqImDr3Mb9yNWbJVSsvwfBxYWbpkZRUKAXxH1zTg3D24ZFtBeplPEEZA-eXn50AvyLQkM5U_I6B3aATKS4TsYbu99rZYIl7TltUjqHandhT60pBovVjwZrUXNGcCxdqSZV5Fqca2h1L6bXVQNx0INpfkuR9YJIE2iWib26mdDh4KvDuI_6gzDJukmLOAzeJdiK2r2KVFsipSMOZBwnCJ-kIU9_M_jkbpE-767X-EZeSgml77IlpbXVDZ2LEePzLl_ClUqD_jPXYY2EORUylwB-w3kjpdtSiKWAAjL1vjdvxWXo065qUWtKC0v9WW2uCuQXQUTo4rgXM0aXbTNDVjlHL1SwpmZawh9no9ZIoj9lTlPAE32gZrNLkifFcjIoqFGcyQf4Ewp5vvNwCXztTTlDX7uzcukTPuyqp7n3hbgX988EQYyDu47ndwaxKLShagszVOyzP_0UcZkuiTRZRmMb0reI6WvwbjZEdWje6k-4Lf6RXogxBW1nBXS-JTX0S516UdTaJC9XF9LMmylWZ5BVeuOZjjbVIiQSJiUYz4q_M1JCg-0cZSNyc.JpjuX9GeADzAxEoQN7joUw' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
```

SAMPLE RETURN JSON:

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "projects": [
            {
              "projectId": "bda2c9bf-0cf7-46fa-92ec-988eda900635",
              "projectInfo": {
                "projectTitle": "HieuNewTest"
              },
              "creationTime": "2025-10-28T21:04:34.533197Z"
            },
            {
              "projectId": "89cbe20c-df15-40fb-a0c9-f5bee2f4567e",
              "projectInfo": {
                "projectTitle": "Oct 28 - 00:29",
                "thumbnailMediaKey": "CAUSJDg5Y2JlMjBjLWRmMTUtNDBmYi1hMGM5LWY1YmVlMmY0NTY3ZRokMGQ5OWQzNzUtMjM0NS00YTgzLWFjN2EtMDk5M2VhNDI5MjcyIgNDQUUqJGE0MDQzMjJjLTA0Y2EtNDNlMy04ZWQ1LWYxNDc5MzVlMzEzOA"
              },
              "creationTime": "2025-10-27T17:29:04.716338Z"
            },
            {
              "projectId": "3afb1f80-ca7d-4b33-8318-35dd3cf0d714",
              "projectInfo": {
                "projectTitle": "Test Update",
                "thumbnailMediaKey": "CAUSJDNhZmIxZjgwLWNhN2QtNGIzMy04MzE4LTM1ZGQzY2YwZDcxNBokNTA5M2JmZGQtNzA5Zi00ZjkxLWI3ZWYtMTU3MWExYThhZTdhIgNDQUUqJGI1ZDgwMTA4LWJiMjMtNDM2Mi1iNWJjLTUyMTVhMzBiOThjMA"
              },
              "creationTime": "2025-10-02T12:37:05.826225Z"
            },
            {
              "projectId": "f438099f-0cd5-4580-b648-5702ddda87bd",
              "projectInfo": {
                "projectTitle": "Oct 02 - 18:16"
              },
              "creationTime": "2025-10-02T11:16:20.016174Z"
            },
            {
              "projectId": "29232cf9-3d1e-4904-b7cc-241d12e42a69",
              "projectInfo": {
                "projectTitle": "Sep 30 - 07:08"
              },
              "creationTime": "2025-09-30T00:08:24.994280Z"
            },
            {
              "projectId": "bdc79e1c-4d5e-41e2-bac4-382fe20e9016",
              "projectInfo": {
                "projectTitle": "Buddh_Episode01",
                "thumbnailMediaKey": "CAUSJGJkYzc5ZTFjLTRkNWUtNDFlMi1iYWM0LTM4MmZlMjBlOTAxNhokYTI1MGVhNDktNGUwNS00Y2JjLTk5ZGEtYjczN2I3OWIyOTc3IgNDQUUqJDA4MTg4NDRkLTFmZTYtNGMwYy1iNDBiLTE4YzUwZTNkOWZmOA"
              },
              "creationTime": "2025-09-29T23:57:42.910684Z",
              "scenes": [
                {
                  "sceneId": "45edf953-a95d-4001-8a58-ca545c9c254e",
                  "sceneName": "Initial Scene - 7:10:26 PM",
                  "clips": [
                    {
                      "clipId": "CAUSJGJkYzc5ZTFjLTRkNWUtNDFlMi1iYWM0LTM4MmZlMjBlOTAxNhokYTI4YTk5NTEtMzMzYi00NTE1LTkyYmItOTQwZDZiZjhiMWU2IgNDQUUqJDBmYjI3NjYwLWE3NzctNDYzNS1iMWNmLTBlM2ZiMzQzZDVmYQ",
                      "startTime": "0s",
                      "endTime": "8s"
                    },
                    {
                      "clipId": "CAUSJGJkYzc5ZTFjLTRkNWUtNDFlMi1iYWM0LTM4MmZlMjBlOTAxNhokMTllZGZmOGQtNjAzMi00M2UwLWJhZDYtOTJhMmExZjg5ODc5IgNDQUUqJGMxMzBhNzBhLWY0OTYtNDE4Yi04YTJhLWM1MzYxMjg3OGMyOA",
                      "startTime": "0s",
                      "endTime": "8s"
                    }
                  ],
                  "createTime": "2025-10-02T12:10:26.647463Z"
                }
              ]
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

This cURL command is a `GET` request designed to fetch a list of your existing projects from Google's "Flow" tool. Unlike the previous "create" request, which sent data in the body, this one sends its parameters directly in the URL.

Let's break down what's important for it to work and look authentic.

---

### 🕵️‍♂️ The Mission-Critical Components

These are the non-negotiable parts. If any of these are missing or incorrect, the request will fail.

- **The URL Itself:** The entire URL is essential.
  - **Endpoint:** `https://labs.google/fx/api/trpc/project.searchUserProjects` specifies the exact action: search user projects.
  - **`?input=...` Parameter:** This URL-encoded string is the query. Decoded, it looks like this:
    JSON
    ```
    {
      "json": {
        "pageSize": 20,
        "toolName": "PINHOLE",
        "cursor": null
      },
      "meta": {
        "values": {
          "cursor": ["undefined"]
        }
      }
    }
    ```
    This tells the server you want the first `20` projects from the tool named `PINHOLE`. `cursor: null` indicates you're starting from the beginning of the list.
- **Cookie (-b flag):** This is your **digital passport**. It's the most crucial part for proving your identity to the server.
  - `__Secure-next-auth.session-token`: This is your **authentication key** 🔑. Without a valid, unexpired token, Google has no idea who you are and will deny the request.
  - `__Host-next-auth.csrf-token`: The security token that proves the request originated from Google's own website, preventing certain types of attacks.

---

### 🎭 Headers for Looking Human

These headers make your request appear as if it's coming from a standard web browser, which helps avoid being blocked by security systems.

- **`user-agent`:** Identifies you as a specific browser (Chrome 141 on Windows). A missing or unusual User-Agent is a major red flag for bot detection.
- **`referer: https://labs.google/fx/tools/flow`:** Tells the server you're making this request from the "Flow" tool's web page. This provides essential context and is often checked by servers.
- **`sec-ch-ua-*` Headers:** These "Client Hints" provide a more detailed, modern version of the `user-agent` and should always be consistent with it.
- **`sec-fetch-*` Headers:** These provide security context, indicating that the request is a standard API call (`cors`, `same-origin`) initiated from the website.

---

### ✨ New Headers in This Request

This request includes two headers that are important for data freshness.

- **`cache-control: no-cache`** and **`pragma: no-cache`:** These headers explicitly tell the server (and any proxies in between) not to send you a stale, cached copy of the data. You are demanding the **most up-to-date list** of your projects, which is exactly what a user refreshing a page would want.

### Summary: What to Keep

To successfully mimic a browser fetching a list of projects, you **must keep**:

1. **The entire `Cookie` string**, especially the `__Secure-next-auth.session-token` and `__Host-next-auth.csrf-token`.
2. **The full URL with the `input` parameter**, as this defines _what_ you're asking for.
3. **The `user-agent` and `sec-ch-ua-*` headers** to identify as a legitimate browser.
4. **The `referer` header** to provide context.
5. **The `cache-control` and `pragma` headers** to ensure you're getting fresh data, just as a real browser would.

Remember, the session token in the cookie is **temporary** and will expire. You will need to get a new one from your browser's DevTools for future requests.
