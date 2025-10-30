##

### 1. GET ALL MODEL

```curl
curl 'https://labs.google/fx/api/trpc/videoFx.getVideoModelConfig?input=%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.1.670134567.1761722776; EMAIL=%22admin%401gyga.com%22; _ga_5K7X2T4V16=GS2.1.s1761729438$o2$g0$t1761729454$j44$l0$h0; __Secure-next-auth.callback-url=https%3A%2F%2Flabs.google; __Host-next-auth.csrf-token=bfa2f61f71fda86952d02014b3eb5c02570cf597fe8dabd1e25fc9f06224ea8c%7C5a36603948a46a536d5bb336c8e5ce8fc1659e862047b3546e288aa39ad44c66; _ga_X2GNH8R5NS=GS2.1.s1761807991$o6$g1$t1761808167$j60$l0$h1070605228; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..WyvWzZY_rQBe3Lga.yGzzJACC-mmmEO5I-LvXbZjp4E-0USxhGQ4N_Cw5w98pp9eFLl6_5o_KkfymxvQRSsXSzuBr8_J9GOg3OlmQe75MLYJ0E4IS-gGZo2xmGRzbuk_zQ21snEKHmdBCEnuHe0_e1WUkVaoCGz72HvV1FmCQDnTTmh5nwPWubZM_h45-h7qGGWB8fYwSa_2gjTFypQZ8hCZxMYsonsEk0GJ81vtM-Nw5b89za2IYbQGoVBY6_04kh0tiwtX2RAo3VJ4rI32ykWlZR5GxAF1jFYtOs_edYWv6I9xOr4l3GKp5IDQWbh82rh48XrReuVBcnFDyWJ0w1mCDPSKzqAqf4t-ERHA2QhacOwda85ir_WPMTDSTzm5UCT6ThOCNTw_UQcfgxxifYDVbZYQ14cxTyNoSy3gSGzA3Gt_Ivd2Y7dQtSFBZPdXTph6tdt6kovp-eWcKRKZ81fsbYcxFfzcMQKY3yrDNNVj0_MaPMoZswBp91VGTW37haQv8ESmZK2Qv7IHFznHRddRWSIJGw9q4xUWvFf_b_qguoYS8rQR0ADYoH-Nf0G88FmQr8p4HgqBT69uLU993krPCXr1YvarWHQC0xqqJXmX_ohSM8St1VWMef7ZRfyJG-aj8fPpAJl8O-Juex-u8kPJlMQYS1eqVxT97I1QL5neZZdc_ZN-KOYgQ8JJ6O9wBxxC0NS6L1hLoFIpRRN_uucs34j34XfmAInKJ8oxNVTmNRrVL9rndY85F9D0C1U5hf5lRDZlv2QW86gBAUTdlPB_CZjU8XGjq3Y5mXR1u9IOjK6rE45Mn5oqhHmDU51le8cv1aqWJMSJGQrh9Esfj2Moog9oTHXsO_xhM5Ihf1RNg_hn7l6kRT9j6_Eue6bqdcv2iIr155YvL5-yv3XgOuOakM1Ia-yXJXDruNVtNziRSJJqDvkrtYp1Cyfu0jN5dl8TIWdORMrxL6JEWSXXYpMrLX9GDmbcqP9s.ooKLjJa84CgoruE1M7cFlw' \
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

RESPONSE

```json
{
  "result": {
    "data": {
      "json": {
        "result": {
          "videoModels": [
            {
              "key": "veo_3_0_t2v_fast_portrait_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 3 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_t2v_fast_portrait_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_t2v_fast_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 3 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_t2v_fast_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_t2v_fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 3 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s_fast_portrait_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_i2v_s_fast_portrait_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s_fast_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_i2v_s_fast_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s_fast_ultra_fl",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_1_i2v_s_fast_portrait_ultra_fl",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_r2v_fast_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_MULTI_REFERENCE_NO_STYLE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_r2v_fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_MULTI_REFERENCE_NO_STYLE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "displayName": "Veo 3.1 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_i2v_s_fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s_fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_t2v_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_t2v_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_0_t2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_t2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_1_i2v_s_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_i2v_s_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_i2v_s",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              },
              "modelStatus": "MODEL_STATUS_DEPRECATED"
            },
            {
              "key": "veo_3_1_i2v_s_fl",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_1_i2v_s_portrait_fl",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE", "VIDEO_MODEL_CAPABILITY_AUDIO"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 210,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_2_1_fast_d_15_t2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_2_1_fast_d_15_i2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_2_1_fast_d_15_with_video_extension",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_3_1_extend_fast_landscape_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_2_1_fast_d_15_with_start_image_and_end_image_interpolation",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE_AND_END_IMAGE"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 90,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_3_1_extend_fast_landscape",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_1_extend_fast_portrait_ultra",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_3_1_extend_fast_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_2_r2v_fast",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_MULTI_REFERENCE"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 150,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_2_0_t2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_TEXT"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 190,
              "displayName": "Veo 2 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_2_0_i2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_START_IMAGE"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 150,
              "displayName": "Veo 2 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "modelQuality": "MODEL_QUALITY_HIGH",
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_3_1_extend_landscape",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_2_camera_control",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_CAMERA_CONTROL"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 150,
              "displayName": "Veo 2 - Fast",
              "creditCost": 10,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_3_1_extend_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_VIDEO_EXTENSION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 3.1 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Beta Audio"
              }
            },
            {
              "key": "veo_2_r2v",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_MULTI_REFERENCE"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 300,
              "displayName": "Veo 2 - Quality",
              "creditCost": 100,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_TWO",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "Support Ending Soon"
              }
            },
            {
              "key": "veo_2_1080p_upsampler_8s",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_UPSCALING"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 100,
              "displayName": "Veo 2 - Upsampler",
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {
                "veoModelName": "No Audio"
              }
            },
            {
              "key": "veo_2_0_object_insertion_landscape",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_LANDSCAPE"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_OBJECT_INSERTION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 2 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {}
            },
            {
              "key": "veo_2_0_object_insertion_portrait",
              "supportedAspectRatios": ["VIDEO_ASPECT_RATIO_PORTRAIT"],
              "accessType": "MODEL_ACCESS_TYPE_GENERAL",
              "capabilities": ["VIDEO_MODEL_CAPABILITY_OBJECT_INSERTION"],
              "videoLengthSeconds": 8,
              "videoGenerationTimeSeconds": 120,
              "displayName": "Veo 2 - Fast",
              "creditCost": 20,
              "framesPerSecond": 24,
              "paygateTier": "PAYGATE_TIER_ONE",
              "modelAccessInfo": {},
              "modelMetadata": {}
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
