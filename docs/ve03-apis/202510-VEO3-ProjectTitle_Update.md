## Update project endpoint and curl

```curl
curl 'https://labs.google/fx/api/trpc/project.updateProject' \
  -H 'accept: */*' \
  -H 'accept-language: en,en-US;q=0.9' \
  -H 'content-type: application/json' \
  -b '_ga=GA1.1.208900459.1761586137; EMAIL=%22hieu2906090%40gmail.com%22; __Secure-next-auth.callback-url=https%3A%2F%2Flabs.google; __Host-next-auth.csrf-token=849f6a53f247e625d29ceef28de1e98e985e26fec68d001d66bdb830a67d9112%7C780a5ac7b553e7021dbaf04d997ded10155ff27b92dc4eb16c308cc057da10b0; _ga_X2GNH8R5NS=GS2.1.s1761728601$o4$g0$t1761728601$j60$l0$h787703525; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..h8dLhs6Fp0T1u96f.EAKvyjhE4EFIEJu-srEJgJUZOZpYY5pFuR4yWYBqQRkhblInngO7XOfN-zifYL9NdHX_23ir9Kpq1kqNGy2o0IqVAu5xs_Uc7y6avdDKQaYZqcAtE-9buo-_RqtwSULXSbzXCbyMhm7nsJpRWqp4k0hSKCG9b82ntFtfOl4UqyEuICSfRryZ1E3ce81RDILdt4AoXPx6H2w9f-e0jsiPzqOZYnG4fW9VywTln_Sl9STwU1r5gY-xJ1zsDTXtnkF27_ECRfBWb1uU_64ABHUqdjpsSGl7YuuL_NCmKRwKkmP2u949CDBm-0rip0jJEBrLbuiBtftu1tmm7jJDdu-Of3CIjlB67ZIGuaXKPQtlCw9nIaLs7-bNWoAjDQHVB_htrkbzPwG1HAYJ9YVuCFH9fRjj3PkPyJ85Es1siJHPvgacjsQCx0b5pNY3mSAGdnyMApBj9K0geambN3Uw23k1r_3PkUJyKE65axWtmLO-x2mUdYFTu7-3i9V8Yu_jgsrVTWAmdyJUmJoSA91sjQIN3JB7EHwDL5CBiINeWig34yCwz8I74P-3iOGOfnb1XUhz-iNzYimn2QhOoNmUsRDkA_MNCup-CFiAbF-QV_CxmHvO2WITWMJBRdULeTd1cTf8dayxCyTNPYwnGMhqUvgFTOJIz2B4Ct34LHLVVRwaP7_iU7oKuAUDjBMes7s5JbPmA1MpG9yvqT3jbm0aWEw82slhhZaymPo5Z-iUNq5O6xle9sMZAEmOzWsiU2PtVcvys_17p9rHoQP4bmEz3G4wGa0p5mAWaZPyZSgpQ-_n7dvs9rekL9IKULAZLgAJbzWDGvq60ACPvmHWl-8TTOGMMWef7fj8MTMdfGG53FR8jQCBqBZApPTvHUWLko0-JDf5n7CwBt8F79osySJ0sf7V8Gt29wBwqPhWVWXErkWaRmc69Lx7GTC8kX4WRLKc8BbjuLVAJe1-5sLj8IDj6w2J73RPmD4Kce_GtLKtAZxgmZg99FUy.XFpBcfr9j1hEuoIoUHfb0A' \
  -H 'origin: https://labs.google' \
  -H 'priority: u=1, i' \
  -H 'referer: https://labs.google/fx/tools/flow' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  --data-raw '{"json":{"projectId":"bda2c9bf-0cf7-46fa-92ec-988eda900635","projectInfo":{"projectTitle":"HieuNewTest"},"updateMasks":["projectTitle"],"toolName":"PINHOLE"}}'
```

PAYLOAD

```json
{
  "json": {
    "projectId": "bda2c9bf-0cf7-46fa-92ec-988eda900635",
    "projectInfo": {
      "projectTitle": "HieuNewTest"
    },
    "updateMasks": ["projectTitle"],
    "toolName": "PINHOLE"
  }
}
```

RESPONSE

```json
{
  "data": {
    "json": {
      "result": {
        "projectTitle": "HieuNewTest"
      },
      "status": 200,
      "statusText": "OK"
    }
  }
}
```
